-- Create dcf_analysis_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS dcf_analysis_queue (
  msg_id BIGSERIAL PRIMARY KEY,
  read_ct INT DEFAULT 0 NOT NULL,
  enqueued_at TIMESTAMP NOT NULL DEFAULT NOW(),
  message JSONB NOT NULL
);

-- Create archived queue table
CREATE TABLE IF NOT EXISTS dcf_analysis_queue_archive (
  msg_id BIGINT PRIMARY KEY,
  read_ct INT DEFAULT 0 NOT NULL,
  enqueued_at TIMESTAMP NOT NULL,
  archived_at TIMESTAMP NOT NULL DEFAULT NOW(),
  message JSONB NOT NULL
);

-- Create queue_send function
CREATE OR REPLACE FUNCTION public.queue_send(
  queue_name TEXT,
  message JSONB
) RETURNS BIGINT AS $$
DECLARE
  result_id BIGINT;
BEGIN
  IF queue_name = 'dcf_analysis_queue' THEN
    INSERT INTO dcf_analysis_queue (message)
    VALUES (message)
    RETURNING msg_id INTO result_id;
    
    RETURN result_id;
  ELSIF queue_name = 'sales_analysis_queue' THEN
    -- Handle sales analysis queue (if it exists)
    INSERT INTO sales_analysis_queue (message)
    VALUES (message)
    RETURNING msg_id INTO result_id;
    
    RETURN result_id;
  ELSE
    RAISE EXCEPTION 'Unknown queue name: %', queue_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create queue_pop function
CREATE OR REPLACE FUNCTION public.queue_pop(
  queue_name TEXT,
  count INT DEFAULT 1
) RETURNS TABLE (
  msg_id BIGINT,
  enqueued_at TIMESTAMP,
  message JSONB
) AS $$
BEGIN
  IF queue_name = 'dcf_analysis_queue' THEN
    RETURN QUERY
    WITH popped AS (
      SELECT q.msg_id, q.enqueued_at, q.message
      FROM dcf_analysis_queue q
      ORDER BY q.msg_id
      LIMIT count
      FOR UPDATE SKIP LOCKED
    )
    DELETE FROM dcf_analysis_queue
    WHERE msg_id IN (SELECT p.msg_id FROM popped p)
    RETURNING msg_id, enqueued_at, message;
  ELSIF queue_name = 'sales_analysis_queue' THEN
    -- Handle sales analysis queue (if it exists)
    RETURN QUERY
    WITH popped AS (
      SELECT q.msg_id, q.enqueued_at, q.message
      FROM sales_analysis_queue q
      ORDER BY q.msg_id
      LIMIT count
      FOR UPDATE SKIP LOCKED
    )
    DELETE FROM sales_analysis_queue
    WHERE msg_id IN (SELECT p.msg_id FROM popped p)
    RETURNING msg_id, enqueued_at, message;
  ELSE
    RAISE EXCEPTION 'Unknown queue name: %', queue_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create queue_archive function
CREATE OR REPLACE FUNCTION public.queue_archive(
  queue_name TEXT,
  msg_id BIGINT
) RETURNS VOID AS $$
BEGIN
  IF queue_name = 'dcf_analysis_queue' THEN
    -- Archive the message (if it exists in the queue)
    INSERT INTO dcf_analysis_queue_archive (msg_id, read_ct, enqueued_at, message)
    SELECT msg_id, read_ct, enqueued_at, message
    FROM dcf_analysis_queue
    WHERE dcf_analysis_queue.msg_id = queue_archive.msg_id;
    
    -- Delete from main queue
    DELETE FROM dcf_analysis_queue
    WHERE dcf_analysis_queue.msg_id = queue_archive.msg_id;
  ELSIF queue_name = 'sales_analysis_queue' THEN
    -- Handle sales analysis queue archive
    INSERT INTO sales_analysis_queue_archive (msg_id, read_ct, enqueued_at, message)
    SELECT msg_id, read_ct, enqueued_at, message
    FROM sales_analysis_queue
    WHERE sales_analysis_queue.msg_id = queue_archive.msg_id;
    
    DELETE FROM sales_analysis_queue
    WHERE sales_analysis_queue.msg_id = queue_archive.msg_id;
  ELSE
    RAISE EXCEPTION 'Unknown queue name: %', queue_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.queue_send TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.queue_pop TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.queue_archive TO anon, authenticated, service_role;

-- Create cron job to process DCF queue
-- This requires pg_cron extension which should be enabled in Supabase
SELECT cron.schedule(
  'process-dcf-analysis-queue',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://rmkleyyzieacwltcbgzs.supabase.co/functions/v1/process-dcf-analysis-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.anon_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Add comment to document the purpose
COMMENT ON TABLE dcf_analysis_queue IS 'Queue for DCF scenario analysis processing';
COMMENT ON FUNCTION queue_send IS 'Add message to specified queue';
COMMENT ON FUNCTION queue_pop IS 'Retrieve and remove messages from specified queue';
COMMENT ON FUNCTION queue_archive IS 'Archive processed message from queue';