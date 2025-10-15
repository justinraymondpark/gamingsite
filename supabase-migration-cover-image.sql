-- Migration to add cover_image support
-- Run this in Supabase SQL Editor

-- Add cover_image column to quick_notes
ALTER TABLE quick_notes 
ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Add cover_image column to reviews
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Instructions:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Click "New Query"
-- 3. Copy and paste this SQL
-- 4. Click "Run"
-- 
-- This adds an optional cover_image field that lets you star
-- a screenshot to use as the cover image instead of game box art.
