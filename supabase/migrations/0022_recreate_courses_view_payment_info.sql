-- 0021 在 courses 加了 payment_info，但 courses_with_count view 的欄位
-- 列表在 0016 CREATE 當下就固定了，新欄位不會自動進去。重建 view。

DROP VIEW IF EXISTS courses_with_count;
CREATE VIEW courses_with_count AS
SELECT
  c.*,
  COALESCE(COUNT(r.id) FILTER (WHERE r.status <> 'cancelled'), 0)::int AS registered_count,
  GREATEST(c.capacity - COALESCE(COUNT(r.id) FILTER (WHERE r.status <> 'cancelled'), 0), 0)::int AS seats_left
FROM courses c
LEFT JOIN registrations r ON r.course_id = c.id
WHERE c.status IN ('published','closed')
GROUP BY c.id;
