-- 管理員公告：admin 寫一段文字，feed 頂部顯示。同一時間只有 1 則 active。
-- 學生點 ✕ 可以對「該則」收起；admin 換新公告時自動全員可見。

CREATE TABLE IF NOT EXISTS announcements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body         text NOT NULL,
  created_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  active       boolean NOT NULL DEFAULT true,
  expires_at   timestamptz
);

CREATE INDEX IF NOT EXISTS announcements_active_idx
  ON announcements (active, created_at DESC) WHERE active = true;

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read active announcements" ON announcements;
CREATE POLICY "anyone can read active announcements" ON announcements
  FOR SELECT
  USING (active = true);

-- 寫入由 service role 處理（透過 server actions）
