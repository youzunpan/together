-- 報名綁定學生身分：registrations.user_id
-- 已登入的學生報名時自動填入；匿名報名 (anon) 仍可保留 user_id = NULL。
-- /me/courses 頁面用 user_id 撈使用者的課程清單；/courses/[slug] 用來判斷是否已報名。

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS registrations_user_idx
  ON registrations (user_id, course_id);

-- =========================================================
-- 更新 RPC：接受 p_user_id（已登入學生報名用）
-- 同時擋掉「同一 user 重複報名同一課程」
-- =========================================================
DROP FUNCTION IF EXISTS register_for_course(text, text, text, text, text);

CREATE OR REPLACE FUNCTION register_for_course(
  p_slug            text,
  p_name            text,
  p_email           text,
  p_line_id         text DEFAULT NULL,
  p_transfer_last4  text DEFAULT NULL,
  p_user_id         uuid DEFAULT NULL
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

  -- 若是登入狀態，先擋同帳號重複報名（不分大小寫 email 也順便擋）
  IF p_user_id IS NOT NULL THEN
    PERFORM 1 FROM registrations
      WHERE course_id = v_course_id
        AND user_id = p_user_id
        AND status <> 'cancelled';
    IF FOUND THEN
      RETURN json_build_object('error','duplicate');
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_count
    FROM registrations
    WHERE course_id = v_course_id AND status <> 'cancelled';

  IF v_count >= v_capacity THEN
    RETURN json_build_object('error','full');
  END IF;

  BEGIN
    INSERT INTO registrations (course_id, name, email, line_id, transfer_last4, user_id)
    VALUES (
      v_course_id,
      p_name,
      p_email,
      NULLIF(btrim(p_line_id), ''),
      NULLIF(btrim(p_transfer_last4), ''),
      p_user_id
    );
  EXCEPTION
    WHEN unique_violation THEN
      RETURN json_build_object('error','duplicate');
    WHEN check_violation THEN
      RETURN json_build_object('error','bad_last4');
  END;

  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION register_for_course(text, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION register_for_course(text, text, text, text, text, uuid) TO anon, authenticated, service_role;

-- =========================================================
-- 補登：已存在 user_id IS NULL 但 email 跟 profile email 對得起來的紀錄
-- 自動 backfill 把它們關聯起來
-- =========================================================
UPDATE registrations r
SET user_id = u.id
FROM auth.users u
WHERE r.user_id IS NULL
  AND lower(r.email) = lower(u.email)
  AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);
