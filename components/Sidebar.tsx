import React, { useState, useEffect } from 'react';
import { Friend, User, Realm, Section, Chat, ShopItem } from '../types';
import { Icons } from '../constants';

interface SidebarProps {
  view: any;
  friends: Friend[];
  onSelectFriend: (id: string) => void;
  onAddFriend: () => void;
  onOpenSettings: () => void;
  onOpenShop: () => void;
  onOpenRegistry: () => void;
  onOpenCreateGroup: () => void;
  currentUser: User | null;
  activeRealm: Realm | null;
  onSelectChat: (realmId: string, chatId: string) => void;
  onOpenCreateSection: (realmId: string) => void;
  onOpenCreateChat: (realmId: string, sectionId: string) => void;
  onOpenInvite: () => void;
  onOpenEditSection: (realmId: string, sectionId: string, initialName: string) => void;
  onOpenEditChat: (realmId: string, sectionId: string, chatId: string) => void;
  onReorderSections: (realmId: string, newSections: Section[]) => void;
  onMoveChat: (realmId: string, sourceSecId: string, targetSecId: string, chatId: string, targetIndex: number) => void;
  onDeleteSection: (realmId: string, sectionId: string) => void;
  onDeleteChat: (realmId: string, sectionId: string, chatId: string) => void;
  onRemoveItem: (id: string) => void;
  onLeaveGroup: (id: string) => void;
  onViewProfile: (item: Friend | User) => void;
  onViewMembers: (item: Friend) => void;
  onLeaveRealm: (realmId: string) => void;
  onOpenRealmSettings: (realmId: string) => void;
  onRenameChat: (realmId: string, sectionId: string, chatId: string, initialName: string) => void;
  onDeleteChat_Legacy?: (realmId: string, sectionId: string, chatId: string) => void;
  onReportRealm: (realm: Realm) => void;
  shopItems: ShopItem[];
  renderInteractiveText?: (id: string, defaultText: string, className?: string) => React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  view, friends, onSelectFriend, onAddFriend, onOpenSettings, onOpenShop, onOpenRegistry, onOpenCreateGroup, 
  currentUser, activeRealm, onSelectChat, onRemoveItem, onLeaveGroup, onViewProfile, 
  onOpenCreateSection, onOpenCreateChat, onOpenInvite, onLeaveRealm, onOpenRealmSettings,
  onOpenEditSection, onReorderSections, onMoveChat, onDeleteSection, onDeleteChat,
  onRenameChat, onReportRealm, shopItems, renderInteractiveText
}) => {
  const [showRealmMenu, setShowRealmMenu] = useState(false);
  const isOwner = activeRealm?.ownerId === currentUser?.id;
  const userRoles = activeRealm?.roles?.filter(r => r.memberIds?.includes(currentUser?.id || '')) || [];
  const isAdmin = isOwner || userRoles.some(r => r.permissions?.includes('ADMINISTRATOR'));
  const isGlobalAdmin = currentUser?.isGlobalAdmin || ['beanie', 'realms', 'relms'].includes(currentUser?.normalizedUsername || '');

  const equippedAura = shopItems.find(p => p.id === currentUser?.equippedAuraId);
  const hasStandardRing = equippedAura?.isAura && (!equippedAura.icon || equippedAura.icon.length <= 10);

  const isDmHub = view.type === 'dm' && !view.friendId;

  const rit = renderInteractiveText || ((id, def) => def);

  return (
    <div className={`w-72 bg-sidebar hidden md:flex flex-col h-full border-r border-white/5 absolute md:relative z-40 transition-transform duration-300 transform font-sans shadow-2xl`}>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {view.type === 'dm' || view.type === 'shop' || view.type === 'registry' || view.type === 'pending_requests' ? (
          <div className="flex flex-col h-full animate-in fade-in duration-300">
            {!isDmHub && (
              <div className="p-6 space-y-3 border-b border-white/5 bg-black/20">
                <button onClick={onOpenShop} className="w-full bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-black text-[11px] uppercase tracking-[0.25em] py-4 px-4 rounded-2xl flex items-center justify-center gap-3 hover:brightness-110 shadow-xl transition-all active:scale-[0.97]">
                  <Icons.Shop /> {rit('sidebar_marketplace', 'MARKETPLACE')}
                </button>
                {isGlobalAdmin && (
                  <button onClick={onOpenRegistry} className="w-full bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.25em] py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-[0.97]">
                    <Icons.Inventory /> {rit('sidebar_registry', 'REGISTRY')}
                  </button>
                )}
              </div>
            )}
            <div className="p-6 pb-2 border-b border-white/5 bg-black/20">
              <div className="px-2 flex items-center justify-between">
                <span className="text-[9px] font-black text-muted uppercase tracking-[0.4em] opacity-40">{rit('sidebar_dm_header', 'Direct Messages')}</span>
                <button onClick={onAddFriend} className="text-muted hover:text-accent hover:scale-125 transition-all p-1"><Icons.Plus /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 no-scrollbar">
              {friends.map((friend) => (
                <button key={friend.id} onClick={() => onSelectFriend(friend.id)} className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all group active:scale-[0.98] ${view.friendId === friend.id ? 'bg-accent text-black font-black shadow-xl ring-2 ring-[var(--accent-color-dark)]' : 'text-muted hover:bg-white/5 hover:text-primary'}`}>
                  <div className="w-10 h-10 rounded-full bg-primary flex-shrink-0 relative flex items-center justify-center border border-white/5">
                    {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full object-cover rounded-full" /> : <div className="text-[10px] font-black uppercase text-white/20">{friend.initials}</div>}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-[3px] border-sidebar ${friend.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-neutral-500'}`} />
                  </div>
                  <div className="text-[13px] font-black truncate flex-1 text-left uppercase tracking-tight">{friend.name}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col relative overflow-hidden animate-in fade-in">
            <div className="p-6 border-b border-white/5 bg-black/20">
               <button onClick={onOpenInvite} className="w-full bg-accent text-black font-black text-[11px] uppercase tracking-[0.2em] py-4 px-4 rounded-2xl flex items-center justify-center gap-3 hover:brightness-110 shadow-xl active:scale-95">{rit('sidebar_invite_btn', 'Invite Members +')}</button>
            </div>
            <div className="h-16 flex items-center justify-between px-6 font-black text-[12px] uppercase tracking-[0.2em] bg-white/[0.02] border-b border-white/5 group cursor-pointer hover:bg-white/5 transition-all relative shrink-0" onClick={() => setShowRealmMenu(!showRealmMenu)}>
              <span className="truncate flex items-center gap-3">
                <span className="truncate">{activeRealm?.name || 'Realm'}</span>
                {activeRealm?.isVerified && <span className="text-accent drop-shadow-[0_0_8px_rgba(var(--accent-color-rgb),0.4)]"><Icons.Verified /></span>}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className={`transition-transform duration-300 ${showRealmMenu ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </span>
              {showRealmMenu && (
                <div className="absolute top-full left-4 right-4 mt-2 bg-[#161719] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 backdrop-blur-xl p-1.5">
                   {isAdmin && <button onClick={() => onOpenRealmSettings(activeRealm!.id)} className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between group/item"><span>{rit('sidebar_realm_settings', 'Realm Settings')}</span><Icons.Settings /></button>}
                   <button onClick={() => onReportRealm(activeRealm!)} className="w-full text-left px-4 py-3 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center justify-between"><span>{rit('sidebar_report_realm', 'Report Realm')}</span><span>⚠️</span></button>
                   <button onClick={() => onLeaveRealm(activeRealm!.id)} className="w-full text-left px-4 py-3 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center justify-between group/item"><span>{rit('sidebar_leave_realm', 'Leave Realm')}</span><Icons.Logout /></button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
              {activeRealm?.sections.map((section) => (
                <div key={section.id} className="space-y-1">
                  <div className="flex items-center justify-between group px-4">
                     <div className="text-[9px] font-black text-muted uppercase tracking-[0.4em] truncate flex-1 py-1 opacity-30 group-hover:opacity-60 transition-opacity">{section.name}</div>
                     {isAdmin && <button onClick={() => activeRealm && onOpenCreateChat(activeRealm.id, section.id)} className="text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-all p-1"><Icons.Plus /></button>}
                  </div>
                  {section.chats.map((chat) => (
                    <button key={chat.id} onClick={() => activeRealm && onSelectChat(activeRealm.id, chat.id)} className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-2xl transition-all text-[13px] font-black uppercase tracking-tight active:scale-[0.98] ${view.chatId === chat.id ? 'bg-white/10 text-accent shadow-sm' : 'text-muted hover:bg-white/[0.03] hover:text-primary'}`}>
                      <span className="text-base opacity-20 font-light flex-shrink-0">{chat.type === 'rules' ? '📜' : '#'}</span>
                      <span className="truncate flex-1 text-left">{chat.name}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isDmHub && (
        <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md">
          <div className="bg-white/5 rounded-3xl p-2.5 flex items-center gap-4 border border-white/5 shadow-inner">
            <div onClick={() => currentUser && onViewProfile(currentUser)} className="flex flex-1 items-center gap-3 cursor-pointer group min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#1e1f22] flex-shrink-0 flex items-center justify-center relative shadow-xl" style={{ border: hasStandardRing ? `2.5px solid ${currentUser?.iconBorderColor || '#ffffff'}` : 'none', padding: hasStandardRing ? '2px' : '0' }}>
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-tertiary">
                  {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-[11px] uppercase font-black text-white/10">{currentUser?.displayName?.[0]}</span>}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-black truncate group-hover:text-accent transition-colors uppercase tracking-tight">{currentUser?.displayName}</div>
                <div className="text-[9px] text-muted truncate leading-tight font-black mt-0.5 opacity-30">@{currentUser?.username}</div>
              </div>
            </div>
            <button onClick={onOpenSettings} className="p-2.5 text-muted hover:text-accent hover:bg-white/10 transition-all rounded-2xl active:rotate-45">
              <Icons.Settings />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};