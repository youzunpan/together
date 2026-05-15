-- sit 回應功能：學生可以對別人的 sit 留一句話（40 字內）
-- 每人對同一筆 sit 最多 1 則回應，可自行刪除
-- 公開：所有 authenticated 都能讀

CREATE TABLE IF NOT EXISTS sit_replies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sit_id      uuid NOT NULL REFERENCES sits(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body        text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 40),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sit_id, user_id)
);

CREATE INDEX IF NOT EXISTS sit_replies_sit_idx ON sit_replies (sit_id, created_at);
CREATE INDEX IF NOT EXISTS sit_replies_user_idx ON sit_replies (user_id);

ALTER TABLE sit_replies ENABLE ROW LEVEL SECURITY;

-- 所有登入者可讀
DROP POLICY IF EXISTS "members read all replies" ON sit_replies;
CREATE POLICY "members read all replies" ON sit_replies
  FOR SELECT TO authenticated USING (true);

-- 只能寫自己的
DROP POLICY IF EXISTS "members write own replies" ON sit_replies;
CREATE POLICY "members write own replies" ON sit_replies
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 只能刪自己的
DROP POLICY IF EXISTS "members delete own replies" ON sit_replies;
CREATE POLICY "members delete own replies" ON sit_replies
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 追蹤每位學生「上次看過自己 sit 收到的回應」的時間
-- 用來算 BottomNav「我」tab 上是否有未讀紅點
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_replies_viewed_at timestamptz NOT NULL DEFAULT now();

-- 補抓「我有多少未讀回應」的 helper view
-- 條件：回應的 sit 是 viewer 本人發的、回應作者不是 viewer 本人、回應 created_at 在
-- viewer last_replies_viewed_at 之後
CREATE OR REPLACE VIEW my_unread_replies AS
SELECT
  s.user_id           AS owner_id,
  COUNT(r.id)::int    AS unread_count
FROM sit_replies r
JOIN sits s ON s.id = r.sit_id
JOIN profiles p ON p.id = s.user_id
WHERE r.user_id <> s.user_id
  AND r.created_at > p.last_replies_viewed_at
GROUP BY s.user_id;
