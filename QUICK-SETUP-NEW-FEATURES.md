# 🚨 Quick Setup: New Visual Features

## 1️⃣ Run This SQL First

Go to **Supabase → SQL Editor** and run:

```sql
ALTER TABLE quick_notes 
ADD COLUMN IF NOT EXISTS cover_image TEXT;

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS cover_image TEXT;
```

Click **Run**. You should see "Success. No rows returned".

---

## 2️⃣ Test the Features

### ⭐ Star a Screenshot
1. Go to `/admin` → **Create Content** or **Manage Content**
2. Upload screenshots or edit existing content
3. **Hover over any screenshot** → see star icon (☆)
4. **Click the star** → it turns gold (⭐) with glowing border
5. **Save** → that screenshot is now the cover on homepage!

### 🔍 Open Lightbox
1. Go to any review page with screenshots
2. **Click any screenshot**
3. Lightbox opens fullscreen (95% of screen)
4. Use **← → arrow keys** or buttons to navigate
5. Press **ESC** or click outside to close

### 📸 Check Larger Images
1. Go to homepage
2. Look at Quick Notes section
3. Screenshots are now **2x larger** (much more visible!)

---

## ✅ That's It!

All three features are now active:
- ⭐ **Starred covers** override game box art
- 📸 **Larger note images** for better visibility  
- 🔍 **Lightbox modal** for fullscreen viewing

Enjoy your upgraded gaming site! 🎮✨
