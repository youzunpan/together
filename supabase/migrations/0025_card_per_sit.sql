-- 抽卡規則從「一天一張」改成「每次靜坐完都能抽一張」。
-- 規則：一次靜坐 = 一次抽卡機會（今天抽的次數 < 今天坐的次數 → 還能抽）。
--
-- 0024 的 UNIQUE (user_id, drawn_on) 是「一天一張」的實作，必須拿掉。
-- drawn_on 保留：用來算「今天抽了幾次」跟卡冊的日期分組。

ALTER TABLE daily_cards
  DROP CONSTRAINT IF EXISTS daily_cards_user_id_drawn_on_key;

-- 拿掉 UNIQUE 之後，原本靠它加速的查詢改用一般 index（0024 已經建過同名的，
-- IF NOT EXISTS 讓這支 migration 可以重複跑）
CREATE INDEX IF NOT EXISTS daily_cards_user_idx ON daily_cards (user_id, drawn_on DESC);
