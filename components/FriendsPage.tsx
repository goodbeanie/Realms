import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Friend, FriendRequest, User, Report, ShopItem, Quest, QuestType } from '../types';
import { Icons } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";
import { pushUser } from '../firebase';

interface FriendsPageProps {
  requests: FriendRequest[];
  friends: Friend[];
  reports: Report[];
  isAdmin: boolean;
  activeTab: 'all' | 'pending' | 'reports' | 'editor' | 'quests';
  onSetTab: (tab: 'all' | 'pending' | 'reports' | 'editor' | 'quests') => void;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onSelectFriend: (id: string) => void;
  onAddFriend: () => void;
  onResolveReport: (id: string) => void;
  onBanRealm: (realmId: string, reportId: string) => void;
  onCleanUpReports: () => void;
  globalUsers?: User[];
  onUpdateUIOverride?: (key: string, value: any) => void;
  customLogoUrl?: string;
  currentUser: User | null;
  onOpenShop: () => void;
  onOpenRegistry: () => void;
  onOpenCreateGroup: () => void;
  onOpenSettings: () => void;
  onViewProfile: (user: User) => void;
  shopItems: ShopItem[];
  systemConfig: any;
  quests?: Quest[];
  onCreateQuest?: (q: Omit<Quest, 'id' | 'timestamp' | 'createdBy'>) => void;
  onDeleteQuest?: (id: string) => void;
  onClaimQuest?: (q: Quest) => void;
  onClaimDailyBonus?: () => void;
  onForgeAIQuests?: () => Promise<void>;
  onUpdateShopItem?: (id: string, data: any) => Promise<void>;
  onDeleteShopItem?: (id: string) => Promise<void>;
  onUpdateOtherUser?: (uid: string, updates: Partial<User>) => Promise<void>;
  renderInteractiveText?: (id: string, defaultText: string, className?: string) => React.ReactNode;
}

const QUEST_TYPE_CONFIG: { type: QuestType; label: string; desc: string }[] = [
  { type: 'SEND_MESSAGES', label: 'Send Messages', desc: 'Require messages to be transmitted' },
  { type: 'RESELL_ITEMS', label: 'Resell Items', desc: 'Require artifacts to be listed' },
  { type: 'CHAT_WITH_FRIENDS', label: 'Chat with Friends', desc: 'Engage with unique contacts' },
  { type: 'BUY_ITEM', label: 'Buy Item', desc: 'Require a purchase' },
  { type: 'ADD_AVATAR', label: 'Update Avatar', desc: 'Require a profile icon update' },
  { type: 'ADD_BANNER', label: 'Update Banner', desc: 'Require a profile banner update' },
  { type: 'ADD_BIO', label: 'Update Bio', desc: 'Require a profile biography' },
];

export const FriendsPage: React.FC<FriendsPageProps> = ({ 
  requests, friends, reports = [], isAdmin, activeTab, onSetTab, 
  onAccept, onDecline, onSelectFriend, onAddFriend, onResolveReport, onBanRealm, onCleanUpReports,
  globalUsers = [], onUpdateUIOverride, customLogoUrl,
  currentUser, onOpenShop, onOpenRegistry, onOpenCreateGroup, onOpenSettings, onViewProfile,
  shopItems, systemConfig, quests = [], onCreateQuest, onDeleteQuest, onClaimQuest, onClaimDailyBonus,
  onForgeAIQuests, renderInteractiveText
}) => {
  const [search, setSearch] = useState('');
  const [timeToReset, setTimeToReset] = useState('');
  
  const incomingRequests = requests.filter(r => r.status === 'pending');
  const pendingReports = reports.filter(r => r.status === 'pending');

  const rit = renderInteractiveText || ((id, def) => def);

  const [earningsUsernameInput, setEarningsUsernameInput] = useState(systemConfig.earningsUsername || 'beanie');

  const [resetHourPSTInput, setResetHourPSTInput] = useState(systemConfig.resetHourPST ?? 0);
  const [resetMinutePSTInput, setResetMinutePSTInput] = useState(systemConfig.resetMinutePST ?? 0);
  const [minRewardInput, setMinRewardInput] = useState(systemConfig.minQuestReward || 10);
  const [maxRewardInput, setMaxRewardInput] = useState(systemConfig.maxQuestReward || 150);
  const [shopShuffleLimitInput, setShopShuffleLimitInput] = useState(systemConfig.shopShuffleLimit || 5);

  // Economic Protocol Inputs
  const [sellerProfitPctInput, setSellerProfitPctInput] = useState(systemConfig.sellerProfitPct ?? 50);
  const [creatorProfitPctInput, setCreatorProfitPctInput] = useState(systemConfig.creatorProfitPct ?? 40);
  const [nebulaProfitPctInput, setNebulaProfitPctInput] = useState(systemConfig.nebulaProfitPct ?? 10);

  const [qTitle, setQTitle] = useState('');
  const [qDesc, setQDesc] = useState('');
  const [qType, setQType] = useState<QuestType>('SEND_MESSAGES');
  const [qTarget, setQTarget] = useState(10);
  const [qReward, setQReward] = useState(100);
  const [isForging, setIsForging] = useState(false);

  const isBeanie = currentUser?.normalizedUsername === 'beanie';

  // Timer logic for Quest reset
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const resetHourPST = systemConfig.resetHourPST ?? 0;
      const resetMinutePST = systemConfig.resetMinutePST ?? 0;
      const resetHourUTC = (resetHourPST + 8) % 24;
      const todayReset = new Date(now.getTime());
      todayReset.setUTCHours(resetHourUTC, resetMinutePST, 0, 0); 
      if (now.getTime() >= todayReset.getTime()) todayReset.setUTCDate(todayReset.getUTCDate() + 1);
      const diff = todayReset.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeToReset(`${h}h ${m}m ${s}s`);
    };
    updateTimer();
    const int = setInterval(updateTimer, 1000);
    return () => clearInterval(int);
  }, [systemConfig.resetHourPST, systemConfig.resetMinutePST]);

  const getQuestProgress = (quest: Quest) => {
    if (!currentUser) return 0;
    const getRawUserValue = (type: QuestType, isDaily?: boolean, location?: 'dms' | 'realms' | 'groups') => {
        if (!currentUser) return 0;
        switch(type) {
          case 'SEND_MESSAGES': 
            if (isDaily) {
              if (location === 'dms') return currentUser.dailyMsgCount_dms || 0;
              if (location === 'realms') return currentUser.dailyMsgCount_realms || 0;
              if (location === 'groups') return currentUser.dailyMsgCount_groups || 0;
              return (currentUser.dailyMsgCount_dms || 0) + (currentUser.dailyMsgCount_realms || 0) + (currentUser.dailyMsgCount_groups || 0);
            }
            return currentUser.messageCount || 0;
          case 'RESELL_ITEMS': return isDaily ? (currentUser.dailyResaleCount || 0) : (currentUser.resaleCount || 0);
          case 'BUY_ITEM': return currentUser.purchaseCount || 0;
          case 'ADD_AVATAR': return currentUser.avatarUrl ? 1 : 0;
          case 'ADD_BANNER': return currentUser.bannerUrl ? 1 : 0;
          case 'ADD_BIO': return (currentUser.bio && currentUser.bio.length > 5) ? 1 : 0;
          case 'CHAT_WITH_FRIENDS': return isDaily ? (currentUser.dailyChattedFriendIds?.length || 0) : (currentUser.dailyChattedFriendIds?.length || 0);
          default: return 0;
        }
      };
    const rawValue = getRawUserValue(quest.type, quest.isDaily, quest.requiredLocation);
    const baseline = currentUser.questBaselines?.[quest.id] || 0;
    const progress = Math.max(0, rawValue - baseline);
    if (['ADD_AVATAR', 'ADD_BANNER', 'ADD_BIO'].includes(quest.type)) return rawValue >= 1 ? 1 : 0;
    return progress;
  };

  const renderQuestCard = (q: Quest) => {
    const progress = getQuestProgress(q);
    const isCompleted = progress >= q.targetValue;
    const hasClaimed = currentUser?.completedQuestIds?.includes(q.id);
    const displayReward = q.isOld ? Math.floor(q.rewardShards * 0.25) : q.rewardShards;

    return (
      <div key={q.id} className={`bg-[#161719] border rounded-[24px] p-6 transition-all shadow-xl group ${isCompleted ? 'border-amber-500/30' : 'border-white/5'} ${q.isOld ? 'opacity-80 border-white/[0.03]' : ''}`}>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl shrink-0">
            {q.icon || '🎯'}
          </div>
          <div className="flex-1 space-y-4">
             <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                   <h4 className="text-lg font-bold text-white leading-tight truncate">{q.title}</h4>
                   <p className="text-sm text-neutral-300 font-medium mt-2 leading-relaxed">{q.description}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-xl border border-white/5 shrink-0 shadow-inner">
                   <Icons.Amethyst className="text-purple-400 w-3 h-3" />
                   <span className="text-sm font-black text-white tracking-tight">{displayReward}</span>
                   {q.isOld && <span className="text-[9px] text-red-400 font-black ml-1 uppercase">Penalty</span>}
                </div>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-muted uppercase tracking-wider px-1">
                  <span>{rit('friends_quest_progress', 'Progress')}</span>
                  <span className={isCompleted ? 'text-amber-500' : ''}>{Math.min(100, Math.floor((progress/q.targetValue)*100))}%</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
                  <div className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-white/10'}`} style={{ width: `${Math.min(100, (progress/q.targetValue)*100)}%` }} />
                </div>
             </div>
             {q.isOld && <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest opacity-60 italic">{rit('friends_old_label_v3', 'Archived Protocol — Reduced Yield Active')}</p>}
          </div>
          <div className="flex items-center shrink-0">
             {hasClaimed ? (
               <div className="px-8 py-3 rounded-xl bg-white/5 text-neutral-500 font-black text-[10px] uppercase cursor-default tracking-widest border border-white/5">{rit('friends_quest_claimed', 'Claimed')}</div>
             ) : (
               <button 
                 onClick={() => onClaimQuest?.(q)} 
                 disabled={!isCompleted} 
                 className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isCompleted ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95' : 'bg-white/5 text-muted opacity-30 cursor-not-allowed'}`}
               >
                 {isCompleted ? rit('friends_quest_claim_btn', 'Claim Reward') : `${progress} / ${q.targetValue}`}
               </button>
             )}
          </div>
        </div>
      </div>
    );
  };

  const handleSaveNexusParameters = () => {
    onUpdateUIOverride?.('resetHourPST', parseInt(resetHourPSTInput.toString()) || 0);
    onUpdateUIOverride?.('resetMinutePST', parseInt(resetMinutePSTInput.toString()) || 0);
    onUpdateUIOverride?.('minQuestReward', parseInt(minRewardInput.toString()) || 0);
    onUpdateUIOverride?.('maxQuestReward', parseInt(maxRewardInput.toString()) || 150);
    onUpdateUIOverride?.('shopShuffleLimit', parseInt(shopShuffleLimitInput.toString()) || 5);
  };

  const handleSaveEconomicProtocols = () => {
    onUpdateUIOverride?.('sellerProfitPct', parseInt(sellerProfitPctInput.toString()) || 0);
    onUpdateUIOverride?.('creatorProfitPct', parseInt(creatorProfitPctInput.toString()) || 0);
    onUpdateUIOverride?.('nebulaProfitPct', parseInt(nebulaProfitPctInput.toString()) || 0);
  };

  const handleForgeAIQuests = async () => {
    if (isForging || !onForgeAIQuests) return;
    setIsForging(true);
    try { await onForgeAIQuests(); } finally { setIsForging(false); }
  };

  const dailyQuests = useMemo(() => quests.filter(q => q.isDaily && !q.isQueued && !q.isOld), [quests]);
  const oldQuests = useMemo(() => quests.filter(q => q.isDaily && q.isOld), [quests]);

  return (
    <div className="flex-1 bg-chat flex flex-col overflow-hidden animate-in">
      <div className="h-14 sm:h-16 border-b border-white/5 bg-chat/40 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-lg z-20">
        <div className="flex items-center justify-between w-full h-full min-w-0">
          <div className="flex items-center gap-2 sm:gap-6 flex-1 min-w-0 h-full">
            <div className="flex items-center gap-2 text-muted shrink-0">
               <div className="w-5 h-5 text-accent">{customLogoUrl ? <img src={customLogoUrl} className="w-full h-full object-contain" alt="App Logo" /> : <Icons.Portal />}</div>
               <h2 className="font-bold text-sm text-white hidden xs:block">{rit('friends_title', 'Home')}</h2>
            </div>
            <div className="w-[1px] h-6 bg-white/10 mx-2 hidden xs:block" />
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1 h-full">
              <button onClick={() => onSetTab('all')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}>{rit('friends_tab_all', 'Explorers')}</button>
              <button onClick={() => onSetTab('pending')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'pending' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}>{rit('friends_tab_pending', 'Pending')}{incomingRequests.length > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">{incomingRequests.length}</span>}</button>
              <button onClick={() => onSetTab('quests')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'quests' ? 'bg-amber-500/20 text-amber-400' : 'text-muted hover:text-white'}`}>{rit('friends_tab_quests', 'Tasks')}</button>
              {isAdmin && (
                <>
                  <button onClick={() => onSetTab('reports')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'reports' ? 'bg-red-500/20 text-red-400' : 'text-muted hover:text-white'}`}>{rit('friends_tab_safety', 'Reports')}{pendingReports.length > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">{pendingReports.length}</span>}</button>
                  <button onClick={() => onSetTab('editor')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'editor' ? 'bg-blue-500/20 text-blue-400' : 'text-muted hover:text-white'}`}>{rit('friends_tab_config', 'Config')}</button>
                  <button onClick={onOpenRegistry} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-muted hover:text-white hover:bg-white/5`}>{rit('friends_tab_items', 'Items')}</button>
                </>
              )}
            </div>
          </div>
          <button onClick={onAddFriend} className="ml-4 bg-accent text-black font-bold text-[11px] px-5 py-2 rounded-xl uppercase hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-accent/20 shrink-0">{rit('friends_add_btn', 'ADD FRIEND +')}</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-10 bg-chat">
        <div className="max-w-5xl mx-auto space-y-16 pb-32">
          {activeTab === 'pending' && (
             <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
               <div>
                  <h2 className="text-3xl font-bold text-white">{rit('pending_title', 'Pending Requests')}</h2>
                  <p className="text-sm text-neutral-500 font-medium mt-1">{rit('pending_desc', 'Authorized explorers awaiting frequency synchronization.')}</p>
               </div>
               
               {incomingRequests.length === 0 ? (
                 <div className="py-24 flex flex-col items-center justify-center opacity-30 text-center bg-black/20 border-2 border-dashed border-white/5 rounded-[40px]">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">📬</div>
                    <p className="text-sm font-black uppercase tracking-[0.4em]">{rit('pending_empty', 'No Pending Transmissions')}</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 gap-4">
                    {incomingRequests.map(req => (
                      <div key={req.id} className="bg-[#161719] border border-white/5 p-6 rounded-[28px] flex items-center justify-between shadow-xl animate-in fade-in">
                         <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-full bg-tertiary flex items-center justify-center text-xl font-black text-white/10 border border-white/10">{(req.fromName || '?')[0]}</div>
                            <div>
                               <h4 className="text-lg font-bold text-white leading-none mb-1">{req.fromName}</h4>
                               <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-40">@{req.fromUsername || 'explorer'}</p>
                            </div>
                         </div>
                         <div className="flex gap-3">
                            <button onClick={() => onDecline(req.id)} className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-red-500 hover:text-white text-red-500/80 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">{rit('pending_decline', 'Reject')}</button>
                            <button onClick={() => onAccept(req.id)} className="px-8 py-2.5 rounded-xl bg-accent text-black font-black text-[10px] uppercase tracking-widest transition-all hover:brightness-110 shadow-lg shadow-accent/20 active:scale-95">{rit('pending_accept', 'Authorize')}</button>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
             </div>
          )}

          {activeTab === 'reports' && isAdmin && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
               <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-white">{rit('reports_title', 'Signal Anomalies')}</h2>
                    <p className="text-sm text-neutral-500 font-medium mt-1">{rit('reports_desc', 'Realm violations requiring manual oversight.')}</p>
                  </div>
                  <button onClick={onCleanUpReports} className="px-6 py-2.5 rounded-xl bg-white/5 text-muted hover:text-white font-black text-[10px] uppercase tracking-widest transition-all border border-white/10">{rit('reports_cleanup', 'Clean Records')}</button>
               </div>

               {pendingReports.length === 0 ? (
                 <div className="py-24 flex flex-col items-center justify-center opacity-30 text-center bg-black/20 border-2 border-dashed border-white/5 rounded-[40px]">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">🛡️</div>
                    <p className="text-sm font-black uppercase tracking-[0.4em]">{rit('reports_empty', 'No Anomalies Detected')}</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 gap-6">
                    {pendingReports.map(r => (
                      <div key={r.id} className="bg-[#161719] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in">
                         <div className="p-8 border-b border-white/5 flex items-start justify-between">
                            <div className="flex items-center gap-6">
                               <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-tertiary">
                                  {r.realmAvatarUrl ? <img src={r.realmAvatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/10">?</div>}
                               </div>
                               <div>
                                  <h4 className="text-xl font-bold text-white uppercase tracking-tight">{r.realmName}</h4>
                                  <p className="text-[10px] text-muted font-mono mt-1 opacity-40">NODE_ID: {r.realmId}</p>
                               </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${r.aiClassification === 'INAPPROPRIATE' ? 'bg-red-500/20 text-red-400 border-red-500/20' : 'bg-amber-500/20 text-amber-400 border-amber-500/20'}`}>
                               AI ANALYSIS: {r.aiClassification}
                            </div>
                         </div>
                         <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/20">
                            <div>
                               <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-3 block opacity-50">{rit('reports_claim_label', 'Explorer Claim')}</label>
                               <div className="bg-tertiary/40 p-4 rounded-2xl border border-white/5">
                                  <p className="text-sm text-white/90 font-medium leading-relaxed">{r.reason}</p>
                                  <p className="text-[10px] text-muted mt-3 font-bold uppercase tracking-widest opacity-40">BY {r.reporterName}</p>
                               </div>
                            </div>
                            <div>
                               <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-3 block opacity-50">{rit('reports_ai_label', 'Neural Assessment')}</label>
                               <div className="bg-tertiary/40 p-4 rounded-2xl border border-white/5">
                                  <p className="text-sm text-white/90 font-medium leading-relaxed italic">{r.aiAnalysis}</p>
                               </div>
                            </div>
                         </div>
                         <div className="p-6 bg-black/40 border-t border-white/5 flex gap-4 justify-end">
                            <button onClick={() => onResolveReport(r.id)} className="px-6 py-3 rounded-xl bg-white/5 text-muted hover:text-white font-black text-[10px] uppercase tracking-widest transition-all">{rit('reports_dismiss', 'Dismiss')}</button>
                            <button onClick={() => onBanRealm(r.realmId, r.id)} className="px-8 py-3 rounded-xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-lg shadow-red-500/20 transition-all">{rit('reports_ban', 'Purge Community')}</button>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'quests' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
               <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="text-center sm:text-left">
                    <h2 className="text-3xl font-bold text-white">{rit('friends_objective_grid', 'Objective Grid')}</h2>
                    <p className="text-sm text-neutral-500 font-medium mt-1">{rit('friends_objective_desc', 'Complete objectives to earn shards')}</p>
                  </div>
                  {isAdmin && (
                    <button onClick={handleForgeAIQuests} disabled={isForging} className="px-6 py-2.5 rounded-2xl bg-purple-500 text-white font-bold text-xs uppercase hover:scale-105 transition-all shadow-xl shadow-purple-500/20 flex items-center gap-2">
                      {isForging ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : rit('friends_forge_ai', 'Forge AI Tasks ✨')}
                    </button>
                  )}
               </div>

               <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row items-center justify-between px-2 gap-4">
                     <h3 className="text-sm font-bold text-amber-500 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />{rit('friends_active_cycle', 'Active Cycle')}</h3>
                     <div className="bg-black/40 px-5 py-2 rounded-xl border border-white/5 flex items-center gap-3 shadow-inner">
                        <span className="text-xs font-medium text-neutral-500">{rit('friends_reset_label', 'Pipeline Resets In:')}</span>
                        <span className="text-sm font-bold text-accent font-mono tracking-wider">{timeToReset}</span>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">{dailyQuests.map(q => renderQuestCard(q))}</div>
                  
                  {oldQuests.length > 0 && (
                    <div className="space-y-4 pt-12">
                      <h3 className="text-xs font-black text-muted uppercase tracking-[0.4em] px-2 opacity-50">{rit('friends_old_header_v3', 'Legacy Protocol Log')}</h3>
                      <div className="grid grid-cols-1 gap-4">{oldQuests.map(q => renderQuestCard(q))}</div>
                    </div>
                  )}
               </div>
            </div>
          )}
          {activeTab === 'all' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button onClick={onOpenCreateGroup} className="flex items-center gap-4 p-5 bg-[#161719] hover:bg-white/[0.03] border border-white/5 rounded-[24px] transition-all group active:scale-[0.98] shadow-lg">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-2xl group-hover:scale-110 transition-transform shadow-inner shrink-0">+</div>
                    <div className="text-left min-w-0">
                      <h4 className="text-sm font-bold text-white leading-tight group-hover:text-accent transition-colors truncate">{rit('friends_group_title', 'Assemble Squad')}</h4>
                      <p className="text-[10px] text-neutral-500 font-medium opacity-60 truncate">{rit('friends_group_sub', 'Group Chat')}</p>
                    </div>
                  </button>
                  <button onClick={() => onSetTab('quests')} className="flex items-center gap-4 p-5 bg-[#161719] hover:bg-white/[0.03] border border-white/5 rounded-[24px] transition-all group active:scale-[0.98] shadow-lg">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 text-xl group-hover:scale-110 transition-transform shadow-inner shrink-0">✨</div>
                    <div className="text-left min-w-0">
                      <h4 className="text-sm font-bold text-white leading-tight group-hover:text-accent transition-colors truncate">{rit('friends_obj_title', 'Objectives')}</h4>
                      <p className="text-[10px] text-neutral-500 font-medium opacity-60 truncate">{rit('friends_obj_sub', 'Earn Rewards')}</p>
                    </div>
                  </button>
                  <button onClick={onOpenShop} className="flex items-center gap-4 p-5 bg-[#161719] hover:bg-white/[0.03] border border-white/5 rounded-[24px] transition-all group active:scale-98 shadow-lg">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shadow-inner shrink-0"><Icons.Shop /></div>
                    <div className="text-left min-w-0">
                      <h4 className="text-sm font-bold text-white leading-tight group-hover:text-accent transition-colors truncate">{rit('friends_shop_title', 'The Nebula')}</h4>
                      <p className="text-[10px] text-neutral-500 font-medium opacity-60 truncate">{rit('friends_shop_sub', 'Marketplace')}</p>
                    </div>
                  </button>
                  <button onClick={onOpenSettings} className="flex items-center gap-4 p-5 bg-[#161719] hover:bg-white/[0.03] border border-white/5 rounded-[24px] transition-all group active:scale-98 shadow-lg">
                    <div className="w-12 h-12 rounded-2xl bg-slate-500/10 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform shadow-inner shrink-0"><Icons.Settings /></div>
                    <div className="text-left min-w-0">
                      <h4 className="text-sm font-bold text-white leading-tight group-hover:text-accent transition-colors truncate">{rit('friends_identity_title', 'Hub')}</h4>
                      <p className="text-[10px] text-neutral-500 font-medium opacity-60 truncate">{rit('friends_identity_sub', 'Identity')}</p>
                    </div>
                  </button>
               </div>
               {currentUser && (
                 <div className="bg-[#161719] border border-white/5 rounded-[32px] p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8 sm:gap-12 relative overflow-hidden shadow-2xl">
                    <div onClick={() => onViewProfile(currentUser)} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-tertiary border-4 border-white/10 overflow-hidden shrink-0 shadow-2xl cursor-pointer hover:scale-105 transition-all">
                      {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/10">{(currentUser.displayName || '?')[0]}</div>}
                    </div>
                    <div className="flex-1 text-center sm:text-left min-w-0 w-full">
                       <h3 className="text-4xl font-bold text-white truncate">{currentUser.displayName}</h3>
                       <p className="text-neutral-500 font-medium text-lg mt-1 opacity-80 truncate">@{currentUser.username}</p>
                    </div>
                 </div>
               )}
            </div>
          )}
          {activeTab === 'editor' && isAdmin && (
            <div className="space-y-16 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
               {isBeanie && (
                 <div className="bg-[#161719] border border-white/5 rounded-[32px] p-8 sm:p-12 space-y-12 animate-in slide-in-from-top-4 shadow-2xl">
                    <div className="flex justify-between items-start"><div><h3 className="text-2xl font-bold text-white">{rit('editor_forge_title', 'Forge Objective')}</h3><p className="text-sm text-neutral-500 font-medium mt-1">{rit('editor_forge_desc', 'Create manual objectives for the community')}</p></div><div className="flex gap-3"><button onClick={() => quests.forEach(q => onDeleteQuest?.(q.id))} className="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-500 font-bold text-xs hover:bg-red-500 hover:text-white transition-all border border-red-500/20 uppercase">{rit('editor_purge', 'Purge All')}</button><button onClick={handleForgeAIQuests} disabled={isForging} className="px-6 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-xs uppercase hover:scale-105 transition-all shadow-xl shadow-purple-500/30 flex items-center gap-3 border border-purple-400/20">{isForging ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : rit('editor_neural', 'Neural Forge ✨')}</button></div></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8"><div className="space-y-6"><div><label className="text-xs font-bold text-neutral-500 mb-2 block opacity-80 ml-1">{rit('editor_label_title', 'Objective Title')}</label><input type="text" value={qTitle} onChange={e => setQTitle(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent shadow-inner" placeholder="e.g. Interstellar Courier" /></div><div><label className="text-xs font-bold text-neutral-500 mb-2 block opacity-80 ml-1">{rit('editor_label_brief', 'Objective Briefing')}</label><textarea value={qDesc} onChange={e => setQDesc(e.target.value)} rows={3} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-medium text-white outline-none focus:ring-1 focus:ring-accent resize-none shadow-inner" placeholder="What must the explorer achieve?" /></div></div><div className="space-y-6"><div><label className="text-xs font-bold text-neutral-500 mb-2 block opacity-80 ml-1">{rit('editor_label_type', 'Objective Type')}</label><select value={qType} onChange={e => setQType(e.target.value as QuestType)} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent appearance-none shadow-inner">{QUEST_TYPE_CONFIG.map(q => <option key={q.type} value={q.type}>{q.label}</option>)}</select></div><div className="grid grid-cols-2 gap-6"><div><label className="text-xs font-bold text-neutral-500 mb-2 block opacity-80 ml-1">{rit('editor_label_units', 'Target Units')}</label><input type="number" value={qTarget} onChange={e => setQTarget(parseInt(e.target.value) || 0)} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent shadow-inner" /></div><div><label className="text-xs font-bold text-neutral-500 mb-2 block opacity-80 ml-1">{rit('editor_label_reward', 'Reward Shards')}</label><input type="number" value={qReward} onChange={e => setQReward(parseInt(e.target.value) || 0)} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent shadow-inner" /></div></div></div></div>
                    <button onClick={() => { onCreateQuest?.({ title: qTitle, description: qDesc, type: qType, targetValue: qTarget, rewardShards: qReward, isDaily: false, isQueued: false }); setQTitle(''); setQDesc(''); }} disabled={!qTitle.trim()} className="w-full bg-accent text-black font-bold py-4 rounded-xl uppercase text-xs shadow-2xl shadow-accent/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-20">{rit('editor_broadcast', 'Broadcast Objective +')}</button>
                 </div>
               )}
               
               <div className="bg-[#161719] border border-white/5 rounded-[32px] p-8 sm:p-12 space-y-10 shadow-2xl">
                 <div className="space-y-2 text-center sm:text-left">
                   <h3 className="text-2xl font-bold text-white">{rit('editor_economic_title', 'Economic Protocols')}</h3>
                   <p className="text-sm text-neutral-500 font-medium">{rit('editor_economic_desc', 'Configure profit distribution for the Resell Hub')}</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-neutral-500 ml-1 opacity-80">{rit('editor_econ_seller', 'Seller Profit %')}</label>
                       <input type="number" min="0" max="100" value={sellerProfitPctInput} onChange={e => setSellerProfitPctInput(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent shadow-inner" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-neutral-500 ml-1 opacity-80">{rit('editor_econ_creator', 'Creator Royalty %')}</label>
                       <input type="number" min="0" max="100" value={creatorProfitPctInput} onChange={e => setCreatorProfitPctInput(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent shadow-inner" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-neutral-500 ml-1 opacity-80">{rit('editor_econ_nebula', 'Nebula Node %')}</label>
                       <input type="number" min="0" max="100" value={nebulaProfitPctInput} onChange={e => setNebulaProfitPctInput(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent shadow-inner" />
                    </div>
                 </div>
                 <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Total Distribution Check:</span>
                    <span className={`text-sm font-black ${(sellerProfitPctInput + creatorProfitPctInput + nebulaProfitPctInput) === 100 ? 'text-green-400' : 'text-red-400'}`}>
                       {sellerProfitPctInput + creatorProfitPctInput + nebulaProfitPctInput}%
                    </span>
                 </div>
                 <button onClick={handleSaveEconomicProtocols} className="w-full bg-white text-black font-bold h-14 rounded-xl text-xs uppercase hover:bg-accent transition-all active:scale-95 shadow-xl">{rit('editor_econ_update', 'Update Economic Protocols')}</button>
               </div>

               <div className="bg-[#161719] border border-white/5 rounded-[32px] p-8 sm:p-12 space-y-10 shadow-2xl"><div className="space-y-2 text-center sm:text-left"><h3 className="text-2xl font-bold text-white">{rit('editor_params_title', 'System Parameters')}</h3><p className="text-sm text-neutral-500 font-medium">{rit('editor_params_desc', 'Manage temporal and economic variables')}</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"><div className="space-y-2"><label className="text-xs font-bold text-neutral-500 ml-1 opacity-80">{rit('editor_params_reset', 'Reset Hour (PST)')}</label><input type="number" min="0" max="23" value={resetHourPSTInput} onChange={e => setResetHourPSTInput(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent shadow-inner" /></div><div className="space-y-2"><label className="text-xs font-bold text-neutral-500 ml-1 opacity-80">{rit('editor_params_minute', 'Reset Minute')}</label><input type="number" min="0" max="59" value={resetMinutePSTInput} onChange={e => setResetMinutePSTInput(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent shadow-inner" /></div><div className="space-y-2"><label className="text-xs font-bold text-neutral-500 ml-1 opacity-80">{rit('editor_params_min', 'Min Bounty')}</label><input type="number" value={minRewardInput} onChange={e => setMinRewardInput(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent shadow-inner" /></div><div className="space-y-2"><label className="text-xs font-bold text-neutral-500 ml-1 opacity-80">{rit('editor_params_max', 'Max Bounty')}</label><input type="number" value={maxRewardInput} onChange={e => setMaxRewardInput(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent shadow-inner" /></div><div className="space-y-2"><label className="text-xs font-bold text-neutral-500 ml-1 opacity-80">{rit('editor_params_limit', 'Shop Limit')}</label><input type="number" min="1" value={shopShuffleLimitInput} onChange={e => setShopShuffleLimitInput(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent shadow-inner" /></div></div><button onClick={handleSaveNexusParameters} className="w-full bg-white text-black font-bold h-14 rounded-xl text-xs uppercase hover:bg-accent transition-all active:scale-95 shadow-xl">{rit('editor_params_update', 'Update System Parameters')}</button></div>
               <div className="bg-[#161719] border border-white/5 rounded-[32px] p-8 sm:p-12 space-y-8 shadow-2xl"><div className="space-y-1"><h3 className="text-2xl font-bold text-white">{rit('editor_node_title', 'Dividends Node')}</h3><p className="text-sm text-neutral-500 font-medium">{rit('editor_node_desc', 'Designate the user for transaction dividends')}</p></div><div className="flex flex-col sm:flex-row gap-4"><div className="flex-1 relative group"><input type="text" value={earningsUsernameInput} onChange={e => setEarningsUsernameInput(e.target.value)} placeholder="dividends_node" className="w-full h-14 bg-black/40 border border-white/5 rounded-xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent transition-all pl-12 shadow-inner" /><div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500 font-bold opacity-40 group-focus-within:text-accent group-focus-within:opacity-100 transition-all">@</div></div><button onClick={() => onUpdateUIOverride?.('earningsUsername', earningsUsernameInput.trim())} className="px-12 h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold uppercase text-white transition-all active:scale-95 shadow-lg">{rit('editor_node_update', 'Update Node')}</button></div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
