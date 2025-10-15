# 🚨 QUICK FIX: Missing Images Column

## The Error
```
Failed to update review: Could not find the 'images' column of 'reviews' in the schema cache
```

## The Problem
Your database doesn't have the `images` column yet! You need to run the migration.

## The Fix (1 minute)

### Step 1: Go to Supabase SQL Editor
1. Open your **Supabase Dashboard**
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run This SQL
Copy and paste this into the SQL editor:

```sql
-- Add images column to quick_notes
ALTER TABLE quick_notes 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Add images column to reviews
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
```

### Step 3: Execute
1. Click **Run** (or press Ctrl/Cmd + Enter)
2. You should see: **"Success. No rows returned"**

### Step 4: Test It!
1. Go back to your admin panel
2. Try editing and saving a review again
3. Should work perfectly now! ✅

---

## What This Does
- Adds an `images` column to both `quick_notes` and `reviews` tables
- Column type is `TEXT[]` (array of text/URLs)
- Default value is an empty array `{}`
- Uses `IF NOT EXISTS` so it's safe to run multiple times

---

**All the SQL is also in**: `supabase-migration-images.sql`

Once you run this, uploads, edits, and image reordering will all work! 🎮📸
