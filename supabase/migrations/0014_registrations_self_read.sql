-- 學生可以讀自己的報名紀錄（給 /me/courses 用）
-- 之前 RLS 只允許 admin 讀 registrations，普通學生會撈到空列表。
-- match by user_id（已綁定）或 email（沒綁定的舊紀錄）。

DROP POLICY IF EXISTS "registrations_self_read" ON registrations;
CREATE POLICY "registrations_self_read" ON registrations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR lower(email) = lower(COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), ''))
  );
