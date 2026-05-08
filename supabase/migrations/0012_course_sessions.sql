-- 課程的「每堂課」獨立資料：series 課可以有多個不連續的上課日期
-- 取代原本 schedule_note 純文字描述。courses.start_at / end_at 改由 trigger 自動同步。

CREATE TABLE IF NOT EXISTS course_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session_at   timestamptz NOT NULL,
  duration_min int CHECK (duration_min IS NULL OR duration_min > 0),
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS course_sessions_course_at_idx
  ON course_sessions (course_id, session_at);

-- RLS
ALTER TABLE course_sessions ENABLE ROW LEVEL SECURITY;

-- 任何人可讀屬於 published / closed 課程的 sessions
DROP POLICY IF EXISTS "course_sessions_public_read" ON course_sessions;
CREATE POLICY "course_sessions_public_read" ON course_sessions
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_sessions.course_id
        AND c.status IN ('published','closed')
    )
  );

-- admin 可做所有操作
DROP POLICY IF EXISTS "course_sessions_admin_all" ON course_sessions;
CREATE POLICY "course_sessions_admin_all" ON course_sessions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =========================================================
-- Trigger：自動同步 courses.start_at / end_at = min/max(session_at)
-- 若 sessions 全部刪光，start_at 保留原值（避免破壞 NOT NULL）
-- =========================================================
CREATE OR REPLACE FUNCTION sync_course_dates_from_sessions()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_course_id uuid;
  v_min       timestamptz;
  v_max       timestamptz;
BEGIN
  v_course_id := COALESCE(NEW.course_id, OLD.course_id);

  SELECT MIN(session_at), MAX(session_at)
    INTO v_min, v_max
    FROM course_sessions
    WHERE course_id = v_course_id;

  UPDATE courses
  SET
    start_at = COALESCE(v_min, start_at),
    end_at   = v_max
  WHERE id = v_course_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS course_sessions_sync ON course_sessions;
CREATE TRIGGER course_sessions_sync
  AFTER INSERT OR UPDATE OR DELETE ON course_sessions
  FOR EACH ROW EXECUTE FUNCTION sync_course_dates_from_sessions();
