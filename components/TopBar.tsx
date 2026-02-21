import React, { useState, useRef, useEffect } from 'react';
import { Friend, Realm, User } from '../types';
import { Icons } from '../constants';
import { SyncStatus } from '../App';

interface TopBarProps {
  view: any;
  activeFriend: Friend | null;
  activeRealm: Realm | null;
  pendingCount?: number;
  onToggleSidebar?: () => void;
  onToggleRightSidebar?: () => void;
  isMobile?: boolean;
  isAdmin?: boolean;
  syncStatus?: SyncStatus;
  onStartCall?: (userId: string, isVideo: boolean) => void;
  onLeaveGroup?: (groupId: string) => void;
  renderInteractiveText?: (id: string, defaultText: string, className?: string) => React.ReactNode;
  currentUser: User | null;
  friends: Friend[];
}

export const TopBar: React.FC<TopBarProps> = ({ 
  view, activeFriend, activeRealm, pendingCount = 0, onToggleSidebar, isMobile, syncStatus = 'connecting', onStartCall, onLeaveGroup, renderInteractiveText, currentUser, friends
}) => {
  const [showFriendsMenu, setShowFriendsMenu] = useState(false);
  const friendsMenuRef = useRef<HTMLDivElement>(null);

  const activeChat = activeRealm?.sections
    .flatMap(s => s.chats)
    .find(ch => ch.id === (view.type === 'realm' ? (view as any).chatId : null));

  const rit = renderInteractiveText || ((id, def) => def);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (friendsMenuRef.current && !friendsMenuRef.current.contains(e.target as Node)) {
        setShowFriendsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-14 sm:h-16 border-b border-white/5 bg-chat/20 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 shrink-0 text-primary w-full shadow-lg z-[200] sticky top-0">
      <div className="flex items-center gap-2 sm:gap-6 min-w-0 flex-1 h-full">
        {view.type === 'dm' && activeFriend ? (
          <div className="flex items-center gap-3 truncate">
            <div className="text-sm sm:text-base font-black truncate uppercase tracking-tight">{activeFriend.name}</div>
            <div className={`w-2 h-2 rounded-full ${activeFriend.status === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-neutral-600'}`} />
          </div>
        ) : view.type === 'realm' ? (
          <div className="flex items-center gap-2 sm:gap-3 truncate">
            <div className="text-muted text-lg sm:text-xl font-light opacity-40">#</div>
            <div className="flex items-center gap-2 truncate">
              <div className="text-sm sm:text-base font-black truncate uppercase tracking-tighter">{activeChat?.name || 'Lobby'}</div>
              {activeRealm?.isVerified && <div className="text-accent drop-shadow-[0_0_8px_rgba(var(--accent-color-rgb),0.3)]"><Icons.Verified /></div>}
            </div>
          </div>
        ) : (
           <div className="text-sm sm:text-base font-black uppercase tracking-widest opacity-60">
             {rit('topbar_home_hub', 'Home Hub')}
           </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 text-muted shrink-0 relative" ref={friendsMenuRef}>
        {view.type === 'dm' && activeFriend && !activeFriend.isGroup && (
          <button onClick={() => onStartCall?.(activeFriend.id, false)} className="p-1.5 sm:p-2 hover:text-white hover:bg-white/5 rounded-xl transition-all"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></button>
        )}

        <button 
          onClick={() => setShowFriendsMenu(!showFriendsMenu)}
          className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-white/10 hover:border-accent/40 transition-all active:scale-95 shadow-lg group"
        >
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center font-black text-white/20 text-xs uppercase">{currentUser?.displayName?.[0]}</div>
          )}
        </button>

        {showFriendsMenu && isMobile && (
          <div className="absolute top-full right-0 mt-3 w-[280px] bg-[#161719] border border-white/10 rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-top-2 ring-1 ring-white/10 z-[1000]">
            <div className="p-5 border-b border-white/5 bg-white/[0.02]">
              <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Frequencies</h4>
            </div>
            <div className="max-h-[360px] overflow-y-auto p-2 space-y-1 no-scrollbar">
              {friends.length === 0 ? (
                <div className="p-8 text-center opacity-30 italic text-[10px] font-bold uppercase tracking-widest">None Linked</div>
              ) : (
                friends.map(friend => (
                  <button 
                    key={friend.id} 
                    onClick={() => { setShowFriendsMenu(false); /* Selection logic handled by parent */ }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all text-left group"
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-primary border border-white/5">
                        {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white/10">{friend.initials}</div>}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-[3px] border-[#161719] ${friend.status === 'online' ? 'bg-green-500' : 'bg-neutral-600'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white uppercase tracking-tight truncate group-hover:text-accent transition-colors">{friend.name}</p>
                      <p className="text-[9px] text-muted font-bold opacity-40 truncate">@{friend.username}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-2xl shadow-inner`}>
          <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'connected' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
          <span className="text-[8px] font-black uppercase tracking-widest text-muted">{syncStatus === 'connected' ? 'READY' : 'WAIT'}</span>
        </div>
      </div>
    </div>
  );
};