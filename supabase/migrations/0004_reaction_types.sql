-- 反應類型：sit（靜坐剪影）/ heart（愛心）/ smile（微笑）
-- 每位使用者對同一個 sit 每種類型最多一次。

ALTER TABLE hearts ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'sit';
ALTER TABLE hearts ADD CONSTRAINT hearts_type_check
  CHECK (type IN ('sit', 'heart', 'smile'));

-- 捨棄舊的 (sit_id, user_id) 唯一鍵（名稱依 Postgres 預設）
ALTER TABLE hearts DROP CONSTRAINT IF EXISTS hearts_sit_id_user_id_key;
ALTER TABLE hearts ADD CONSTRAINT hearts_sit_user_type_key
  UNIQUE (sit_id, user_id, type);

-- 重建 view：每種反應各自的 count 與 by_me
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
