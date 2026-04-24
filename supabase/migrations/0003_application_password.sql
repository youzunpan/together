-- 讓申請者在申請時自己填密碼，審核通過直接建 auth user
ALTER TABLE applications ADD COLUMN IF NOT EXISTS password text;
