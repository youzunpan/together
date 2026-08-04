-- 每日抽卡：一天一張、108 取 1、純隨機、抽完當天固定。
-- 卡文本身放在 repo 的 lib/cards.ts（id 1–108），DB 只存「誰在哪天抽到哪張」。

CREATE TABLE IF NOT EXISTS daily_cards (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id   int  NOT NULL CHECK (card_id BETWEEN 1 AND 108),
  -- 台北日期。UNIQUE 保證一天只能抽一張（抽完就固定）
  drawn_on  date NOT NULL,
  drawn_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, drawn_on)
);

CREATE INDEX IF NOT EXISTS daily_cards_user_idx ON daily_cards (user_id, drawn_on DESC);

ALTER TABLE daily_cards ENABLE ROW LEVEL SECURITY;

-- 只能讀 / 寫自己的卡
DROP POLICY IF EXISTS "daily_cards_self_read" ON daily_cards;
CREATE POLICY "daily_cards_self_read" ON daily_cards
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "daily_cards_self_insert" ON daily_cards;
CREATE POLICY "daily_cards_self_insert" ON daily_cards
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- sits 可以選擇性附上當天抽到的卡（NULL = 沒附）。
-- 心得、卡片各自獨立；兩個都不附就是一筆純時長紀錄，整筆不上傳則是既有的「不記錄」。
ALTER TABLE sits
  ADD COLUMN IF NOT EXISTS card_id int CHECK (card_id BETWEEN 1 AND 108);

-- sits_with_stats 的欄位在 CREATE 當下就固定，ALTER TABLE 加的 card_id 不會自動進去，
-- 必須 DROP + 重建。以下沿用 0004_reaction_types.sql 的定義原封不動，只靠 s.* 帶進新欄位。
-- （這個 codebase 已經為了 courses_with_count 踩過兩次同樣的坑）
DROP VIEW IF EXISTS sits_with_stats;
CREATE VIEW sits_with_stats AS
SELECT
  s.*,
  p.display_name, p.avatar_letter, p.avatar_color, p.avatar_url,

  COUNT(h.id) FILTER (WHERE h.type = 'sit')                        AS sit_count,
  BOOL_OR(h.user_id = auth.uid() AND h.type = 'sit')               AS sit_by_me,

  COUNT(h.id) FILTER (WHERE h.type = 'heart')                      AS heart_count,
  BOOL_OR(h.user_id = auth.uid() AND h.type = 'heart')             AS heart_by_me,

  COUNT(h.id) FILTER (WHERE h.type = 'smile')                      AS smile_count,
  BOOL_OR(h.user_id = auth.uid() AND h.type = 'smile')             AS smile_by_me

FROM sits s
JOIN profiles p ON p.id = s.user_id
LEFT JOIN hearts h ON h.sit_id = s.id
GROUP BY s.id, p.display_name, p.avatar_letter, p.avatar_color, p.avatar_url;
