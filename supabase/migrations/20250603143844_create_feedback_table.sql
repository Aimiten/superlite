-- Create feedback table for user feedback with screenshots
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  company_name TEXT,
  feedback_text TEXT NOT NULL,
  screenshot_url TEXT,
  page_url TEXT NOT NULL,
  browser_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved'))
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create their own feedback
CREATE POLICY "Users can create feedback" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can read all feedback
CREATE POLICY "Service role can read all feedback" ON public.feedback
  FOR SELECT TO service_role
  USING (true);

-- Index for faster queries
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX idx_feedback_status ON public.feedback(status);

-- Create storage bucket for screenshots if not exists
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types)
VALUES (
  'feedback-screenshots',
  'feedback-screenshots', 
  true,
  false,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for feedback screenshots
CREATE POLICY "Authenticated users can upload feedback screenshots" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'feedback-screenshots');

CREATE POLICY "Public can view feedback screenshots" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'feedback-screenshots');

CREATE POLICY "Users can delete their own feedback screenshots" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'feedback-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);