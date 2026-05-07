-- 課程系統：對外公開課程列表 + 報名收件
-- courses：admin 建立、編輯、發布
-- registrations：任何人（登入或未登入）可送出報名，僅 admin 可讀

-- =========================================================
-- courses
-- =========================================================
CREATE TABLE IF NOT EXISTS courses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,                                    -- URL friendly, e.g. "may-2026-basic"
  title           text NOT NULL,                                           -- 顯示標題
  subtitle        text,                                                    -- 副標（可選）
  description     text NOT NULL DEFAULT '',                                -- 課程介紹（純文字、保留換行）
  format          text NOT NULL CHECK (format IN ('online','offline')),    -- 線上 / 實體
  duration_type   text NOT NULL CHECK (duration_type IN ('single','series')), -- 單次 / 長期班
  start_at        timestamptz NOT NULL,                                    -- 開課時間
  end_at          timestamptz,                                             -- 結束時間（series 通常會填）
  schedule_note   text,                                                    -- 上課時間備註，例如「每週三 19:30–21:00」
  location        text,                                                    -- 實體地點 / 線上會議資訊說明
  price_note      text,                                                    -- 費用 + 轉帳資訊
  capacity        int NOT NULL CHECK (capacity > 0),                       -- 名額上限
  cover_image_url text,                                                    -- 封面圖（可選）
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','published','closed')),        -- 草稿 / 公開 / 已截止
  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS courses_status_start_idx
  ON courses (status, start_at DESC);

-- =========================================================
-- registrations
-- =========================================================
CREATE TABLE IF NOT EXISTS registrations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text NOT NULL,
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','confirmed','cancelled')),
  note        text,                                                        -- 學員備註（保留欄位，目前表單沒收）
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS registrations_course_idx
  ON registrations (course_id, created_at DESC);

-- 同一個 email 不能重複報同一堂課（軟性防呆，cancelled 不算）
CREATE UNIQUE INDEX IF NOT EXISTS registrations_unique_active_idx
  ON registrations (course_id, lower(email))
  WHERE status <> 'cancelled';

-- =========================================================
-- View：courses + 已報名人數 + 剩餘名額
-- 只暴露 published / closed 課程，draft 不會透過 view 漏給 anon。
-- admin 後台改為直接 query courses 表 + 自行算 count。
-- =========================================================
DROP VIEW IF EXISTS courses_with_count;
CREATE VIEW courses_with_count AS
SELECT
  c.*,
  COALESCE(COUNT(r.id) FILTER (WHERE r.status <> 'cancelled'), 0)::int AS registered_count,
  GREATEST(c.capacity - COALESCE(COUNT(r.id) FILTER (WHERE r.status <> 'cancelled'), 0), 0)::int AS seats_left
FROM courses c
LEFT JOIN registrations r ON r.course_id = c.id
WHERE c.status IN ('published','closed')
GROUP BY c.id;

-- =========================================================
-- updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at_courses()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS courses_set_updated_at ON courses;
CREATE TRIGGER courses_set_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_courses();

-- =========================================================
-- RPC：原子化報名（檢查名額 + insert，避免名額用盡時的競態）
-- 由 server action 透過 service role 呼叫
-- =========================================================
CREATE OR REPLACE FUNCTION register_for_course(
  p_slug  text,
  p_name  text,
  p_email text,
  p_phone text
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_course_id uuid;
  v_capacity  int;
  v_status    text;
  v_count     int;
BEGIN
  SELECT id, capacity, status
    INTO v_course_id, v_capacity, v_status
    FROM courses
    WHERE slug = p_slug
    FOR UPDATE;

  IF v_course_id IS NULL THEN
    RETURN json_build_object('error','course_not_found');
  END IF;

  IF v_status <> 'published' THEN
    RETURN json_build_object('error','course_not_open');
  END IF;

  SELECT COUNT(*) INTO v_count
    FROM registrations
    WHERE course_id = v_course_id AND status <> 'cancelled';

  IF v_count >= v_capacity THEN
    RETURN json_build_object('error','full');
  END IF;

  BEGIN
    INSERT INTO registrations (course_id, name, email, phone)
    VALUES (v_course_id, p_name, p_email, p_phone);
  EXCEPTION
    WHEN unique_violation THEN
      RETURN json_build_object('error','duplicate');
  END;

  RETURN json_build_object('ok', true, 'course_id', v_course_id);
END;
$$;

-- 開放給 anon / authenticated 呼叫（server action 透過 service role 呼叫，這個 grant 是備用）
REVOKE ALL ON FUNCTION register_for_course(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION register_for_course(text, text, text, text) TO anon, authenticated, service_role;

-- =========================================================
-- RLS
-- =========================================================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- courses: 任何人（含未登入）可讀已 published / closed 課程
DROP POLICY IF EXISTS "courses_public_read" ON courses;
CREATE POLICY "courses_public_read" ON courses
  FOR SELECT TO anon, authenticated
  USING (status IN ('published','closed'));

-- courses: admin 可做所有操作
DROP POLICY IF EXISTS "courses_admin_all" ON courses;
CREATE POLICY "courses_admin_all" ON courses
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- registrations: 寫入由 RPC（SECURITY DEFINER）處理，policy 不開直接 INSERT
-- registrations: admin 可讀
DROP POLICY IF EXISTS "registrations_admin_read" ON registrations;
CREATE POLICY "registrations_admin_read" ON registrations
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- registrations: admin 可改狀態 / 刪除
DROP POLICY IF EXISTS "registrations_admin_update" ON registrations;
CREATE POLICY "registrations_admin_update" ON registrations
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "registrations_admin_delete" ON registrations;
CREATE POLICY "registrations_admin_delete" ON registrations
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
