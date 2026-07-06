-- UGC Tracker Schema for Supabase
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_id TEXT NOT NULL DEFAULT '',
  instagram_link TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  apps TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'responded', 'working', 'completed', 'rejected')),
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  posts INTEGER DEFAULT 0,
  related_creators UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded BOOLEAN DEFAULT FALSE,
  responded_at TIMESTAMPTZ,
  response_text TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'responded'))
);

CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creators_status ON creators(status);
CREATE INDEX IF NOT EXISTS idx_creators_instagram_id ON creators(instagram_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_creator_id ON dm_messages(creator_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sent_at ON dm_messages(sent_at);

-- RLS policies (enable row level security if needed)
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (adjust as needed)
CREATE POLICY "Allow all on creators" ON creators FOR ALL USING (true);
CREATE POLICY "Allow all on dm_messages" ON dm_messages FOR ALL USING (true);
CREATE POLICY "Allow all on apps" ON apps FOR ALL USING (true);
