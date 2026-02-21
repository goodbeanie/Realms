
import React, { useMemo } from 'react';
import { Friend, User, Realm, Role, ShopItem, GlobalStore } from '../types';
import { Icons, DEFAULT_PRODUCTS } from '../constants';

interface ProfileModalProps {
  friendId: string;
  users: User[];
  shopItems: ShopItem[];
  onClose: () => void;
  currentRealm?: Realm | null;
  onRemoveFriend?: (id: string) => void;
  isMe?: boolean;
  isFriend?: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ friendId, users, shopItems, onClose, currentRealm, onRemoveFriend, isMe, isFriend }) => {
  const profileUser = useMemo(() => users.find(u => u.id === friendId), [users, friendId]);

  const equippedAura = useMemo(() => 
    shopItems.find(p => p.id === profileUser?.equippedAuraId), 
    [shopItems, profileUser?.equippedAuraId]
  );

  const activeBadges = useMemo(() => {
    if (!profileUser || !profileUser.unlockedItems) return [];
    return shopItems.filter(item => {
      if (!item.showAsBadge) return false;
      const isUnlocked = profileUser.unlockedItems?.includes(item.id);
      if (!isUnlocked) return false;
      if (item.activationType === 'always-active') return true;
      if (item.activationType === 'equippable' || !item.activationType) {
        return profileUser.equippedAuraId === item.id;
      }
      return false;
    });
  }, [profileUser, shopItems]);

  if (!profileUser) return null;

  const initials = profileUser.displayName?.[0] || '?';
  const displayName = profileUser.displayName || 'Unknown Explorer';
  const username = profileUser.username || 'unknown';
  const avatarUrl = profileUser.avatarUrl;
  const bannerUrl = profileUser.bannerUrl;
  const bannerColor = profileUser.bannerColor || '#ffd154';
  const shards = (profileUser.shards || 0).toLocaleString();
  const iconBorderColor = profileUser.iconBorderColor || '#ffffff';
  const hasPulse = profileUser.unlockedItems?.includes('pulse');
  const socialLinks = profileUser.socialLinks || { youtube: '', tiktok: '', twitch: '' };

  const ringScale = 130;
  const hasCustomAura = equippedAura?.isAura && equippedAura.icon && equippedAura.icon.length > 10;
  const hasStandardRing = equippedAura?.isAura && (!equippedAura.icon || equippedAura.icon.length <= 10);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4" onClick={onClose}>
      <div 
        className={`bg-[#1e1f22] w-full max-w-sm sm:max-w-[560px] rounded-[40px] sm:rounded-[60px] shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden border border-white/5 animate-in zoom-in-95 duration-200 ring-2 ring-white/[0.03] ${hasPulse ? 'shadow-[0_0_80px_rgba(168,85,247,0.15)]' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-32 sm:h-56 relative overflow-hidden flex items-center justify-center shadow-inner" style={{ backgroundColor: bannerUrl ? 'transparent' : bannerColor }}>
          {bannerUrl && <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" />}
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 z-10 transition-all hover:rotate-90 hover:scale-110 backdrop-blur-md border border-white/10">✕</button>
        </div>
        
        <div className="p-8 sm:p-14 pt-16 sm:pt-24 relative">
          <div 
            className={`absolute -top-16 sm:-top-20 left-8 sm:left-14 w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-[#1e1f22] flex items-center justify-center shadow-[0_24px_48px_rgba(0,0,0,0.6)] z-20 ${hasPulse ? 'animate-pulse' : ''}`}
            style={{ 
              border: hasStandardRing ? `5px solid ${iconBorderColor}` : 'none',
              padding: hasStandardRing ? '4px' : '0px',
            }}
          >
            {hasCustomAura && (
               <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center" style={{ transform: `scale(${ringScale/100})` }}>
                  <div className="w-full h-full" style={{ background: `url(${equippedAura.icon}) center/contain no-repeat` }} />
               </div>
            )}
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#1e1f22] border border-white/5 relative z-0">
              {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-5xl sm:text-6xl font-black text-white/10">{initials}</div>}
            </div>
            {hasPulse && <div className="absolute -inset-2 rounded-full border-2 border-[#a855f7]/30 blur-sm pointer-events-none" />}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 flex-wrap">
                <h3 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-tight truncate">{displayName}</h3>
                <div className="flex items-center gap-2">
                  {hasPulse && <div className="text-[#a855f7] drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"><Icons.PulseBadge className="w-8 h-8 sm:w-10 sm:h-10" /></div>}
                  {activeBadges.map(badge => (
                    <div key={badge.id} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-black/20 border border-white/5 flex items-center justify-center overflow-hidden shadow-lg group relative">
                      {badge.icon && badge.icon.length > 10 ? <img src={badge.icon} className="w-full h-full object-contain p-1" /> : <span className="text-xl sm:text-2xl">{badge.icon || '✨'}</span>}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[8px] text-white font-black uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">{badge.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-neutral-500 text-sm sm:text-lg font-bold uppercase tracking-widest mt-2 opacity-60 truncate">@{username}</p>
            </div>
            <div className="bg-black/30 px-6 sm:px-8 py-4 sm:py-5 rounded-[32px] border border-white/10 flex items-center gap-5 shadow-inner backdrop-blur-sm self-start">
               <Icons.Amethyst className="text-[#a855f7] w-7 h-7 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
               <div className="flex flex-col">
                  <span className="text-[11px] uppercase font-black text-neutral-500 leading-none mb-2 tracking-[0.2em]">Shards</span>
                  <span className="text-xl sm:text-2xl font-black text-white leading-none tracking-tight">{shards}</span>
               </div>
            </div>
          </div>

          <div className="space-y-12">
            {profileUser.bio && (
              <p className="text-neutral-300 text-base sm:text-xl font-medium leading-relaxed bg-black/20 p-8 sm:p-10 rounded-[40px] border border-white/5 shadow-inner">
                {profileUser.bio}
              </p>
            )}
            
            {(socialLinks.youtube || socialLinks.tiktok || socialLinks.twitch) && (
              <div className="flex flex-wrap gap-3">
                {socialLinks.youtube && <a href={socialLinks.youtube} target="_blank" className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-black uppercase hover:bg-red-500/20 transition-all">YouTube</a>}
                {socialLinks.tiktok && <a href={socialLinks.tiktok} target="_blank" className="px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-xl text-pink-400 text-[10px] font-black uppercase hover:bg-pink-500/20 transition-all">TikTok</a>}
                {socialLinks.twitch && <a href={socialLinks.twitch} target="_blank" className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 text-[10px] font-black uppercase hover:bg-purple-500/20 transition-all">Twitch</a>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
