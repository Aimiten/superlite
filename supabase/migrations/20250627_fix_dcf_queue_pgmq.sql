-- Fix DCF queue to use pgmq tables
-- Drop old custom implementation
DROP FUNCTION IF EXISTS public.queue_send CASCADE;
DROP FUNCTION IF EXISTS public.queue_pop CASCADE;
DROP FUNCTION IF EXISTS public.queue_archive CASCADE;

-- Create wrapper functions that use pgmq
CREATE OR REPLACE FUNCTION public.queue_send(
  queue_name TEXT,
  message JSONB
) RETURNS BIGINT AS $$
BEGIN
  -- Use pgmq.send for all queues
  RETURN pgmq.send(queue_name, message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.queue_pop(
  queue_name TEXT,
  count INT DEFAULT 1
) RETURNS TABLE (
  msg_id BIGINT,
  read_ct INT,
  enqueued_at TIMESTAMPTZ,
  vt TIMESTAMPTZ,
  message JSONB
) AS $$
BEGIN
  -- Use pgmq.read_with_poll to get and delete messages
  RETURN QUERY SELECT * FROM pgmq.read_with_poll(queue_name, '0 seconds'::interval, count, '0 seconds'::interval);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.queue_archive(
  queue_name TEXT,
  msg_id BIGINT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Use pgmq.archive
  RETURN pgmq.archive(queue_name, msg_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.queue_send TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.queue_pop TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.queue_archive TO anon, authenticated, service_role;

-- Ensure pgmq queue exists for DCF
SELECT pgmq.create_if_not_exists('dcf_analysis_queue');