-- 簡版錯誤追蹤：把伺服器與用戶端錯誤集中寫到一張表，admin 後台可以瀏覽。
-- 由 service role 寫入（繞過 RLS），admin 角色才能讀。

CREATE TABLE IF NOT EXISTS error_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  source      text NOT NULL,                          -- 'server-action' | 'react-error' | 'client' | 'api-route' | 'other'
  route       text,                                    -- 如 /feed、submitApplication
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent  text,
  message     text NOT NULL,
  stack       text,
  meta        jsonb
);

CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON error_logs (created_at DESC);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin can read error_logs" ON error_logs;
CREATE POLICY "admin can read error_logs" ON error_logs
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "admin can delete error_logs" ON error_logs;
CREATE POLICY "admin can delete error_logs" ON error_logs
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 寫入只能由 service role（從 server 透過 SUPABASE_SERVICE_ROLE_KEY），
-- 一般 client 沒有 INSERT 權限。
