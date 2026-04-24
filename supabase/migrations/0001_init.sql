-- profiles
CREATE TABLE profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name   text NOT NULL,
  avatar_letter  text NOT NULL,
  avatar_color   text NOT NULL CHECK (avatar_color IN ('purple','teal','coral','blue','amber','pink')),
  role           text NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin','removed')),
  invited_by     uuid REFERENCES profiles(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- invites
CREATE TABLE invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  created_by  uuid NOT NULL REFERENCES profiles(id),
  used_by     uuid REFERENCES profiles(id),
  note        text,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- sits
CREATE TABLE sits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id),
  duration_min  int NOT NULL CHECK (duration_min BETWEEN 1 AND 240),
  reflection    text CHECK (char_length(reflection) <= 140),
  sat_at        timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- hearts
CREATE TABLE hearts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sit_id      uuid NOT NULL REFERENCES sits(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sit_id, user_id)
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sits     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearts   ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "profiles_read"   ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- invites policies
CREATE POLICY "invites_admin"   ON invites FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- sits policies
CREATE POLICY "sits_read"       ON sits FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sits_insert"     ON sits FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "sits_update"     ON sits FOR UPDATE USING (
  user_id = auth.uid() AND created_at > now() - interval '24 hours'
);
CREATE POLICY "sits_delete"     ON sits FOR DELETE USING (
  user_id = auth.uid() AND created_at > now() - interval '24 hours'
);

-- hearts policies
CREATE POLICY "hearts_read"     ON hearts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "hearts_insert"   ON hearts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "hearts_delete"   ON hearts FOR DELETE USING (user_id = auth.uid());

-- View: sits_with_stats
CREATE VIEW sits_with_stats AS
SELECT
  s.*,
  p.display_name, p.avatar_letter, p.avatar_color,
  COUNT(h.id) AS heart_count,
  BOOL_OR(h.user_id = auth.uid()) AS hearted_by_me
FROM sits s
JOIN profiles p ON p.id = s.user_id
LEFT JOIN hearts h ON h.sit_id = s.id
GROUP BY s.id, p.display_name, p.avatar_letter, p.avatar_color;

-- Function: today_summary
CREATE FUNCTION today_summary() RETURNS json AS $$
  SELECT json_build_object(
    'member_count', COUNT(DISTINCT user_id),
    'total_minutes', COALESCE(SUM(duration_min), 0)
  )
  FROM sits
  WHERE sat_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Taipei');
$$ LANGUAGE sql STABLE SECURITY DEFINER;
