-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table (cached from RAWG API)
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  rawg_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  background_image TEXT,
  released TEXT,
  genres TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quick notes table
CREATE TABLE quick_notes (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  platforms_played TEXT[] DEFAULT '{}',
  playtime_hours DECIMAL(10, 1),
  pros TEXT[] DEFAULT '{}',
  cons TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_quick_notes_game_id ON quick_notes(game_id);
CREATE INDEX idx_quick_notes_created_at ON quick_notes(created_at DESC);
CREATE INDEX idx_reviews_game_id ON reviews(game_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public read access for games" ON games FOR SELECT USING (true);
CREATE POLICY "Public read access for quick_notes" ON quick_notes FOR SELECT USING (true);
CREATE POLICY "Public read access for reviews" ON reviews FOR SELECT USING (true);

-- For now, allow all operations (you'll secure this with service role key in admin)
CREATE POLICY "Allow all operations for games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all operations for quick_notes" ON quick_notes FOR ALL USING (true);
CREATE POLICY "Allow all operations for reviews" ON reviews FOR ALL USING (true);

-- Storage bucket for screenshots
-- Create this bucket in Supabase Storage UI, name it "screenshots"
-- Then run these policies:

-- CREATE POLICY "Public read access for screenshots"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'screenshots');

-- CREATE POLICY "Authenticated upload for screenshots"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'screenshots');

-- CREATE POLICY "Authenticated delete for screenshots"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'screenshots');
