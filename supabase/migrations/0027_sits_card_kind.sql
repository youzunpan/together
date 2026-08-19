-- sits.card_id 對應的是白天卡還是夜晚卡。
-- 沒這欄的話 feed 回查會全部當白天卡，夜卡貼到 sit 記錄後會顯示錯內容。
-- 對稱 0026 對 daily_cards 做的事。

ALTER TABLE sits
  ADD COLUMN IF NOT EXISTS card_kind text
    CHECK (card_kind IN ('day', 'night'));

-- 舊資料都當 day（0026 之前只有白天卡）
UPDATE sits SET card_kind = 'day' WHERE card_id IS NOT NULL AND card_kind IS NULL;

-- sits_with_stats 靠 s.* 帶欄位，ALTER TABLE 加的欄位不會自動進去，要 DROP + 重建。
-- 定義沿用 0024，只更新欄位快照。（同一個坑踩第三次了）
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
