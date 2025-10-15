-- Migration to add image support to existing databases
-- Run this if you already have data in your database

-- Add images column to quick_notes
ALTER TABLE quick_notes 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Add images column to reviews
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Instructions for Supabase Storage:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "Create bucket"
-- 3. Name it "screenshots"
-- 4. Make it PUBLIC (so images can be viewed)
-- 5. Click "Create bucket"
-- 
-- That's it! The storage policies will be handled by the anon key.
