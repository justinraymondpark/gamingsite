# 🚨 FIX: Row-Level Security Policy Error

## The Problem
```
Failed to upload Image.png: new row violates row-level security policy
```

**Why this happens:** Your `screenshots` bucket exists, but Supabase RLS (Row-Level Security) is blocking uploads because there are no policies allowing them.

## The Fix (2 minutes)

### Step 1: Run the SQL Policies

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste this:

```sql
-- Allow public read access
CREATE POLICY "Public read access for screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'screenshots');

-- Allow public uploads
CREATE POLICY "Public upload for screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'screenshots');

-- Allow public deletes
CREATE POLICY "Public delete for screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'screenshots');

-- Allow public updates
CREATE POLICY "Public update for screenshots"
ON storage.objects FOR UPDATE
USING (bucket_id = 'screenshots');
```

5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see: **"Success. No rows returned"**

### Step 2: Verify It Worked

1. Go to **Storage** → click the `screenshots` bucket
2. Click the **Policies** tab
3. You should now see **4 policies** listed
4. If you see them, you're done! ✅

### Step 3: Test Upload

1. Go back to your admin panel at `localhost:3001/admin`
2. Try uploading an image again
3. Should work perfectly now! 🎉

## What These Policies Do

- **SELECT**: Allows anyone to view/read images
- **INSERT**: Allows anyone to upload new images
- **DELETE**: Allows anyone to delete images  
- **UPDATE**: Allows anyone to update images

> **Note**: These are "public" policies for ease of use. Later, you can make them more restrictive (e.g., only authenticated users can upload).

## Still Having Issues?

Check the browser console (F12) for more detailed error messages.

---

**All the SQL is also in**: `supabase-storage-policies.sql`
