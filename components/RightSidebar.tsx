
import React, { useMemo } from 'react';
import { User, Realm, Friend, Role, ShopItem, GlobalStore } from '../types';
import { Icons, DEFAULT_PRODUCTS } from '../constants';

interface RightSidebarProps {
  view: { type: 'dm'; friendId: string | null } | { type: 'realm'; realmId: string; chatId: string | null } | { type: 'pending_requests' } | { type: 'shop' };
  activeRealm: Realm | null;
  activeFriend: Friend | null;
  onViewProfile: (user: User | Friend) => void;
  usersDb: User[];
  shopItems: ShopItem[];
}

const PRESENCE_THRESHOLD = 60000; // 1 minute

export const RightSidebar: React.FC<RightSidebarProps> = ({ view, activeRealm, activeFriend, onViewProfile, usersDb, shopItems }) => {
  const isOnline = (lastActive?: number) => {
    if (!lastActive) return false;
    return (Date.now() - lastActive) < PRESENCE_THRESHOLD;
  };

  const groupedMembers = useMemo(() => {
    if (view.type !== 'realm' || !activeRealm) return null;

    const allMembers = usersDb.filter(u => activeRealm.memberIds?.includes(u.id));
    const hoistedRoles = (activeRealm.roles || [])
      .filter(r => r.hoist && r.id !== 'everyone')
      .reverse(); 

    const groups: { role: Role | null; members: User[] }[] = [];
    const assignedIds = new Set<string>();

    hoistedRoles.forEach(role => {
      const roleMembers = allMembers.filter(m => role.memberIds?.includes(m.id) && !assignedIds.has(m.id));
      if (roleMembers.length > 0) {
        groups.push({ role, members: roleMembers });
        roleMembers.forEach(m => assignedIds.add(m.id));
      }
    });

    const remainingMembers = allMembers.filter(m => !assignedIds.has(m.id));
    if (remainingMembers.length > 0) {
      groups.push({ role: null, members: remainingMembers });
    }

    return groups;
  }, [view.type, activeRealm, usersDb]);

  const getMemberColor = (memberId: string) => {
    if (!activeRealm || !activeRealm.roles) return undefined;
    const reversedRoles = [...activeRealm.roles].reverse();
    const userRole = reversedRoles.find(r => r.id !== 'everyone' && r.memberIds?.includes(memberId));
    const everyoneRole = reversedRoles.find(r => r.id === 'everyone');
    return userRole?.color || (everyoneRole?.color !== '#ffffff' ? everyoneRole?.color : undefined);
  };

  if (view.type === 'realm' && activeRealm && groupedMembers) {
    return (
      <div className="w-60 bg-sidebar border-l border-subtle flex flex-col h-full overflow-y-auto p-4 space-y-6 no-scrollbar">
        {groupedMembers.map((group, idx) => (
          <div key={group.role?.id || 'online'} className="space-y-1">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-2 mb-2 opacity-50">
              {group.role ? group.role.name : 'Explorers'} — {group.members.length}
            </h3>
            {group.members.map(member => {
              const color = getMemberColor(member.id);
              const aura = shopItems.find(p => p.id === member.equippedAuraId);
              const hasCustomAura = aura?.isAura && aura.icon && aura.icon.length > 10;
              const hasStandardRing = aura?.isAura && (!aura.icon || aura.icon.length <= 10);
              const ringColor = member.iconBorderColor || '#ffffff';
              const memberOnline = isOnline(member.lastActive);
              const ringScale = 130; // Icon borders always scale at 130%
              
              return (
                <div 
                  key={member.id} 
                  onClick={() => onViewProfile(member)}
                  className={`flex items-center gap-3 px-2 py-1.5 rounded hover:bg-modifier-hover cursor-pointer group ${memberOnline ? 'opacity-100' : 'opacity-50'}`}
                >
                  <div 
                    className="w-8 h-8 rounded-full bg-[#1e1f22] flex-shrink-0 relative border flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{ 
                      borderColor: hasStandardRing ? ringColor : 'transparent',
                      borderWidth: hasStandardRing ? '1.5px' : '0px',
                      padding: hasStandardRing ? '1px' : '0px'
                    }}
                  >
                    {hasCustomAura && (
                       <div 
                        className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
                        style={{ transform: `scale(${ringScale/100})` }}
                       >
                         <div className="w-full h-full" style={{ background: `url(${aura.icon}) center/contain no-repeat` }} />
                       </div>
                    )}
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-tertiary relative z-0">
                      {member.avatarUrl ? <img src={member.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] uppercase font-black text-white/10">{member.displayName?.[0] || '?'}</div>}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-sm font-bold truncate transition-colors"
                      style={{ color: color || 'var(--text-muted)' }}
                    >
                      {member.displayName}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  if (view.type === 'dm' && activeFriend) {
    const profileUser = usersDb.find(u => u.id === activeFriend.id);
    const aura = shopItems.find(p => p.id === profileUser?.equippedAuraId);
    
    const hasCustomAura = aura?.isAura && aura.icon && aura.icon.length > 10;
    const hasStandardRing = aura?.isAura && (!aura.icon || aura.icon.length <= 10);
    const ringColor = profileUser?.iconBorderColor || activeFriend.iconBorderColor || '#ffffff';
    const ringScale = 130; // Icon borders always scale at 130%
    
    const hasPulse = profileUser?.unlockedItems?.includes('pulse');
    const friendOnline = isOnline(profileUser?.lastActive || activeFriend.lastActive);

    return (
      <div className="w-60 bg-sidebar border-l border-subtle flex flex-col h-full overflow-y-auto text-center no-scrollbar">
        <div className="h-24 shrink-0 overflow-hidden relative" style={{ backgroundColor: profileUser?.bannerUrl ? 'transparent' : (profileUser?.bannerColor || 'var(--accent-color)') }}>
          {profileUser?.bannerUrl && <img src={profileUser.bannerUrl} alt="banner" className="w-full h-full object-cover" />}
        </div>
        <div className="p-4 pt-0 relative -mt-10">
          <div 
            onClick={() => profileUser && onViewProfile(profileUser)}
            className="w-20 h-20 rounded-full bg-[#1e1f22] flex items-center justify-center shadow-xl mb-3 mx-auto cursor-pointer hover:scale-105 transition-transform relative"
            style={{ 
              border: hasStandardRing ? `3px solid ${ringColor}` : 'none',
              padding: hasStandardRing ? '2px' : '0px'
            }}
          >
            {hasCustomAura && (
               <div 
                className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
                style={{ transform: `scale(${ringScale/100})` }}
               >
                 <div className="w-full h-full" style={{ background: `url(${aura.icon}) center/contain no-repeat` }} />
               </div>
            )}
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#1e1f22] relative z-0">
              {activeFriend.avatarUrl ? <img src={activeFriend.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white/10">{activeFriend.initials || (activeFriend.name?.[0] || '?')}</div>}
            </div>
            <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-[4px] border-[#1e1f22] ${friendOnline ? 'bg-green-500' : 'bg-neutral-500'}`} />
          </div>
          <div className="bg-tertiary/50 p-4 rounded-xl border border-subtle space-y-4 text-left">
             <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <h3 className="text-lg font-bold text-primary">{profileUser?.displayName || activeFriend.name}</h3>
                  {hasPulse && <Icons.PulseBadge className="w-4 h-4 text-[#a855f7] drop-shadow-[0_0_5px_rgba(168,85,247,0.4)]" />}
                </div>
                <p className="text-xs text-muted">@{profileUser?.username || activeFriend.name.toLowerCase().replace(/\s+/g, '')}</p>
             </div>
             <div className="h-[1px] bg-subtle" />
             <div>
                <h4 className="text-[10px] font-bold text-primary uppercase mb-1">About Me</h4>
                <p className="text-xs text-muted leading-relaxed">{profileUser?.bio || "No description set yet."}</p>
             </div>
             <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-primary uppercase">Resources</h4>
                <div className="flex items-center gap-1 text-[#a855f7] drop-shadow-[0_0_5px_rgba(168,85,247,0.3)]">
                  <Icons.Amethyst className="w-3 h-3" />
                  <span className="text-[10px] font-black">{profileUser?.shards || 0}</span>
                </div>
             </div>
             {profileUser?.socialLinks && (
               <div>
                  <h4 className="text-[10px] font-bold text-primary uppercase mb-2">Links</h4>
                  <div className="flex flex-col gap-2">
                    {profileUser.socialLinks.youtube && <a href={profileUser.socialLinks.youtube} target="_blank" className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded hover:bg-red-500/20 truncate">YouTube</a>}
                    {profileUser.socialLinks.tiktok && <a href={profileUser.socialLinks.tiktok} target="_blank" className="text-[10px] bg-pink-500/10 text-pink-500 px-2 py-1 rounded hover:bg-pink-500/20 truncate">TikTok</a>}
                    {profileUser.socialLinks.twitch && <a href={profileUser.socialLinks.twitch} target="_blank" className="text-[10px] bg-purple-500/10 text-purple-500 px-2 py-1 rounded hover:bg-purple-500/20 truncate">Twitch</a>}
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  return <div className="w-60 bg-sidebar border-l border-subtle flex items-center justify-center text-muted text-xs italic text-center">Select a conversation</div>;
};
