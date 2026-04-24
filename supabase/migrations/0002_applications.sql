-- 切換邀請制 → 申請審核制

-- drop invites table
DROP POLICY IF EXISTS "invites_admin" ON invites;
DROP TABLE IF EXISTS invites;

-- applications
CREATE TABLE applications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  display_name  text NOT NULL,
  note          text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by   uuid REFERENCES profiles(id),
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX applications_email_pending_idx
  ON applications (lower(email)) WHERE status IN ('pending','approved');

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 任何人都可以送出申請（就算沒登入）
CREATE POLICY "applications_insert_anon"
  ON applications FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 只有 admin 可以看 / 審核
CREATE POLICY "applications_admin_select"
  ON applications FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "applications_admin_update"
  ON applications FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "applications_admin_delete"
  ON applications FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 移除 profiles.invited_by（已不需要）
ALTER TABLE profiles DROP COLUMN IF EXISTS invited_by;
