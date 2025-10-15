# Image Upload Updates - Drag & Drop + Larger Files

## What Changed

### ✅ File Size Increased
- **Old**: 5MB max per image
- **New**: 20MB max per image
- Perfect for high-resolution gaming screenshots!

### ✅ Drag & Drop Added
You can now:
- **Drag screenshots** directly onto the upload area
- Drop multiple files at once
- Still works with the click-to-browse button

### ✅ Better Error Messages
If upload fails, you'll now see:
- Specific error message from Supabase
- Reminder to check if bucket exists
- Helpful debugging info in console

## How to Use Drag & Drop

1. Go to admin → Create Content
2. Select a game and content type
3. Look for the **dashed box** with the camera icon 📸
4. **Drag your screenshots** from your file explorer
5. Drop them on the box
6. Watch them upload! 🚀

## Fixing Upload Issues

If you're getting "Failed to upload" errors:

### 1. Check Supabase Bucket Settings
- Go to Supabase → Storage → screenshots bucket
- Click the **Configuration** tab
- Check **File size limit** - should be at least **50MB**
- If it's lower, increase it

### 2. Verify Bucket is Public
- In bucket Configuration
- Make sure **Public** is enabled
- This allows your uploaded images to be viewed

### 3. Check Your .env.local
Make sure these are set correctly:
```
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

## Testing

Your dev server is running on **http://localhost:3001**

Try it out:
1. Go to /admin
2. Create a note or review
3. **Drag a large screenshot** (10-20MB) onto the upload zone
4. Should upload successfully now!

## Technical Changes

### Updated Files
- ✅ `ImageUpload.tsx` - Added drag handlers, increased limit, better errors
- ✅ `IMAGE-UPLOAD-SETUP.md` - Updated docs for 20MB and drag & drop
- ✅ `IMAGE-FEATURE-COMPLETE.md` - Updated feature list

### Drag & Drop Implementation
```typescript
// Added handlers for all drag events
handleDragOver, handleDragEnter, handleDragLeave, handleDrop

// Drop zone with visual feedback
<div onDrop={handleDrop} className="border-dashed...">
  Drag & drop images here
</div>
```

### File Size Check
```typescript
if (file.size > 20 * 1024 * 1024) {
  alert(`${file.name} is too large (max 20MB)`);
}
```

---

Everything should work smoothly now! Your high-res gaming screenshots will upload without issues. 🎮📸
