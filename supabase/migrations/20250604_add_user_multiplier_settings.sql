-- Create user_multiplier_settings table for storing user's preferred multiplier settings
CREATE TABLE IF NOT EXISTS user_multiplier_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('ai', 'manual')),
  custom_multipliers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id (one setting per user)
CREATE UNIQUE INDEX IF NOT EXISTS user_multiplier_settings_user_id_idx ON user_multiplier_settings(user_id);

-- Enable RLS
ALTER TABLE user_multiplier_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own multiplier settings" ON user_multiplier_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own multiplier settings" ON user_multiplier_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own multiplier settings" ON user_multiplier_settings
  FOR UPDATE USING (auth.uid() = user_id);