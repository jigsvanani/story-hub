
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Category, Story, Reel, Wallpaper } from './types';
import { AdminPanel } from './pages/AdminPanel';
import { UserPanel } from './pages/UserPanel';

export default function Root() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchData();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setUser({ id: session.user.id, email: session.user.email });
      } else {
        setUser(null);
      }
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        setUser({ id: session.user.id, email: session.user.email });
      } else {
        setUser(null);
      }
    });
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



  return user?.email === 'jigs.vanani@gmail.com' ? (
    <AdminPanel
      user={user}
      isAdmin={true}
      handleAdminToggle={() => {}}
      stories={stories}
      reels={reels}
      wallpapers={wallpapers}
      categories={categories}
      fetchData={fetchData}
    />
  ) : (
    <UserPanel
      user={user}
      stories={stories}
      reels={reels}
      wallpapers={wallpapers}
      fetchData={fetchData}
    />
  );
}
