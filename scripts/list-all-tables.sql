-- List all tables and views in all schemas
SELECT 
    'TABLE' as type,
    schemaname,
    tablename as name
FROM 
    pg_tables 
WHERE 
    schemaname NOT IN ('pg_catalog', 'information_schema')

UNION ALL

SELECT 
    'VIEW' as type,
    schemaname,
    viewname as name
FROM 
    pg_views
WHERE 
    schemaname NOT IN ('pg_catalog', 'information_schema')

ORDER BY 
    type,
    schemaname, 
    name;