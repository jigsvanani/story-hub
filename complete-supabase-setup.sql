-- ===========================================
-- STORYHUB DATABASE SETUP - COMPLETE SQL
-- ===========================================
-- This file contains all necessary SQL for:
-- 1. Table creation
-- 2. Indexes for performance
-- 3. Sample data
-- 4. Row Level Security policies
-- 5. Storage policies
-- ===========================================

-- ===========================================
-- 1. TABLE CREATION
-- ===========================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('story', 'wallpaper')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT,
  caption TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reels table
CREATE TABLE IF NOT EXISTS reels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_url TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT,
  caption TEXT,
  description TEXT,
  music_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallpapers table
CREATE TABLE IF NOT EXISTS wallpapers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT,
  caption TEXT,
  description TEXT,
  likes_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 2. STORAGE BUCKET CREATION
-- ===========================================

-- Create storage bucket for uploads (public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- 3. INDEXES FOR PERFORMANCE
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_category_id ON stories(category_id);

CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallpapers_user_id ON wallpapers(user_id);
CREATE INDEX IF NOT EXISTS idx_wallpapers_created_at ON wallpapers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallpapers_category_id ON wallpapers(category_id);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- ===========================================
-- 4. SAMPLE DATA
-- ===========================================

-- Insert sample categories
INSERT INTO categories (name, type) VALUES
('Nature', 'story'),
('Technology', 'story'),
('Art', 'story'),
('Food', 'story'),
('Travel', 'story'),
('Fashion', 'story'),
('Sports', 'story'),
('Music', 'story'),
('Abstract', 'wallpaper'),
('Minimal', 'wallpaper'),
('Dark', 'wallpaper'),
('Colorful', 'wallpaper'),
('Patterns', 'wallpaper'),
('Space', 'wallpaper'),
('Animals', 'wallpaper')
ON CONFLICT DO NOTHING;

-- ===========================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallpapers ENABLE ROW LEVEL SECURITY;
-- Note: storage.objects RLS is managed by Supabase automatically

-- ===========================================
-- 6. SECURITY POLICIES
-- ===========================================

-- ===========================================
-- PROFILES TABLE POLICIES
-- ===========================================

-- All users can view profiles (for displaying usernames/avatars)
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "profiles_delete_policy" ON profiles
FOR DELETE USING (auth.uid() = id);

-- ===========================================
-- CATEGORIES TABLE POLICIES
-- ===========================================

-- All users can view categories
CREATE POLICY "categories_select_policy" ON categories
FOR SELECT USING (true);

-- Only admin can manage categories (insert/update/delete)
CREATE POLICY "categories_admin_policy" ON categories
FOR ALL USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'jigs.vanani@gmail.com'
);

-- ===========================================
-- STORIES TABLE POLICIES
-- ===========================================

-- All users can view stories
CREATE POLICY "stories_select_policy" ON stories
FOR SELECT USING (true);

-- Users can insert their own stories
CREATE POLICY "stories_insert_policy" ON stories
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own stories
CREATE POLICY "stories_update_policy" ON stories
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "stories_delete_policy" ON stories
FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- REELS TABLE POLICIES
-- ===========================================

-- All users can view reels
CREATE POLICY "reels_select_policy" ON reels
FOR SELECT USING (true);

-- Users can insert their own reels
CREATE POLICY "reels_insert_policy" ON reels
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reels
CREATE POLICY "reels_update_policy" ON reels
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reels
CREATE POLICY "reels_delete_policy" ON reels
FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- WALLPAPERS TABLE POLICIES
-- ===========================================

-- All users can view wallpapers
CREATE POLICY "wallpapers_select_policy" ON wallpapers
FOR SELECT USING (true);

-- Users can insert their own wallpapers
CREATE POLICY "wallpapers_insert_policy" ON wallpapers
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own wallpapers
CREATE POLICY "wallpapers_update_policy" ON wallpapers
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own wallpapers
CREATE POLICY "wallpapers_delete_policy" ON wallpapers
FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- STORAGE POLICIES
-- ===========================================
-- Note: Storage policies are created via Supabase Dashboard → Storage → uploads bucket → Policies
-- Or use the following SQL after confirming bucket exists:

-- Allow public read access to uploads bucket
-- Allow authenticated users to upload to their own folder
-- Allow users to manage their own files
-- Admin has full access to all files

-- These policies will be created through the Supabase Storage UI or API

-- ===========================================
-- ADMIN OVERRIDE POLICIES (Full Access)
-- ===========================================

-- Admin can do everything on profiles
CREATE POLICY "admin_profiles_policy" ON profiles
FOR ALL USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'jigs.vanani@gmail.com'
);

-- Admin can do everything on stories
CREATE POLICY "admin_stories_policy" ON stories
FOR ALL USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'jigs.vanani@gmail.com'
);

-- Admin can do everything on reels
CREATE POLICY "admin_reels_policy" ON reels
FOR ALL USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'jigs.vanani@gmail.com'
);

-- Admin can do everything on wallpapers
CREATE POLICY "admin_wallpapers_policy" ON wallpapers
FOR ALL USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'jigs.vanani@gmail.com'
);

-- Note: Admin storage policies should be created via Supabase Storage UI

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check if RLS is enabled on all tables
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('profiles', 'categories', 'stories', 'reels', 'wallpapers');

-- Check policies count per table
-- SELECT schemaname, tablename, COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- GROUP BY schemaname, tablename
-- ORDER BY tablename;

-- Check storage bucket
-- SELECT id, name, public FROM storage.buckets WHERE id = 'uploads';

-- Check sample categories
-- SELECT name, type FROM categories ORDER BY type, name;