import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Category, Story, Reel, Wallpaper } from '../types';
import { ArrowLeft } from 'lucide-react';

  user: { email: string } | null;
  isAdmin: boolean;
  handleAdminToggle: () => void;
  stories: Story[];
  reels: Reel[];
  wallpapers: Wallpaper[];
  categories: Category[];
  fetchData: () => void;
}


  user,
  isAdmin,
  handleAdminToggle,
  stories,
  reels,
  wallpapers,
  categories,
  fetchData,
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    handleAdminToggle();
    navigate('/');
  };

  if (!user || user.email !== 'jigs.vanani@gmail.com') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h1 className="text-3xl font-black text-white mb-2 text-center">Admin Panel</h1>
            <p className="text-white/60 text-center mb-6">Only jigs.vanani@gmail.com can access admin panel</p>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              placeholder="Login with admin email"
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors mb-4"
            />
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      {/* Admin Header */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              View Site
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="text-3xl font-black text-blue-400">{stories.length}</div>
            <p className="text-white/60 text-sm mt-2">Stories</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="text-3xl font-black text-purple-400">{reels.length}</div>
            <p className="text-white/60 text-sm mt-2">Reels</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="text-3xl font-black text-orange-400">{wallpapers.length}</div>
            <p className="text-white/60 text-sm mt-2">Wallpapers</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="text-3xl font-black text-green-400">{categories.length}</div>
            <p className="text-white/60 text-sm mt-2">Categories</p>
          </div>
        </div>

        {/* Manage Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stories Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Stories ({stories.length})</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stories.length === 0 ? (
                <p className="text-white/40 text-sm">No stories yet</p>
              ) : (
                stories.map((story) => (
                  <div key={story.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg text-sm text-white/70 truncate">
                    {story.image_url && (
                      <img src={story.image_url} alt="Story" className="w-12 h-12 object-cover rounded-md border border-white/10" />
                    )}
                    <span>{story.title || 'Untitled Story'}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reels Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Reels ({reels.length})</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {reels.length === 0 ? (
                <p className="text-white/40 text-sm">No reels yet</p>
              ) : (
                reels.map((reel) => (
                  <div key={reel.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg text-sm text-white/70 truncate">
                    {reel.video_url && (
                      <video src={reel.video_url} className="w-12 h-12 object-cover rounded-md border border-white/10" controls />
                    )}
                    <span>{reel.title || 'Untitled Reel'}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Wallpapers Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Wallpapers ({wallpapers.length})</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {wallpapers.length === 0 ? (
                <p className="text-white/40 text-sm">No wallpapers yet</p>
              ) : (
                wallpapers.map((wallpaper) => (
                  <div key={wallpaper.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg text-sm text-white/70 truncate">
                    {wallpaper.image_url && (
                      <img src={wallpaper.image_url} alt="Wallpaper" className="w-12 h-12 object-cover rounded-md border border-white/10" />
                    )}
                    <span>{wallpaper.title || 'Untitled Wallpaper'}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Categories Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Categories ({categories.length})</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-white/40 text-sm">No categories yet</p>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="p-3 bg-white/5 rounded-lg text-sm text-white/70 truncate">
                    {category.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
