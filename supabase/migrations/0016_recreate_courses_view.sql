-- 重建 courses_with_count view 把新欄位（single_session_price）也帶進來。
-- PostgreSQL VIEW 的欄位列表在 CREATE 當下就固定，後續 ALTER TABLE
-- 加欄位不會自動進去。要 DROP + 重建。

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
