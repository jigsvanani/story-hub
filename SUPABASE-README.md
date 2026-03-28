# Supabase Database Setup for StoryHub User Panel

## 📋 Required Changes in Supabase

### 1. Run Table Creation SQL
Execute the SQL in `supabase-setup.sql` in your Supabase SQL Editor to create all required tables and indexes.

### 2. Enable Row Level Security
Execute the SQL in `supabase-policies.sql` to set up proper RLS policies for user permissions.

## 🔐 Security Overview

### User Permissions:
- **Regular Users**: Can view all content, upload/edit/delete their own content only
- **Admin (jigs.vanani@gmail.com)**: Full access to all content and categories

### Table Access:
- **profiles**: Users can view all, edit their own
- **categories**: All can read, only admin can modify
- **stories/reels/wallpapers**: All can read, users can CRUD their own
- **storage**: Users can upload to their folder, all can read

## 🚀 Quick Setup Commands

### Step 1: Create Tables
```sql
-- Copy and paste the contents of supabase-setup.sql
```

### Step 2: Enable Security Policies
```sql
-- Copy and paste the contents of supabase-policies.sql
```

### Step 3: Verify Setup
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'categories', 'stories', 'reels', 'wallpapers');

-- Check policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

## 📁 File Structure
- `supabase-setup.sql` - Table creation and initial data
- `supabase-policies.sql` - Row Level Security policies
- `src/pages/UserPanel.tsx` - User dashboard component
- `src/pages/AdminPanel.tsx` - Admin management panel

## ⚠️ Important Notes

1. **Email Check**: Admin access is based on email `jigs.vanani@gmail.com`
2. **Storage Bucket**: Make sure 'uploads' bucket exists and is public
3. **Environment Variables**: Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
4. **Gemini API**: Content moderation requires GEMINI_API_KEY

## 🔧 Testing the Setup

1. Login with a regular user account
2. Try uploading content (should work)
3. Try accessing another user's content (should fail)
4. Login with admin email (jigs.vanani@gmail.com)
5. Try managing categories (should work)
6. Try managing all content (should work)

## 📊 Database Schema

```
auth.users (Supabase Auth)
├── profiles (user profiles)
├── stories (image posts)
├── reels (video posts)
└── wallpapers (wallpaper posts)
    └── categories (content categories)
```

All tables have RLS enabled with appropriate policies for user isolation and admin access.