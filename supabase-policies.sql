-- ===========================================
-- SUPABASE DATABASE POLICIES FOR USER PANEL
-- ===========================================

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallpapers ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PROFILES TABLE POLICIES
-- ===========================================

-- Users can view all profiles (for displaying usernames/avatars)
CREATE POLICY "Users can view all profiles" ON profiles
FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- ===========================================
-- CATEGORIES TABLE POLICIES
-- ===========================================

-- All users can view categories
CREATE POLICY "All users can view categories" ON categories
FOR SELECT USING (true);

-- Only admin can manage categories (insert/update/delete)
CREATE POLICY "Admin can manage categories" ON categories
FOR ALL USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'jigs.vanani@gmail.com'
);

-- ===========================================
-- STORIES TABLE POLICIES
-- ===========================================

-- All users can view stories
CREATE POLICY "All users can view stories" ON stories
FOR SELECT USING (true);

-- Users can insert their own stories
CREATE POLICY "Users can insert their own stories" ON stories
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own stories
CREATE POLICY "Users can update their own stories" ON stories
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete their own stories" ON stories
FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- REELS TABLE POLICIES
-- ===========================================

-- All users can view reels
CREATE POLICY "All users can view reels" ON reels
FOR SELECT USING (true);

-- Users can insert their own reels
CREATE POLICY "Users can insert their own reels" ON reels
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reels
CREATE POLICY "Users can update their own reels" ON reels
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reels
CREATE POLICY "Users can delete their own reels" ON reels
FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- WALLPAPERS TABLE POLICIES
-- ===========================================

-- All users can view wallpapers
CREATE POLICY "All users can view wallpapers" ON wallpapers
FOR SELECT USING (true);

-- Users can insert their own wallpapers
CREATE POLICY "Users can insert their own wallpapers" ON wallpapers
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own wallpapers
CREATE POLICY "Users can update their own wallpapers" ON wallpapers
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own wallpapers
CREATE POLICY "Users can delete their own wallpapers" ON wallpapers
FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- STORAGE POLICIES
-- ===========================================

-- Enable RLS on storage buckets
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Users can view all uploaded files
CREATE POLICY "Users can view all uploaded files" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');

-- Users can upload to their own folder
CREATE POLICY "Users can upload to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ===========================================
-- ADMIN POLICIES (Full Access)
-- ===========================================

-- Admin can do everything on all tables
CREATE POLICY "Admin full access to profiles" ON profiles
FOR ALL USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'jigs.vanani@gmail.com'
);

CREATE POLICY "Admin full access to stories" ON stories
FOR ALL USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'jigs.vanani@gmail.com'
);

CREATE POLICY "Admin full access to reels" ON reels
FOR ALL USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'jigs.vanani@gmail.com'
);

CREATE POLICY "Admin full access to wallpapers" ON wallpapers
FOR ALL USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'jigs.vanani@gmail.com'
);

-- Admin can manage all storage files
CREATE POLICY "Admin full access to storage" ON storage.objects
FOR ALL USING (
  bucket_id = 'uploads' AND
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'jigs.vanani@gmail.com'
);