-- 同心：輕呼喚式的共同靜坐預告。
-- 任何人可以開一場「我幾點要坐 N 分鐘」，其他人可以加入「我也想」，沒有 RSVP 強制力。
-- 過時的呼喚（scheduled_at + duration 結束後 2 小時）由 query 端過濾，資料不刪。

CREATE TABLE sit_calls (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_at  timestamptz NOT NULL,
  duration_min  int NOT NULL CHECK (duration_min BETWEEN 1 AND 240),
  message       text CHECK (char_length(message) <= 80),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sit_calls_scheduled_at_idx ON sit_calls (scheduled_at);

CREATE TABLE sit_call_joins (
  call_id    uuid NOT NULL REFERENCES sit_calls(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (call_id, user_id)
);

ALTER TABLE sit_calls      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sit_call_joins ENABLE ROW LEVEL SECURITY;

-- sit_calls policies
CREATE POLICY "sit_calls_read"   ON sit_calls FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sit_calls_insert" ON sit_calls FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "sit_calls_delete" ON sit_calls FOR DELETE USING (user_id = auth.uid());

-- sit_call_joins policies
CREATE POLICY "sit_call_joins_read"   ON sit_call_joins FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sit_call_joins_insert" ON sit_call_joins FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "sit_call_joins_delete" ON sit_call_joins FOR DELETE USING (user_id = auth.uid());

-- View：每筆呼喚 + 發起人資料 + 加入人數 + 我是否加入
CREATE VIEW sit_calls_with_stats AS
SELECT
  c.*,
  p.display_name, p.avatar_letter, p.avatar_color, p.avatar_url,
  COUNT(j.user_id) AS join_count,
  BOOL_OR(j.user_id = auth.uid()) AS joined_by_me
FROM sit_calls c
JOIN profiles p ON p.id = c.user_id
LEFT JOIN sit_call_joins j ON j.call_id = c.id
GROUP BY c.id, p.display_name, p.avatar_letter, p.avatar_color, p.avatar_url;
