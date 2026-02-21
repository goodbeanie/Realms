
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { Auth } from './components/Auth';
import { Settings } from './components/Settings';
import { CreateRealmModal } from './components/CreateRealmModal';
import { AddFriendModal } from './components/AddFriendModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { ProfileModal } from './components/ProfileModal';
import { JoinRealmModal } from './components/JoinRealmModal';
import { TheNebula } from './components/TheNebula';
import { ArtifactRegistry } from './components/ArtifactRegistry';
import { FriendsPage } from './components/FriendsPage';
import { InviteModal } from './components/InviteModal';
import { SuspendUserModal } from './components/SuspendUserModal';
// Added FriendRequest to the import list below
import { Friend, FriendRequest, User, Realm, GlobalChat, GlobalMessage, ShopItem, RedeemCode, ResaleItem, Message, Quest } from './types';
import { TopNav } from './components/TopNav';
import { p2pSync } from './services/p2p';
import { MediaConnection } from 'peerjs';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  db, 
  subscribeUsers, 
  subscribeRealms, 
  subscribeChatHistory, 
  subscribeShopItems, 
  subscribeRedeemCodes,
  subscribeResaleItems,
  subscribeChatMetadata,
  subscribeFriendRequests,
  subscribeSystemConfig,
  subscribeQuests,
  pushUser,
  pushRealm,
  pushChatHistory,
  pushShopItem,
  pushResaleItem,
  pushQuest,
  deleteShopItem,
  deleteResaleItem,
  deleteQuest,
  pushChatMetadata,
  pushFriendRequest,
  deleteFriendRequest,
  pushSystemConfig
} from './firebase';
import { DEFAULT_PRODUCTS } from './constants';

const SESSION_ACCOUNTS_KEY = 'nebula_session_accounts';
export type SyncStatus = 'connecting' | 'connected' | 'error' | 'syncing' | 'signal-lost';

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255, 209, 84';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
};

const darkenHex = (hex: string, amount: number): string => {
  const clamp = (val: number) => Math.min(Math.max(val, 0), 255);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = clamp(parseInt(result[1], 16) - amount);
  const g = clamp(parseInt(result[2], 16) - amount);
  const b = clamp(parseInt(result[3], 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [realms, setRealms] = useState<Realm[]>([]);
  const [chatsMetadata, setChatsMetadata] = useState<GlobalChat[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>(DEFAULT_PRODUCTS);
  const [resaleItems, setResaleItems] = useState<ResaleItem[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeChatMessages, setActiveChatMessages] = useState<GlobalMessage[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>({});
  const [activeCall, setActiveCall] = useState<any>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  
  const [authId, setAuthId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('nebula_current_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return typeof parsed === 'object' ? parsed.id : null;
    } catch { return null; }
  });
  const [sessionAccountIds, setSessionAccountIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(SESSION_ACCOUNTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  const [modalState, setModalState] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const [view, setView] = useState<any>({ type: 'dm', friendId: null });
  const [friendsTab, setFriendsTab] = useState<'all' | 'pending' | 'reports' | 'editor' | 'quests'>('all');

  const currentUser = useMemo(() => users.find(u => u.id === authId) || null, [users, authId]);
  const isAdmin = useMemo(() => currentUser?.isGlobalAdmin || ['beanie', 'realms', 'relms'].includes(currentUser?.normalizedUsername || ''), [currentUser]);
  const isModerator = useMemo(() => isAdmin || currentUser?.isModerator, [isAdmin, currentUser]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleForgeAIQuests = async () => {
    if (!authId || !currentUser) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const minReward = systemConfig.minQuestReward || 10;
      const maxReward = systemConfig.maxQuestReward || 150;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate 3 daily tasks for a messaging app. RewardShards MUST be between ${minReward} and ${maxReward}. JSON format: { "title": string, "description": string, "type": string, "targetValue": number, "rewardShards": number, "icon": string }`,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING },
                targetValue: { type: Type.NUMBER },
                rewardShards: { type: Type.NUMBER },
                icon: { type: Type.STRING }
              },
              required: ['title', 'description', 'type', 'targetValue', 'rewardShards', 'icon']
            }
          }
        }
      });

      const newQuestsData = (JSON.parse(response.text || '[]') as any[]) || [];
      for (const q of newQuestsData) {
        const qId = 'quest_' + Math.random().toString(36).substring(2, 11);
        await pushQuest(qId, { ...q, id: qId, isDaily: true, isQueued: true, timestamp: Date.now(), createdBy: authId });
      }
    } catch (e) { console.error("Forge failed:", e); }
  };

  const friendsList = useMemo(() => {
    if (!currentUser) return [];
    const friendIdsList = currentUser.friendIds || [];
    const direct: Friend[] = users.filter(u => friendIdsList.includes(u.id)).map(u => ({ 
      id: u.id, name: u.displayName, username: u.username, status: (Date.now() - (u.lastActive || 0)) < 60000 ? 'online' : 'offline', initials: u.displayName?.[0] || '?', avatarUrl: u.avatarUrl, iconBorderColor: u.iconBorderColor 
    }));
    const groups: Friend[] = chatsMetadata.filter(c => c.isGroup && c.participantIds?.includes(currentUser.id)).map(c => ({ 
      id: c.id, name: c.name || 'Group', username: 'group', status: 'online' as any, initials: (c.name || 'G')[0] || 'G', isGroup: true, memberIds: c.participantIds 
    }));
    return [...direct, ...groups];
  }, [users, chatsMetadata, currentUser]);

  useEffect(() => {
    if (!db) { setSyncStatus('connected'); return; }
    const unsubUsers = subscribeUsers(setUsers);
    const unsubRealms = subscribeRealms(setRealms);
    const unsubItems = subscribeShopItems(setShopItems);
    const unsubCodes = subscribeRedeemCodes(setRedeemCodes);
    const unsubResale = subscribeResaleItems(setResaleItems);
    const unsubMeta = subscribeChatMetadata(setChatsMetadata);
    const unsubConfig = subscribeSystemConfig(setSystemConfig);
    const unsubQuests = subscribeQuests(setQuests);
    const unsubRequests = authId ? subscribeFriendRequests(authId, setFriendRequests) : () => {};
    setSyncStatus('connected');
    return () => { unsubUsers(); unsubRealms(); unsubItems(); unsubCodes(); unsubResale(); unsubMeta(); unsubConfig(); unsubQuests(); unsubRequests(); };
  }, [authId]);

  useEffect(() => {
    if (authId) {
      p2pSync.init(authId);
      p2pSync.setOnIncomingCall((call: MediaConnection) => {
        const remoteUser = users.find(u => u.id === call.peer);
        if (!remoteUser) return;
        if (!ringtoneRef.current) {
          ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
          ringtoneRef.current.loop = true; ringtoneRef.current.volume = 0.5;
        }
        ringtoneRef.current.play().catch(() => {});
        setActiveCall({ connection: call, localStream: null, remoteStream: null, isIncoming: true, remoteUser, isVideo: true, isScreenSharing: false, status: 'connecting' });
        call.on('stream', (stream) => setActiveCall((prev: any) => prev ? { ...prev, remoteStream: stream, status: 'connected' } : null));
        call.on('close', () => setActiveCall(null));
      });
    }
  }, [authId, users]);

  useEffect(() => {
    const root = document.documentElement;
    if (currentUser) {
      const accent = currentUser.accentColor || '#ffd154';
      root.style.setProperty('--accent-color', accent);
      root.style.setProperty('--accent-color-rgb', hexToRgb(accent));
      root.style.setProperty('--accent-color-dark', darkenHex(accent, 40));
      root.classList.remove('light-mode', 'custom-mode');
      if (currentUser.theme === 'custom' && currentUser.customTheme) {
        root.classList.add('custom-mode');
        root.style.setProperty('--bg-primary', currentUser.customTheme.bg);
        root.style.setProperty('--text-primary', currentUser.customTheme.text);
      } else if (currentUser.theme === 'light') {
        root.classList.add('light-mode');
      }
    }
  }, [currentUser]);

  const handleSendMessage = async (content: string) => {
    const chatId = view.type === 'dm' && view.friendId ? (view.friendId.includes('group_') ? view.friendId : [authId, view.friendId].sort().join(':')) : view.chatId;
    if (!authId || !chatId || !currentUser) return;

    const now = Date.now();
    const messageData = { id: Math.random().toString(36).substring(2, 11), senderId: authId, content, timestamp: now, readStatus: { [authId]: true } };
    await pushChatHistory(chatId, [...activeChatMessages, messageData]);
    await pushUser(authId, { 
      messageCount: (currentUser.messageCount || 0) + 1, shards: (currentUser.shards || 0) + 1,
      dailyMsgCount_dms: view.type === 'dm' && !view.friendId?.includes('group_') ? (currentUser.dailyMsgCount_dms || 0) + 1 : (currentUser.dailyMsgCount_dms || 0),
      dailyMsgCount_realms: view.type === 'realm' ? (currentUser.dailyMsgCount_realms || 0) + 1 : (currentUser.dailyMsgCount_realms || 0),
      dailyMsgCount_groups: view.type === 'dm' && view.friendId?.includes('group_') ? (currentUser.dailyMsgCount_groups || 0) + 1 : (currentUser.dailyMsgCount_groups || 0),
    });
  };

  const handleResalePurchase = async (resaleId: string) => {
    const sale = resaleItems.find(r => r.id === resaleId);
    if (!sale || !currentUser) return;
    const seller = users.find(u => u.id === sale.sellerId);
    const item = shopItems.find(i => i.id === sale.itemId);
    const creator = item?.createdBy ? users.find(u => u.id === item.createdBy) : null;
    const dividendsNode = users.find(u => u.normalizedUsername === (systemConfig.earningsUsername || 'beanie'));
    if (currentUser.shards < sale.price) return;

    const sellerProfitPct = systemConfig.sellerProfitPct ?? 50;
    const creatorProfitPct = systemConfig.creatorProfitPct ?? 40;
    const nebulaProfitPct = systemConfig.nebulaProfitPct ?? 10;
    const sellerCut = Math.floor(sale.price * (sellerProfitPct / 100));
    const creatorCut = Math.floor(sale.price * (creatorProfitPct / 100));
    const nodeCut = Math.floor(sale.price * (nebulaProfitPct / 100));

    await pushUser(currentUser.id, { shards: currentUser.shards - sale.price, unlockedItems: [...(currentUser.unlockedItems || []), sale.itemId] });
    if (seller) await pushUser(seller.id, { shards: (seller.shards || 0) + sellerCut });
    if (creator) await pushUser(creator.id, { shards: (creator.shards || 0) + creatorCut });
    if (dividendsNode) await pushUser(dividendsNode.id, { shards: (dividendsNode.shards || 0) + nodeCut });
    await deleteResaleItem(resaleId);
  };

  const messages = useMemo(() => activeChatMessages.map(m => { const sender = users.find(u => u.id === m.senderId); return { ...m, authorId: m.senderId, authorName: sender?.displayName || 'Explorer', authorAvatar: sender?.avatarUrl, isMe: m.senderId === authId } as Message; }), [activeChatMessages, authId, users]);

  if (!currentUser) return <Auth globalStore={{ users, requests: friendRequests, chats: chatsMetadata, realms, lastUpdated: Date.now() }} syncStatus={syncStatus} renderInteractiveText={(id, def) => def} />;

  return (
    <div className="app-window max-w-[1920px] max-h-[1080px] shadow-2xl overflow-hidden ring-1 ring-white/5 flex flex-col h-screen w-screen">
      <TopNav realms={realms.filter(r => r.memberIds?.includes(authId!) && !r.isBanned)} activeRealmId={view.type === 'realm' ? view.realmId : null} onSelectRealm={id => setView(id === null ? { type: 'dm', friendId: null } : { type: 'realm', realmId: id, chatId: realms.find(r => r.id === id)?.sections[0]?.chats[0]?.id || null })} onOpenCreateRealm={() => setModalState({ type: 'create_realm' })} onOpenJoinRealm={() => setModalState({ type: 'join_realm' })} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar shopItems={shopItems} view={view} friends={friendsList} onSelectFriend={id => setView({ type: 'dm', friendId: id })} onAddFriend={() => setModalState({ type: 'add_friend' })} onOpenSettings={() => setIsSettingsOpen(true)} onOpenShop={() => setView({ type: 'shop' })} onOpenRegistry={() => setView({ type: 'registry' })} onOpenCreateGroup={() => setModalState({ type: 'create_group' })} currentUser={currentUser} activeRealm={realms.find(r => r.id === view.realmId) || null} onSelectChat={(rid, cid) => setView({ type: 'realm', realmId: rid, chatId: cid })} onOpenInvite={() => setModalState({ type: 'invite' })} onLeaveRealm={() => {}} onOpenRealmSettings={rid => setModalState({ type: 'realm_settings', rid })} onReportRealm={() => {}} onViewProfile={u => setModalState({ type: 'view_profile', item: u })} onOpenCreateSection={() => {}} onOpenCreateChat={(rid, sid) => setModalState({ type: 'create_chat', rid, sid })} onOpenEditSection={() => {}} onRenameChat={() => {}} onDeleteSection={() => {}} onDeleteChat={() => {}} onRemoveItem={() => {}} onLeaveGroup={() => {}} onViewMembers={f => setModalState({ type: 'view_members', item: f })} onReorderSections={() => {}} onMoveChat={() => {}} onOpenEditChat={() => {}} />
        
        <main className="flex-1 flex flex-col bg-chat relative overflow-hidden border-l border-white/5">
          {view.type === 'shop' ? (
            <TheNebula user={currentUser} users={users} products={shopItems} resaleItems={resaleItems} redeemCodes={redeemCodes} systemConfig={systemConfig} onUpdateProducts={() => {}} onUpdateRedeemCodes={() => {}} onEquip={(id, t) => pushUser(authId!, { [t === 'aura' ? 'equippedAuraId' : 'equippedBannerId']: id || undefined })} onPurchase={(id, cost) => pushUser(authId!, { shards: currentUser.shards - cost, unlockedItems: [...(currentUser.unlockedItems || []), id] })} onResalePurchase={handleResalePurchase} onUnlistResale={deleteResaleItem} onListForResale={(id, p) => pushResaleItem('resale_' + Date.now(), { itemId: id, price: p, sellerId: authId!, timestamp: Date.now() })} onRedeemCode={async c => ({ success: false, message: '' })} onUpdateOtherUser={pushUser} onBack={() => setView({ type: 'dm', friendId: null })} />
          ) : view.type === 'registry' ? (
            <ArtifactRegistry shopItems={shopItems} onUpdateShopItem={pushShopItem} onDeleteShopItem={deleteShopItem} globalUsers={users} onUpdateOtherUser={pushUser} onBack={() => setView({ type: 'dm', friendId: null })} />
          ) : view.type === 'dm' && !view.friendId ? (
            <FriendsPage requests={friendRequests} friends={friendsList} reports={systemConfig.reports || []} isAdmin={isModerator} activeTab={friendsTab} onSetTab={setFriendsTab} onAccept={() => {}} onDecline={deleteFriendRequest} onSelectFriend={id => setView({ type: 'dm', friendId: id })} onAddFriend={() => setModalState({ type: 'add_friend' })} onResolveReport={() => {}} onBanRealm={() => {}} onCleanUpReports={() => {}} globalUsers={users} currentUser={currentUser} onOpenShop={() => setView({ type: 'shop' })} onOpenRegistry={() => setView({ type: 'registry' })} onOpenCreateGroup={() => setModalState({ type: 'create_group' })} onOpenSettings={() => setIsSettingsOpen(true)} onViewProfile={u => setModalState({ type: 'view_profile', item: u })} shopItems={shopItems} systemConfig={systemConfig} quests={quests} onCreateQuest={() => {}} onDeleteQuest={deleteQuest} onClaimQuest={q => pushUser(authId!, { shards: currentUser.shards + q.rewardShards, completedQuestIds: [...(currentUser.completedQuestIds || []), q.id] })} onClaimDailyBonus={() => {}} onForgeAIQuests={handleForgeAIQuests} onUpdateUIOverride={(k, v) => pushSystemConfig({ [k]: v })} />
          ) : (
            <ChatArea friends={friendsList} context={view.type === 'dm' ? { type: 'dm', friend: friendsList.find(f => f.id === view.friendId) || null } : { type: 'realm', realm: realms.find(r => r.id === view.realmId) || null, chatId: view.chatId }} messages={messages} onSendMessage={handleSendMessage} currentUser={currentUser} onToggleSidebar={() => {}} onToggleRightSidebar={() => {}} isMobile={isMobile} isAdmin={isAdmin} pendingCount={friendRequests.length} view={view} allRealms={realms} onJoinViaInvite={async () => ({ success: true, message: '' })} syncStatus={syncStatus} onViewProfile={u => setModalState({ type: 'view_profile', item: u })} users={users} onStartCall={() => {}} onLeaveGroup={() => {}} onUpdateChatRules={() => {}} onOpenSuspendModal={(targetUser, rid) => setModalState({ type: 'suspend_user', targetUser, realmId: rid })} />
          )}
        </main>
      </div>

      {isSettingsOpen && <Settings user={currentUser} accounts={users.filter(u => sessionAccountIds.includes(u.id))} isAdmin={isAdmin} onUpdateUser={u => pushUser(authId!, u)} onUpdateOtherUser={pushUser} onClose={() => setIsSettingsOpen(false)} onLogout={() => { setAuthId(null); localStorage.removeItem('nebula_current_user'); }} onSwitchAccount={u => setAuthId(u.id)} onAddAccount={() => setAuthId(null)} onRemoveIdentity={id => setSessionAccountIds(prev => prev.filter(x => x !== id))} uiOverrides={{}} onUpdateUIOverride={(k, v) => pushSystemConfig({ [k]: v })} globalUsers={users} systemConfig={systemConfig} shopItems={shopItems} onEnterEditMode={() => setIsSettingsOpen(false)} />}
      {modalState?.type === 'create_realm' && <CreateRealmModal onClose={() => setModalState(null)} onCreate={(n, a) => { const rid = 'realm_' + Date.now(); pushRealm(rid, { id: rid, name: n, avatarUrl: a, ownerId: authId!, memberIds: [authId!], initials: n[0].toUpperCase(), sections: [{ id: 'general', name: 'General', chats: [{ id: 'lobby-' + rid, name: 'lobby', type: 'text' }] }] }); setModalState(null); }} />}
      {modalState?.type === 'add_friend' && <AddFriendModal onClose={() => setModalState(null)} onSend={async () => ({ success: true, message: '' })} />}
      {modalState?.type === 'view_profile' && <ProfileModal friendId={modalState.item.id} users={users} shopItems={shopItems} onClose={() => setModalState(null)} isMe={modalState.item.id === authId} />}
    </div>
  );
};
