import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, Loader2, Image as ImageIcon, Video, Palette, 
  User as UserIcon, Calendar, Layers, Play
} from 'lucide-react';
import { cn } from '../lib/utils';
import { StoryCard, WallpaperCard } from '../components/ContentCards';
import { Category, Story, Reel, Wallpaper, Profile } from '../types';

export const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stories' | 'reels' | 'wallpapers'>('stories');

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserData();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) setProfile(data);
  };

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch Categories for labels
      const { data: catData } = await supabase.from('categories').select('*');
      setCategories(catData || []);

      // Fetch user's content
      const [storyRes, reelRes, wallRes] = await Promise.all([
        supabase.from('stories').select('*, profiles(*)').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('reels').select('*, profiles(*)').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('wallpapers').select('*, profiles(*)').eq('user_id', userId).order('created_at', { ascending: false })
      ]);

      setStories(storyRes.data || []);
      setReels(reelRes.data || []);
      setWallpapers(wallRes.data || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black mb-4">User not found</h2>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-[#0F0F0F]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold tracking-tight">User Profile</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Profile Info Card */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] -mr-32 -mt-32"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-white/10 border border-white/20 overflow-hidden shadow-2xl">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-full h-full p-8 text-white/20" />
              )}
            </div>
            
            <div className="text-center md:text-left space-y-4">
              <div className="space-y-1">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter">@{profile.username}</h2>
                <div className="flex items-center justify-center md:justify-start gap-4 text-white/40 text-sm font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-2">
                  <span className="text-lg font-black">{stories.length + reels.length + wallpapers.length}</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Posts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="space-y-8">
          <div className="flex justify-center">
            <div className="inline-flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
              <button 
                onClick={() => setActiveTab('stories')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === 'stories' ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white"
                )}
              >
                <ImageIcon className="w-4 h-4" />
                Stories ({stories.length})
              </button>
              <button 
                onClick={() => setActiveTab('reels')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === 'reels' ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white"
                )}
              >
                <Video className="w-4 h-4" />
                Reels ({reels.length})
              </button>
              <button 
                onClick={() => setActiveTab('wallpapers')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === 'wallpapers' ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white"
                )}
              >
                <Palette className="w-4 h-4" />
                Wallpapers ({wallpapers.length})
              </button>
            </div>
          </div>

          {/* Grid View */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'stories' && (
                stories.length > 0 ? (
                  <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 space-y-4">
                    {stories.map(story => (
                      <StoryCard key={story.id} story={story} categories={categories} />
                    ))}
                  </div>
                ) : <EmptyState type="stories" />
              )}

              {activeTab === 'wallpapers' && (
                wallpapers.length > 0 ? (
                  <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 space-y-4">
                    {wallpapers.map(wallpaper => (
                      <WallpaperCard key={wallpaper.id} wallpaper={wallpaper} categories={categories} />
                    ))}
                  </div>
                ) : <EmptyState type="wallpapers" />
              )}

              {activeTab === 'reels' && (
                reels.length > 0 ? (
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {reels.map(reel => (
                        <div key={reel.id} 
                             onClick={() => navigate(`/post/reels/${reel.id}`)}
                             className="aspect-[9/16] rounded-3xl overflow-hidden bg-white/5 border border-white/10 group cursor-pointer relative">
                          <video src={reel.video_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-10 h-10 text-white fill-white" />
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <p className="text-xs font-bold line-clamp-1">{reel.caption || 'Untitled'}</p>
                          </div>
                        </div>
                      ))}
                   </div>
                ) : <EmptyState type="reels" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ type }: { type: string }) => (
  <div className="text-center py-32 space-y-4 bg-white/5 rounded-[2.5rem] border border-white/10">
    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
      {type === 'stories' && <ImageIcon className="w-10 h-10 text-white/10" />}
      {type === 'wallpapers' && <Palette className="w-10 h-10 text-white/10" />}
      {type === 'reels' && <Video className="w-10 h-10 text-white/10" />}
    </div>
    <h3 className="text-xl font-bold">No {type} yet</h3>
    <p className="text-white/20 text-sm">This user hasn't uploaded any {type} yet.</p>
  </div>
);
