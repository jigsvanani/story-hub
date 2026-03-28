import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface FollowButtonProps {
  targetUserId: string;
  currentUserId: string | undefined;
  onStatusChange?: (isFollowing: boolean) => void;
  className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ 
  targetUserId, 
  currentUserId, 
  onStatusChange,
  className 
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (currentUserId && targetUserId) {
      checkFollowStatus();
    } else {
      setLoading(false);
    }
  }, [currentUserId, targetUserId]);

  const checkFollowStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (data) setIsFollowing(true);
    } catch (err) {
      console.error('Error checking follow status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;
    if (currentUserId === targetUserId) return;

    setActionLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);

        if (!error) {
          setIsFollowing(false);
          onStatusChange?.(false);
        }
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId
          });

        if (!error) {
          setIsFollowing(true);
          onStatusChange?.(true);
        }
      }
    } catch (err) {
      console.error('Error updating follow status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !currentUserId || currentUserId === targetUserId) return null;

  return (
    <button
      onClick={handleFollow}
      disabled={actionLoading}
      className={cn(
        "flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50",
        isFollowing 
          ? "bg-white/10 text-white border border-white/20 hover:bg-white/20" 
          : "bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600",
        className
      )}
    >
      {actionLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="w-4 h-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </button>
  );
};
