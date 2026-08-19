-- 抽卡分成日／夜兩套：
--   19:00 前坐 → 白天卡（意圖、方向）
--   19:00 後坐 → 夜晚卡（回看、反問）
-- 一次靜坐 = 一次抽卡機會（規則不變），只是根據時段從不同的池抽。

ALTER TABLE daily_cards
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'day'
    CHECK (kind IN ('day', 'night'));

-- 舊資料一律當白天卡。它們是「彩虹卡 108 · 溫柔指引卡」的抽卡，
-- 新的日夜版本上線後就轉為 day，向下相容不會壞。
UPDATE daily_cards SET kind = 'day' WHERE kind IS NULL;

-- 之前 0025 拿掉了 UNIQUE (user_id, drawn_on)，改成「一次靜坐 = 一次抽卡」，
-- 這個規則不變，不需要 (user_id, drawn_on, kind) 之類的新 UNIQUE。
-- 加個查詢用的 index：卡冊按時間排、想篩日/夜時走這條。
CREATE INDEX IF NOT EXISTS daily_cards_user_kind_idx
  ON daily_cards (user_id, kind, drawn_at DESC);
