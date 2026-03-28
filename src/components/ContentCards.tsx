import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, Download, Play, Pause, Volume2, VolumeX, Video, 
  User as UserIcon 
} from 'lucide-react';
import { cn } from '../lib/utils';

export const StoryCard = ({ story, categories }: any) => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (story.user_id) {
      navigate(`/profile/${story.user_id}`);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative break-inside-avoid mb-4 rounded-[1.5rem] overflow-hidden bg-white/5 border border-white/10 shadow-2xl cursor-pointer"
      onClick={() => navigate(`/post/${story.isReel ? 'reels' : 'stories'}/${story.id}`)}
    >
      {story.isReel ? (
        <>
          <video 
            ref={videoRef}
            src={story.image_url} 
            className="w-full h-auto transition-transform duration-700 group-hover:scale-110"
            loop
            muted={isMuted}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
              {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
            </div>
          </div>
        </>
      ) : (
        <img 
          src={story.image_url} 
          alt="Story" 
          className="w-full h-auto transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
      )}

      {story.isReel && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
          <button 
            onClick={toggleMute}
            className="p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
          </button>
          <div className="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10">
            <Video className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-3">
        <div className="space-y-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/10">
              {story.isReel ? 'Reel' : (categories.find((c: any) => c.id === story.category_id)?.name || 'Story')}
            </span>
            {story.profiles && (
              <div className="flex items-center gap-1.5" onClick={handleProfileClick}>
                <div className="w-4 h-4 rounded-full bg-white/10 overflow-hidden border border-white/10">
                  {story.profiles.avatar_url ? (
                    <img src={story.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-full h-full p-0.5 text-white/50" />
                  )}
                </div>
                <span className="text-[9px] font-bold text-white/70 hover:text-white transition-colors">@{story.profiles.username}</span>
              </div>
            )}
          </div>
          {story.title && (
            <h3 className="text-sm font-black text-white leading-tight line-clamp-2">{story.title}</h3>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const WallpaperCard = ({ wallpaper, categories }: any) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wallpaper.user_id) {
      navigate(`/profile/${wallpaper.user_id}`);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative break-inside-avoid mb-4 rounded-[1.5rem] overflow-hidden bg-white/5 border border-white/10 shadow-2xl cursor-pointer"
      onClick={() => navigate(`/post/wallpapers/${wallpaper.id}`)}
    >
      <img 
        src={wallpaper.image_url} 
        alt="Wallpaper" 
        className="w-full h-auto transition-transform duration-700 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
        {/* Stats on Hover */}
        <div className="absolute top-4 left-4 flex gap-2 z-20">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
            <Heart className={cn("w-3.5 h-3.5", isLiked ? "text-rose-500 fill-rose-500" : "text-white")} />
            <span className="text-[10px] font-bold text-white">{wallpaper.likes_count + (isLiked ? 1 : 0)}</span>
          </div>
          <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-bold text-white">{wallpaper.downloads_count}</span>
          </div>
        </div>

        <div className="space-y-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
              {categories.find((c: any) => c.id === wallpaper.category_id)?.name || 'Wallpaper'}
            </span>
            {wallpaper.profiles && (
              <div className="flex items-center gap-2" onClick={handleProfileClick}>
                <div className="w-5 h-5 rounded-full bg-white/10 overflow-hidden border border-white/10">
                  {wallpaper.profiles.avatar_url ? (
                    <img src={wallpaper.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-full h-full p-1 text-white/50" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-white/70 hover:text-white transition-colors">@{wallpaper.profiles.username}</span>
              </div>
            )}
          </div>
          {wallpaper.title && (
            <h3 className="text-base font-black text-white leading-tight line-clamp-2">{wallpaper.title}</h3>
          )}
        </div>
      </div>
    </motion.div>
  );
};
