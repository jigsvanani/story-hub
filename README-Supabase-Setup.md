# StoryHub Supabase Setup

## 🚀 Quick Setup

### Step 1: Run Database SQL
1. **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire contents of `complete-supabase-setup.sql`
3. Click **Run**

### Step 2: Setup Storage Policies
1. **Supabase Dashboard** → **Storage**
2. Select the `uploads` bucket (created by SQL above)
3. Go to **Policies** tab
4. Create the 5 storage policies as described in `STORAGE-POLICIES-README.md`

### Step 3: Verify Setup
Run these queries in SQL Editor to verify:

```sql
-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- Check policies
SELECT tablename, COUNT(*) as policies FROM pg_policies
WHERE schemaname = 'public' GROUP BY tablename;

-- Check storage bucket
SELECT id, name, public FROM storage.buckets;
```

## 📋 What's Included

### ✅ Tables Created:
- `profiles` - User profiles
- `categories` - Content categories
- `stories` - Image posts
- `reels` - Video posts
- `wallpapers` - Wallpaper posts

### ✅ Security Policies:
- **Row Level Security (RLS)** enabled on all tables
- **User Isolation**: Users can only access their own content
- **Admin Access**: `jigs.vanani@gmail.com` has full control
- **Public Reading**: All users can view content
- **Private Writing**: Users can only modify their own data

### ✅ Performance:
- Indexes on user_id, created_at, category_id
- Optimized for fast queries

### ✅ Sample Data:
- 15 categories (8 story + 7 wallpaper)

## 🔐 Permission Matrix

| Feature | Regular User | Admin |
|---------|-------------|-------|
| View Content | ✅ All | ✅ All |
| Upload Content | ✅ Own only | ✅ All |
| Edit Content | ✅ Own only | ✅ All |
| Delete Content | ✅ Own only | ✅ All |
| Manage Categories | ❌ | ✅ |

## 📁 Files Structure
```
uploads/
├── {user_id}/
│   ├── story-image.jpg
│   ├── reel-video.mp4
│   └── wallpaper.png
```

## ⚙️ Environment Variables
Make sure these are set in your `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_key
```

## 🎯 Testing

1. **Login as regular user** → Can upload/view own content
2. **Login as admin** (`jigs.vanani@gmail.com`) → Can manage everything
3. **Try accessing other user's content** → Should be blocked

## 📞 Support
If you encounter issues, check:
1. RLS is enabled on all tables
2. Policies are created correctly
3. Storage bucket exists and is public
4. Environment variables are set