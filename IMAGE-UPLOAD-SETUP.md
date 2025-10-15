# Setting Up Image Uploads - Supabase Storage

Your site now supports uploading screenshots! Here's how to set it up:

## Quick Setup (5 minutes)

### 1. Create Storage Bucket in Supabase

1. Go to your Supabase project dashboard
2. Click **Storage** in the left sidebar
3. Click **New bucket** button
4. Fill in the details:
   - **Name**: `screenshots` (must be exactly this)
   - **Public bucket**: ✅ **CHECK THIS BOX** (so images can be viewed publicly)
   - **File size limit**: Set to **50MB** or higher (default 50MB is good)
   - **Allowed MIME types**: Leave empty (allows all image types)
5. Click **Create bucket**

**Important:** If you get upload errors, go back to the bucket settings and increase the file size limit to at least 50MB.

### 2. **CRITICAL: Set Up Storage Policies**

⚠️ **Without these policies, uploads will fail with "row-level security policy" errors!**

Supabase uses RLS (Row-Level Security) to protect storage. You need to allow uploads:

**Option A: Run SQL (Recommended)**
1. Go to Supabase → **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase-storage-policies.sql`
4. Click **Run**
5. You should see "Success. No rows returned"

**Option B: Use the UI**
1. Go to **Storage** → click `screenshots` bucket
2. Click **Policies** tab
3. You should see 4 policies. If none exist, click **New Policy**:
   - **Policy 1**: Name: "Public read", Operation: SELECT, Check: `bucket_id = 'screenshots'`
   - **Policy 2**: Name: "Public upload", Operation: INSERT, Check: `bucket_id = 'screenshots'`
   - **Policy 3**: Name: "Public delete", Operation: DELETE, Check: `bucket_id = 'screenshots'`
   - **Policy 4**: Name: "Public update", Operation: UPDATE, Check: `bucket_id = 'screenshots'`

That's it! The bucket is ready to use.

### 3. Run Database Migration

If you already have an existing database with content, you need to add the `images` column:

1. Go to Supabase → **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase-migration-images.sql`
4. Click **Run**

If you're setting up a fresh database, just use the main `supabase-schema.sql` file - it already includes image support!

## How to Use

### Upload Images

1. Go to `/admin` → **Create Content**
2. Select a game and choose Quick Note or Review
3. You'll see a **📷 Upload Images** button
4. **Click it** and select multiple images at once (Ctrl/Cmd + click)
5. **OR drag and drop** images directly onto the drop zone
6. Images upload automatically to Supabase Storage
7. You can remove images before publishing by clicking the ✕ button

### Limits

- **Quick Notes**: Up to 5 screenshots
- **Reviews**: Up to 10 screenshots
- **File size**: Max 20MB per image
- **File types**: All common image formats (jpg, png, gif, webp, etc.)

### Where Images Appear

- **Quick Notes**: Small thumbnail gallery on homepage
- **Reviews**: Full gallery at the bottom of review page
- **Manage Content**: Edit form includes image management

## Technical Details

### Storage Structure

Images are stored with unique filenames:
```
{timestamp}-{random}.{extension}
```

Example: `1697234567890-abc123.jpg`

### Public URLs

All images get public URLs like:
```
https://YOUR_PROJECT.supabase.co/storage/v1/object/public/screenshots/IMAGE_NAME.jpg
```

These URLs are saved in your database and can be accessed by anyone.

### Deletion

When you delete an image from the upload form, it's removed from:
1. Supabase Storage (the actual file)
2. Your content's image array (the database reference)

## Troubleshooting

### "new row violates row-level security policy" error

🔴 **This is the #1 issue!** Your bucket exists but has no RLS policies.

**Solution:**
1. Go to Supabase → **SQL Editor**
2. Create a new query
3. Copy/paste from `supabase-storage-policies.sql`
4. Click **Run**

**Verify it worked:**
1. Go to **Storage** → `screenshots` bucket → **Policies** tab
2. You should see 4 policies listed
3. If the tab is empty, the policies didn't apply - try again

This error means Supabase is blocking storage operations because there are no policies allowing them.

### "Failed to upload" error

**Check:**
- Is the bucket named exactly `screenshots`?
- Is the bucket set to public?
- Is your Supabase URL and anon key correct in `.env.local`?
- **Is the bucket file size limit at least 50MB?** (Go to Storage → screenshots → Configuration → File size limit)

### Images won't display

**Check:**
- Is the bucket public? (Go to Storage → screenshots → Configuration → Public access should be ON)
- Open the image URL directly in your browser - does it work?
- Check browser console for CORS errors

### "Bucket not found" error

You need to create the `screenshots` bucket in Supabase Storage (see step 1 above).

### Files are too large

If you're uploading very high-resolution screenshots:
- Supabase bucket allows up to 50MB by default
- The app limits individual files to 20MB
- Consider resizing ultra-large images (4K+ screenshots)
- Or adjust the limit in `ImageUpload.tsx` if needed

## Advanced: Manual Bucket Creation

If you prefer to create the bucket via SQL:

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true);
```

But it's easier to just use the Supabase UI!

---

That's it! Your gaming site now has full screenshot upload support. 📸🎮
