-- Analytics views for free calculator monitoring

-- Drop existing views if they exist
DROP VIEW IF EXISTS error_summary;
DROP VIEW IF EXISTS usage_analytics;

-- Error tracking view
CREATE VIEW error_summary AS
SELECT 
  DATE(created_at) as date,
  edge_function,
  error_message,
  COUNT(*) as error_count,
  COUNT(DISTINCT search_term) as unique_searches
FROM free_calculator_errors
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), edge_function, error_message
ORDER BY date DESC, error_count DESC;

-- Usage analytics view
CREATE VIEW usage_analytics AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_calculations,
  COUNT(DISTINCT business_id) as unique_companies,
  COUNT(DISTINCT company_name) as unique_names,
  COUNT(rating) as ratings_given,
  AVG(rating)::decimal(2,1) as avg_rating,
  -- Performance metrics
  COUNT(CASE WHEN (calculations->>'avgRevenue')::numeric > 0 THEN 1 END) as successful_calculations,
  AVG(CASE WHEN (calculations->>'avgRevenue')::numeric > 0 
      THEN (calculations->>'avgRevenue')::numeric 
      ELSE NULL END)::decimal(12,2) as avg_company_revenue
FROM free_calculator_results
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Grant permissions
GRANT SELECT ON error_summary TO authenticated;
GRANT SELECT ON usage_analytics TO authenticated;