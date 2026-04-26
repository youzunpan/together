-- Web Push 訂閱：每位使用者每個裝置一筆訂閱。
-- endpoint 是瀏覽器產的 push service URL，全域唯一。
-- 同一使用者不同裝置 → 多筆 row。
-- 取消訂閱或瀏覽器主動失效 → 直接刪 row。

CREATE TABLE push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,
  p256dh      text NOT NULL,           -- public key for payload encryption
  auth        text NOT NULL,           -- auth secret for payload encryption
  user_agent  text,                    -- 給管理用，分得出哪個裝置
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX push_subscriptions_user_id_idx ON push_subscriptions (user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 使用者只能看 / 改 / 刪自己的訂閱
CREATE POLICY "push_subs_select_own" ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "push_subs_insert_own" ON push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subs_delete_own" ON push_subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- 排程通知：登記「在 fire_at 時間，送這份 payload 給這個 user」。
-- 由 cron / edge function 每分鐘掃一次：fire_at <= now() AND sent_at IS NULL → 送出。
-- 失敗的 row 留著 (sent_at IS NULL, error_at NOT NULL)，給 admin 看。

CREATE TABLE push_jobs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fire_at      timestamptz NOT NULL,
  kind         text NOT NULL,          -- 'sit_end' | 'call_start' | 'call_remind'
  payload      jsonb NOT NULL,         -- { title, body, url, ... }
  ref_id       uuid,                   -- 對應的 sit_call.id 或客戶端產的 sit session id
  created_at   timestamptz NOT NULL DEFAULT now(),
  sent_at      timestamptz,
  error_at     timestamptz,
  error_msg    text
);

CREATE INDEX push_jobs_pending_idx
  ON push_jobs (fire_at)
  WHERE sent_at IS NULL AND error_at IS NULL;

CREATE INDEX push_jobs_user_ref_idx
  ON push_jobs (user_id, ref_id)
  WHERE sent_at IS NULL;

ALTER TABLE push_jobs ENABLE ROW LEVEL SECURITY;

-- 一般使用者：只能看 / 取消（刪除）自己未送出的 job
CREATE POLICY "push_jobs_select_own" ON push_jobs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "push_jobs_insert_own" ON push_jobs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_jobs_delete_own" ON push_jobs
  FOR DELETE USING (user_id = auth.uid() AND sent_at IS NULL);

-- service role 用 supabase admin client 操作；不需要額外 policy。
