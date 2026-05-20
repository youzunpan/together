-- 同心邀請：發起人開場時/開場後可以邀請特定成員，被邀請者收到 push。
-- joined 還是另一張表（sit_call_joins），「邀請」≠「加入」：被邀請者要自己按加入才會計入。
-- 沒被邀請的人不影響，他們在 /feed 一樣看得到 call、可以自己加入。

CREATE TABLE IF NOT EXISTS sit_call_invites (
  call_id     uuid NOT NULL REFERENCES sit_calls(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (call_id, user_id)
);

CREATE INDEX IF NOT EXISTS sit_call_invites_user_idx ON sit_call_invites (user_id);

ALTER TABLE sit_call_invites ENABLE ROW LEVEL SECURITY;

-- 被邀請者可以讀自己的邀請（用來在 /feed 顯示「你被邀請」badge）
DROP POLICY IF EXISTS "invites_invitee_read" ON sit_call_invites;
CREATE POLICY "invites_invitee_read" ON sit_call_invites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 發起人可以讀自己 call 的所有邀請（用來顯示已邀請名單、排除重複邀請）
DROP POLICY IF EXISTS "invites_creator_read" ON sit_call_invites;
CREATE POLICY "invites_creator_read" ON sit_call_invites
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM sit_calls WHERE id = call_id AND user_id = auth.uid())
  );

-- admin 全讀
DROP POLICY IF EXISTS "invites_admin_read" ON sit_call_invites;
CREATE POLICY "invites_admin_read" ON sit_call_invites
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 發起人可以加邀請（INSERT）
DROP POLICY IF EXISTS "invites_creator_insert" ON sit_call_invites;
CREATE POLICY "invites_creator_insert" ON sit_call_invites
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM sit_calls WHERE id = call_id AND user_id = auth.uid())
    AND invited_by = auth.uid()
  );

-- 發起人可以撤回邀請（DELETE）
DROP POLICY IF EXISTS "invites_creator_delete" ON sit_call_invites;
CREATE POLICY "invites_creator_delete" ON sit_call_invites
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM sit_calls WHERE id = call_id AND user_id = auth.uid())
  );
