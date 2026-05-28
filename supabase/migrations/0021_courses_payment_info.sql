-- 課程：把「匯款資訊」從 price_note 拆出來成獨立欄位。
-- price_note 留著當「整期費用」的純文字（例：1400/期），匯款帳號 / LinePay
-- 等資訊放到 payment_info，整期 / 單堂都共用顯示。

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS payment_info text;
