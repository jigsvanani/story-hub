-- ===========================================
-- SUPABASE TABLE CREATION SQL
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

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- ADD USEFUL INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallpapers_user_id ON wallpapers(user_id);
CREATE INDEX IF NOT EXISTS idx_wallpapers_created_at ON wallpapers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ===========================================
-- ADD SOME SAMPLE CATEGORIES
-- ===========================================

INSERT INTO categories (name, type) VALUES
('Nature', 'story'),
('Technology', 'story'),
('Art', 'story'),
('Food', 'story'),
('Travel', 'story'),
('Abstract', 'wallpaper'),
('Minimal', 'wallpaper'),
('Dark', 'wallpaper'),
('Colorful', 'wallpaper'),
('Patterns', 'wallpaper')
ON CONFLICT DO NOTHING;