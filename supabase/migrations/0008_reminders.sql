-- Reminder 機制：
-- A. Streak-saver：連續坐 ≥ 3 天但今天還沒坐的人，晚上 9 點推一次
-- B. Personal rhythm：使用者自選 'morning' (8 點) / 'evening' (21 點) / 'off'
--    A 跟 B 在 21 點重疊時，A 優先（訊息更有意義）
-- 防重發：reminder_log 紀錄當日已推過

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reminder_time text NOT NULL DEFAULT 'off';

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_reminder_time_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_reminder_time_check
  CHECK (reminder_time IN ('off', 'morning', 'evening'));

CREATE TABLE IF NOT EXISTS reminder_log (
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  kind        text NOT NULL,
  PRIMARY KEY (user_id, sent_at)
);

CREATE INDEX IF NOT EXISTS reminder_log_user_recent_idx
  ON reminder_log (user_id, sent_at DESC);

ALTER TABLE reminder_log ENABLE ROW LEVEL SECURITY;
-- 只允許 admin 讀（debugging 用），寫入由 service role 處理
DROP POLICY IF EXISTS "admin can read reminder_log" ON reminder_log;
CREATE POLICY "admin can read reminder_log" ON reminder_log
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
