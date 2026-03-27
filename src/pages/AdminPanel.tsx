import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Category, Story, Reel, Wallpaper } from '../types';
import { ArrowLeft } from 'lucide-react';

interface AdminPanelProps {
  isAdmin: boolean;
  adminPassword: string;
  setAdminPassword: (password: string) => void;
  handleAdminToggle: () => void;
  stories: Story[];
  reels: Reel[];
  wallpapers: Wallpaper[];
  categories: Category[];
  fetchData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isAdmin,
  adminPassword,
  setAdminPassword,
  handleAdminToggle,
  stories,
  reels,
  wallpapers,
  categories,
  fetchData,
}) => {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const handleUnlock = () => {
    setAuthError(null);
    if (adminPassword === 'admin123') {
      handleAdminToggle();
      setAuthError(null);
    } else {
      setAuthError('Invalid password');
      setAdminPassword('');
    }
  };

  const handleLogout = () => {
    handleAdminToggle();
    navigate('/');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h1 className="text-3xl font-black text-white mb-2 text-center">Admin Panel</h1>
            <p className="text-white/60 text-center mb-6">Enter password to access</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-white/40 mb-2">Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAuthError(null);
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="Enter admin password"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-200">
                {authError}
              </div>
            )}

            <button
              onClick={handleUnlock}
              className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors mb-4"
            >
              Unlock Admin Panel
            </button>

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
                  <div key={story.id} className="p-3 bg-white/5 rounded-lg text-sm text-white/70 truncate">
                    {story.title || 'Untitled Story'}
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
                  <div key={reel.id} className="p-3 bg-white/5 rounded-lg text-sm text-white/70 truncate">
                    {reel.title || 'Untitled Reel'}
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
                  <div key={wallpaper.id} className="p-3 bg-white/5 rounded-lg text-sm text-white/70 truncate">
                    {wallpaper.title || 'Untitled Wallpaper'}
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
