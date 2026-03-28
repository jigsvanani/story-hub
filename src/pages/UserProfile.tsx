import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, Loader2, Image as ImageIcon, Video, Palette, 
  User as UserIcon, Calendar, Layers, Play, Home
} from 'lucide-react';
import { cn } from '../lib/utils';
import { StoryCard, WallpaperCard } from '../components/ContentCards';
import { FollowButton } from '../components/FollowButton';
import { FollowListModal } from '../components/FollowListModal';
import { Category, Story, Reel, Wallpaper, Profile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowListOpen, setIsFollowListOpen] = useState<{ isOpen: boolean, type: 'followers' | 'following' }>({ isOpen: false, type: 'followers' });
  const [stories, setStories] = useState<Story[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stories' | 'reels' | 'wallpapers'>('stories');

  useEffect(() => {
    checkUser();
    if (userId) {
      fetchUserProfile();
      fetchUserData();
    }
  }, [userId]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user ?? null);
  };

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

      // Fetch follow counts
      const [followerRes, followingRes] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
      ]);

      setFollowerCount(followerRes.count || 0);
      setFollowingCount(followingRes.count || 0);

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
          <div className="flex-1"></div>
          <button 
            onClick={() => navigate('/')} 
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition flex items-center justify-center border border-white/10"
            title="Go to Home"
          >
            <Home className="w-5 h-5 text-orange-500" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
        {/* Profile Info Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-orange-500/10 blur-[80px] sm:blur-[100px] -mr-24 -mt-24 sm:-mr-32 sm:-mt-32"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 relative z-10">
            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl sm:rounded-[2rem] bg-white/10 border border-white/20 overflow-hidden shadow-2xl shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-full h-full p-6 sm:p-8 text-white/20" />
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-4 sm:space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                <div className="space-y-1">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">@{profile.username}</h2>
                  <div className="flex items-center justify-center md:justify-start gap-4 text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto">
                    <FollowButton 
                      targetUserId={profile.id} 
                      currentUserId={currentUser?.id} 
                      onStatusChange={(isFollowing) => {
                        setFollowerCount(prev => isFollowing ? prev + 1 : prev - 1);
                      }}
                    />
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3">
                <div className="flex-1 min-w-[80px] sm:flex-none px-3 py-2 sm:px-5 sm:py-3 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center gap-0.5 sm:gap-3 transition hover:bg-white/10">
                  <span className="text-lg sm:text-xl font-black">{stories.length + reels.length + wallpapers.length}</span>
                  <span className="text-[8px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest">Posts</span>
                </div>
                
                <button 
                  onClick={() => setIsFollowListOpen({ isOpen: true, type: 'followers' })}
                  className="flex-1 min-w-[80px] sm:flex-none px-3 py-2 sm:px-5 sm:py-3 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center gap-0.5 sm:gap-3 transition hover:bg-white/10 active:scale-95"
                >
                  <span className="text-lg sm:text-xl font-black">{followerCount}</span>
                  <span className="text-[8px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest">Followers</span>
                </button>

                <button 
                  onClick={() => setIsFollowListOpen({ isOpen: true, type: 'following' })}
                  className="flex-1 min-w-[80px] sm:flex-none px-3 py-2 sm:px-5 sm:py-3 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center gap-0.5 sm:gap-3 transition hover:bg-white/10 active:scale-95"
                >
                  <span className="text-lg sm:text-xl font-black">{followingCount}</span>
                  <span className="text-[8px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest">Following</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for Followers/Following */}
        <AnimatePresence>
          {isFollowListOpen.isOpen && (
            <FollowListModal 
              isOpen={isFollowListOpen.isOpen}
              onClose={() => setIsFollowListOpen({ ...isFollowListOpen, isOpen: false })}
              userId={profile.id}
              type={isFollowListOpen.type}
              currentUserId={currentUser?.id}
            />
          )}
        </AnimatePresence>

        {/* Content Tabs */}
        <div className="space-y-6 sm:space-y-8">
          <div className="flex justify-center -mx-4 sm:mx-0 overflow-x-auto no-scrollbar px-4 sm:px-0">
            <div className="inline-flex bg-white/5 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-white/10">
              <button 
                onClick={() => setActiveTab('stories')}
                className={cn(
                  "px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap uppercase tracking-widest",
                  activeTab === 'stories' ? "bg-white text-black shadow-lg sm:shadow-xl" : "text-white/40 hover:text-white"
                )}
              >
                <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Stories ({stories.length})
              </button>
              <button 
                onClick={() => setActiveTab('reels')}
                className={cn(
                  "px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap uppercase tracking-widest",
                  activeTab === 'reels' ? "bg-white text-black shadow-lg sm:shadow-xl" : "text-white/40 hover:text-white"
                )}
              >
                <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Reels ({reels.length})
              </button>
              <button 
                onClick={() => setActiveTab('wallpapers')}
                className={cn(
                  "px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap uppercase tracking-widest",
                  activeTab === 'wallpapers' ? "bg-white text-black shadow-lg sm:shadow-xl" : "text-white/40 hover:text-white"
                )}
              >
                <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                  <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-6 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
                    {stories.map(story => (
                      <StoryCard key={story.id} story={story} categories={categories} />
                    ))}
                  </div>
                ) : <EmptyState type="stories" />
              )}

              {activeTab === 'wallpapers' && (
                wallpapers.length > 0 ? (
                  <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-6 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
                    {wallpapers.map(wallpaper => (
                      <WallpaperCard key={wallpaper.id} wallpaper={wallpaper} categories={categories} />
                    ))}
                  </div>
                ) : <EmptyState type="wallpapers" />
              )}

              {activeTab === 'reels' && (
                reels.length > 0 ? (
                   <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-6">
                      {reels.map(reel => (
                        <div key={reel.id} 
                             onClick={() => navigate(`/post/reels/${reel.id}`)}
                             className="aspect-[9/16] rounded-2xl sm:rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 group cursor-pointer relative shadow-2xl">
                          <video src={reel.video_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white" />
                          </div>
                          <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                            <p className="text-[10px] sm:text-xs font-bold line-clamp-1">{reel.caption || 'Untitled'}</p>
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
