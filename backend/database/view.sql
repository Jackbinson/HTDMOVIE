CREATE VIEW v_trending_shows AS
SELECT 
    s.id, 
    s.title, 
    COUNT(v.id) AS view_count
FROM shows s
JOIN views v ON s.id = v.show_id
WHERE v.watched_at > NOW() - INTERVAL '7 days' -- Trending trong 7 ngày qua
GROUP BY s.id
ORDER BY view_count DESC;