-- 拿掉日夜兩副牌的設計，統一只留一副 108 張。
-- 0026 / 0027 加的 kind 欄位不再有意義。
--
-- 既有的 19 筆 kind='night' 抽卡紀錄（18 筆貼在 sit 上）都是樽自己的，
-- 沒有其他成員受影響。這些紀錄保留，card_id 不動 —— 也就是說卡冊裡那幾張
-- 之後會顯示同編號的白天卡卡文，跟當初抽到的夜晚卡文字不一樣。
-- 這是刻意的：留住「那天抽過卡」的紀錄，比留住已經不存在的卡文重要。
-- 原始資料在刪欄位前已匯出備份（night-cards-backup.json）。

ALTER TABLE daily_cards DROP COLUMN IF EXISTS kind;
DROP INDEX IF EXISTS daily_cards_user_kind_idx;

ALTER TABLE sits DROP COLUMN IF EXISTS card_kind;

-- sits_with_stats 靠 s.* 帶欄位，DROP COLUMN 之後必須重建，否則 view 會壞。
-- 定義沿用 0027，只更新欄位快照。
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
