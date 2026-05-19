-- 修 0014 的 registrations_self_read：USING 子句裡用了
-- (SELECT email FROM auth.users WHERE id = auth.uid()) 這個子查詢。
-- 這要求 authenticated role 對 auth.users 有 SELECT 權限，但 Supabase
-- 預設沒給。任何走這條 policy 的 query 會 ERROR 42501 permission denied，
-- 連帶讓 admin 讀 registrations 整個炸掉（因為多 policy 評估時，一條
-- error 會讓整個 SELECT 失敗）。
--
-- 改成 auth.jwt() ->> 'email'：直接從 JWT 拿 email、完全不碰 auth.users，
-- 不需要任何 grant，effect 一樣（讓沒綁定 user_id 的舊報名能用 email 對到
-- 當前登入者）。

DROP POLICY IF EXISTS "registrations_self_read" ON registrations;
CREATE POLICY "registrations_self_read" ON registrations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );
