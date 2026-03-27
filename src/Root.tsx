import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Category, Story, Reel, Wallpaper } from './types';
import { AdminPanel } from './pages/AdminPanel';

export default function Root() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [stories, setStories] = useState<Story[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      setCategories(catData || []);

      const { data: storyData } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      setStories(storyData || []);

      const { data: reelData } = await supabase
        .from('reels')
        .select('*')
        .order('created_at', { ascending: false });

      setReels(reelData || []);

      const { data: wallData } = await supabase
        .from('wallpapers')
        .select('*')
        .order('created_at', { ascending: false });

      setWallpapers(wallData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
      setAdminPassword('');
    } else {
      // This will be called when password is correct
      setIsAdmin(true);
    }
  };

  return (
    <AdminPanel
      isAdmin={isAdmin}
      adminPassword={adminPassword}
      setAdminPassword={setAdminPassword}
      handleAdminToggle={handleAdminToggle}
      stories={stories}
      reels={reels}
      wallpapers={wallpapers}
      categories={categories}
      fetchData={fetchData}
    />
  );
}
