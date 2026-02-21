import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, Friend, User, Realm, RuleItem } from '../types';
import { Icons } from '../constants';
import { TopBar } from './TopBar';
import { SyncStatus } from '../App';

interface ChatAreaProps {
  context: { type: 'dm'; friend: Friend | null } | { type: 'realm'; realm: Realm | null; chatId: string | null };
  messages: Message[];
  onSendMessage: (text: string, options?: any) => void;
  currentUser: User | null;
  onToggleSidebar: () => void;
  onToggleRightSidebar: () => void;
  isMobile: boolean;
  isAdmin?: boolean;
  pendingCount: number;
  view: any;
  allRealms: Realm[];
  onJoinViaInvite: (code: string, metadata?: any) => { success: boolean, message: string } | Promise<{ success: boolean, message: string }>;
  syncStatus?: SyncStatus;
  onViewProfile: (user: { id: string }) => void;
  customLogoUrl?: string;
  users: User[];
  onStartCall?: (userId: string, isVideo: boolean) => void;
  onLeaveGroup?: (groupId: string) => void;
  onUpdateChatRules?: (realmId: string, chatId: string, rules: RuleItem[]) => void;
  onOpenSuspendModal?: (targetUser: User, realmId: string) => void;
  systemConfig?: any;
  renderInteractiveText?: (id: string, defaultText: string, className?: string) => React.ReactNode;
  friends: Friend[];
}

const FIVE_MINUTES = 5 * 60 * 1000;

export const ChatArea: React.FC<ChatAreaProps> = ({ 
  context, messages, onSendMessage, currentUser, 
  onToggleSidebar, onToggleRightSidebar, isMobile, isAdmin: isGlobalAdmin,
  pendingCount, view, syncStatus, onViewProfile, customLogoUrl, onJoinViaInvite, users, onStartCall, onLeaveGroup, onUpdateChatRules,
  onOpenSuspendModal, 
  systemConfig = {} as any,
  renderInteractiveText,
  friends
}) => {
  const [inputValue, setInputValue] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleContent, setNewRuleContent] = useState('');
  const [newRuleSuspension, setNewRuleSuspension] = useState(0);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, targetUser: User } | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const rit = renderInteractiveText || ((id, def) => def);

  const activeChat = useMemo(() => {
    if (context.type !== 'realm' || !context.realm || !context.chatId) return null;
    return context.realm.sections.flatMap(s => s.chats).find(c => c.id === context.chatId);
  }, [context]);

  const isRulesType = activeChat?.type === 'rules';
  
  const suspensionEndTimestamp = useMemo(() => {
    if (context.type === 'realm' && context.realm && currentUser?.realmSuspensions?.[view.realmId]) {
      return currentUser.realmSuspensions[view.realmId];
    }
    return 0;
  }, [currentUser, context, view.realmId]);

  const isSuspended = useMemo(() => {
    return suspensionEndTimestamp > Date.now();
  }, [suspensionEndTimestamp]);

  const suspensionReason = useMemo(() => {
    if (context.type === 'realm' && context.realm && currentUser?.realmSuspensionReasons?.[view.realmId]) {
      return currentUser.realmSuspensionReasons[view.realmId];
    }
    return '';
  }, [currentUser, context, view.realmId]);

  const realmRoles = context.type === 'realm' && context.realm?.roles ? context.realm.roles : [];
  const userRoles = context.type === 'realm' && context.realm ? realmRoles.filter(r => r.memberIds?.includes(currentUser?.id || '')) : [];
  const isRealmAdmin = isGlobalAdmin || (context.type === 'realm' && context.realm?.ownerId === currentUser?.id) || userRoles.some(r => r.permissions?.includes('ADMINISTRATOR'));

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeChat?.rules]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Timer Effect for Suspension Countdown
  useEffect(() => {
    if (!isSuspended) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = suspensionEndTimestamp - now;
      
      if (diff <= 0) {
        setTimeLeft('');
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (h > 0) parts.push(h.toString().padStart(2, '0'));
      parts.push(m.toString().padStart(2, '0'));
      parts.push(s.toString().padStart(2, '0'));
      
      setTimeLeft(parts.join(':'));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isSuspended, suspensionEndTimestamp]);

  const handleSendMessageSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if(inputValue.trim() && !isSuspended) { 
      onSendMessage(inputValue.trim()); 
      setInputValue(''); 
    }
  };

  const handleJoin = async (code: string) => {
    setJoiningId(code);
    try {
        await onJoinViaInvite(code);
    } finally {
        setJoiningId(null);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleAddRule = () => {
    if (context.type !== 'realm' || !context.realm || !newRuleTitle.trim() || !newRuleContent.trim() || !activeChat) return;
    const currentRules = activeChat.rules || [];
    const updatedRules = editingRuleId 
      ? currentRules.map(r => r.id === editingRuleId ? { ...r, title: newRuleTitle, content: newRuleContent, suspensionMinutes: newRuleSuspension } : r)
      : [...currentRules, { id: 'rule_' + Date.now(), title: newRuleTitle, content: newRuleContent, suspensionMinutes: newRuleSuspension }];
    
    onUpdateChatRules?.(context.realm.id, activeChat.id, updatedRules);
    setNewRuleTitle('');
    setNewRuleContent('');
    setNewRuleSuspension(0);
    setIsAddingRule(false);
    setEditingRuleId(null);
  };

  const handleReorderRule = (index: number, direction: 'up' | 'down') => {
    if (context.type !== 'realm' || !context.realm || !activeChat) return;
    const rules = [...(activeChat.rules || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= rules.length) return;
    const [moved] = rules.splice(index, 1);
    rules.splice(newIndex, 0, moved);
    onUpdateChatRules?.(context.realm.id, activeChat.id, rules);
  };

  const handleAvatarContextMenu = (e: React.MouseEvent, targetUser: User) => {
    if (!isRealmAdmin || targetUser.id === currentUser?.id || context.type !== 'realm') return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, targetUser });
  };

  const renderedMessages = useMemo(() => {
    return messages.map((msg, idx) => {
      const sender = users.find(u => u.id === msg.authorId);
      const authorName = sender?.displayName || 'Explorer';
      const authorAvatar = sender?.avatarUrl;

      const prevMsg = idx > 0 ? messages[idx - 1] : null;
      const isCall = !!msg.callData;
      const isGrouped = !isCall && prevMsg && 
                        !prevMsg.callData &&
                        prevMsg.authorId === msg.authorId && 
                        (msg.timestamp - prevMsg.timestamp) < FIVE_MINUTES &&
                        !msg.inviteRealmId;
      
      if (isCall) {
        const d = msg.callData!;
        return (
          <div key={msg.id} className="flex justify-center my-4 sm:my-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4 shadow-inner group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${d.status === 'missed' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                {d.type === 'video' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] sm:text-[11px] font-black text-white/90 uppercase tracking-widest leading-none mb-1 truncate">
                  {d.status === 'missed' ? rit('chat_call_missed', 'Missed Frequency') : rit('chat_call_signal', `${d.type === 'video' ? 'Video' : 'Voice'} Signal`)}
                </span>
                <div className="flex items-center gap-2">
                   <span className="text-[8px] sm:text-[9px] font-bold text-muted uppercase opacity-60">
                     {d.status === 'ended' && d.duration ? `${rit('chat_call_duration', 'Lasted')} ${formatDuration(d.duration)}` : d.status === 'missed' ? rit('chat_call_no_conn', 'No connection') : rit('chat_call_started', 'Signal started')}
                   </span>
                   <span className="text-[8px] sm:text-[9px] font-black text-muted opacity-20 uppercase">•</span>
                   <span className="text-[8px] sm:text-[9px] font-bold text-muted opacity-40 uppercase">
                     {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div key={msg.id} className={`group flex items-start gap-3 sm:gap-4 ${isGrouped ? 'mt-[-12px] sm:mt-[-16px]' : 'mt-4'}`}>
          {!isGrouped ? (
             <div 
              onClick={() => onViewProfile({ id: msg.authorId })} 
              onContextMenu={(e) => sender && handleAvatarContextMenu(e, sender)}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-secondary flex-shrink-0 cursor-pointer overflow-hidden border border-white/5 transition-transform active:scale-90 hover:scale-105 shadow-sm"
             >
               {authorAvatar ? <img src={authorAvatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-[9px] sm:text-[10px] text-white/10 uppercase">{authorName[0]}</div>}
             </div>
          ) : (
            <div className="w-8 sm:w-10 flex-shrink-0 flex justify-center opacity-0 group-hover:opacity-40 transition-opacity pt-1">
               <span className="text-[8px] sm:text-[9px] font-bold text-muted uppercase">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {!isGrouped && (
               <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] sm:text-[12px] font-black text-white uppercase tracking-tight hover:underline cursor-pointer truncate" onClick={() => onViewProfile({ id: msg.authorId })}>{authorName}</span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-muted opacity-30 uppercase whitespace-nowrap">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
            )}
            
            <div className="flex flex-col gap-2">
               <div className={`text-[13px] sm:text-[14px] leading-relaxed break-words font-medium inline-block px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-white/5 shadow-sm max-w-[95%] sm:max-w-[85%] ${isGrouped ? 'bg-white/[0.01]' : 'bg-white/[0.02] rounded-tl-none'}`}>
                  {msg.content}
               </div>

               {msg.inviteRealmId && (
                 <div className="mt-2 bg-[#161719] border border-white/10 rounded-[32px] p-5 sm:p-7 max-w-[340px] shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-500 ring-1 ring-white/5">
                    <div className="flex items-center gap-5 mb-6">
                       <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[24px] bg-tertiary flex items-center justify-center border border-white/10 overflow-hidden shadow-2xl shrink-0 group-hover:rotate-3 transition-transform">
                          {msg.inviteRealmData?.avatarUrl ? <img src={msg.inviteRealmData.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-lg font-black text-white/20">{msg.inviteRealmData?.initials || 'R'}</span>}
                       </div>
                       <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                             <h4 className="text-[9px] sm:text-[10px] font-black text-accent uppercase tracking-[0.2em] opacity-80">{rit('chat_invite_header', 'Frequency Invite')}</h4>
                             <div className="w-1 h-1 rounded-full bg-accent/40" />
                          </div>
                          <p className="text-sm sm:text-base font-black text-white uppercase tracking-tight truncate">{msg.inviteRealmData?.name || 'Realm'}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => msg.inviteRealmId && handleJoin(msg.inviteRealmId)}
                      disabled={joiningId === msg.inviteRealmId}
                      className="w-full bg-accent text-black font-black py-3.5 sm:py-4 rounded-2xl text-[10px] sm:text-[11px] uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-accent/20 disabled:opacity-50 ring-4 ring-accent/5"
                    >
                      {joiningId === msg.inviteRealmId ? rit('chat_invite_syncing', 'Establishing Link...') : rit('chat_invite_sync', 'Synchronize Frequency')}
                    </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      );
    });
  }, [messages, onViewProfile, handleJoin, joiningId, users, isRealmAdmin, currentUser, rit]);

  return (
    <div className="flex-1 flex flex-col bg-chat relative overflow-hidden h-full">
      <TopBar 
        view={view} 
        activeFriend={context.type === 'dm' ? context.friend : null} 
        activeRealm={context.type === 'realm' ? context.realm : null} 
        onToggleSidebar={onToggleSidebar} 
        onToggleRightSidebar={onToggleRightSidebar} 
        isMobile={isMobile} 
        isAdmin={isGlobalAdmin} 
        pendingCount={pendingCount} 
        syncStatus={syncStatus} 
        onStartCall={onStartCall} 
        onLeaveGroup={onLeaveGroup} 
        renderInteractiveText={renderInteractiveText}
        currentUser={currentUser}
        friends={friends}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6 space-y-3 sm:space-y-4 no-scrollbar">
        {isRulesType ? (
          <div className="max-w-3xl mx-auto space-y-12 py-10 animate-in fade-in slide-in-from-bottom-4">
             <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-accent/10 rounded-[32px] flex items-center justify-center text-accent mx-auto border border-accent/20 shadow-xl mb-6">
                   <Icons.Scroll />
                </div>
                <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tighter">{rit('chat_rules_title', 'Realm Guidelines')}</h1>
                <p className="text-neutral-500 font-bold uppercase tracking-widest opacity-60 text-sm">{rit('chat_rules_sub', 'Protocol guidelines for community conduct')}</p>
             </div>
             <div className="space-y-6">
                {(activeChat?.rules || []).map((rule, idx) => (
                   <div key={rule.id} className="bg-white/5 border border-white/5 rounded-[40px] p-8 sm:p-10 shadow-2xl relative group/rule transition-all hover:bg-white/[0.08] hover:border-white/10">
                      <div className="flex justify-between items-start gap-6">
                         <div className="flex gap-6 sm:gap-8 items-center flex-1">
                            <div className="w-16 sm:w-20 flex justify-center items-center shrink-0">
                               <span className="text-4xl sm:text-5xl font-black text-white/10 uppercase select-none italic">{idx + 1}</span>
                            </div>
                            <div className="min-w-0 pt-2 flex-1">
                               <div className="flex items-center gap-3 mb-4">
                                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">{rule.title}</h3>
                                  {rule.suspensionMinutes ? (
                                    <span className="px-2 py-0.5 rounded-lg bg-red-500/10 text-red-400 text-[8px] font-black uppercase tracking-widest border border-red-500/20">
                                      {rit('chat_rule_penalty', 'Penalty:')} {rule.suspensionMinutes}m
                                    </span>
                                  ) : null}
                               </div>
                               <p className="text-base sm:text-lg text-neutral-400 font-medium leading-relaxed">{rule.content}</p>
                            </div>
                         </div>
                         {isRealmAdmin && (
                           <div className="flex flex-col sm:flex-row gap-2 opacity-0 group-hover/rule:opacity-100 transition-opacity">
                              <div className="flex flex-col gap-1">
                                <button onClick={() => handleReorderRule(idx, 'up')} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"><Icons.ArrowUp /></button>
                                <button onClick={() => handleReorderRule(idx, 'down')} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"><Icons.ArrowDown /></button>
                              </div>
                              <button onClick={() => { setIsAddingRule(true); setEditingRuleId(rule.id); setNewRuleTitle(rule.title); setNewRuleContent(rule.content); setNewRuleSuspension(rule.suspensionMinutes || 0); }} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"><Icons.Settings /></button>
                              <button onClick={() => {
                                if (context.type === 'realm' && context.realm) {
                                  onUpdateChatRules?.(context.realm.id, activeChat!.id, activeChat!.rules!.filter(r => r.id !== rule.id));
                                }
                              }} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl transition-all">✕</button>
                           </div>
                         )}
                      </div>
                   </div>
                ))}
                {isRealmAdmin && !isAddingRule && (
                   <button onClick={() => setIsAddingRule(true)} className="w-full py-8 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center gap-3 text-muted hover:text-accent hover:border-accent/40 transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center"><Icons.Plus /></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">{rit('chat_rule_add', 'Designate New Guideline')}</span>
                   </button>
                )}
                {isAddingRule && (
                   <div className="bg-white/5 border border-accent/20 rounded-[40px] p-8 sm:p-10 shadow-2xl animate-in slide-in-from-top-4">
                      <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mb-8">{rit('chat_rule_new_header', 'New Guideline Protocol')}</h4>
                      <div className="space-y-6">
                         <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="sm:col-span-3">
                               <input type="text" value={newRuleTitle} onChange={e => setNewRuleTitle(e.target.value)} placeholder="Title" className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white outline-none focus:ring-1 focus:ring-accent" />
                            </div>
                            <div className="sm:col-span-1">
                               <input type="number" value={newRuleSuspension} onChange={e => setNewRuleSuspension(parseInt(e.target.value) || 0)} placeholder="Min" className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-accent outline-none focus:ring-1 focus:ring-accent text-center" />
                            </div>
                         </div>
                         <textarea value={newRuleContent} onChange={e => setNewRuleContent(e.target.value)} placeholder="Description" rows={4} className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white outline-none focus:ring-1 focus:ring-accent resize-none" />
                         <div className="flex gap-4">
                            <button onClick={() => { setIsAddingRule(false); setEditingRuleId(null); }} className="flex-1 py-4 bg-white/5 text-muted hover:text-white rounded-2xl font-black uppercase text-[10px]">{rit('chat_rule_cancel', 'Cancel')}</button>
                            <button onClick={handleAddRule} className="flex-[2] py-4 bg-accent text-black rounded-2xl font-black uppercase text-[10px]">{rit('chat_rule_finish', 'Finalize')}</button>
                         </div>
                      </div>
                   </div>
                )}
             </div>
          </div>
        ) : renderedMessages}
        
        {messages.length === 0 && !isRulesType && (
          <div className="h-full flex items-center justify-center flex-col opacity-20 py-20">
             <div className="w-12 h-12 sm:w-16 sm:h-16 mb-4 text-accent"><Icons.Portal /></div>
             <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">{rit('chat_no_messages', 'No Messages')}</p>
          </div>
        )}
      </div>

      {!isRulesType && (
        <div className="p-3 sm:p-6 bg-black/40 backdrop-blur-xl border-t border-white/5 relative z-30 pb-safe">
          {isSuspended ? (
            <div className="max-w-4xl mx-auto bg-red-500/10 border border-red-500/30 rounded-3xl p-6 sm:p-8 text-center animate-in slide-in-from-bottom-2 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1 bg-red-500/40" />
               <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3">
                     <div className="w.1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                     <p className="text-[11px] sm:text-xs font-black text-red-500 uppercase tracking-[0.3em]">
                       {rit('chat_suspended_label', 'Isolation Protocol Active')}
                     </p>
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight max-w-lg">
                    {suspensionReason || rit('chat_suspended_default_reason', 'General community protocol violation')}
                  </h4>
                  <div className="mt-4 flex flex-col items-center gap-1.5">
                     <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest opacity-60">{rit('chat_suspended_timer', 'Transmission restoration in')}</p>
                     <p className="text-2xl sm:text-3xl font-black text-white tracking-[0.2em] font-mono drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                        {timeLeft || '00:00'}
                     </p>
                  </div>
               </div>
            </div>
          ) : (
            <form onSubmit={handleSendMessageSubmit} className="max-w-4xl mx-auto flex gap-2 sm:gap-3">
              <div className="flex-1 relative flex items-center bg-white/5 border border-white/5 rounded-2xl focus-within:ring-2 focus-within:ring-accent/50 transition-all shadow-inner px-3 sm:px-5 py-0.5">
                <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={systemConfig.textOverrides?.['chat_input_placeholder'] || rit('chat_placeholder', "Type a message...") as string} className="flex-1 bg-transparent border-none py-3 sm:py-3.5 text-white outline-none font-bold text-xs sm:text-sm" />
              </div>
              <button type="submit" className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-accent text-black rounded-2xl shadow-xl shadow-accent/20 hover:brightness-110 active:scale-95 transition-all flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[20px] sm:h-[20px]"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </form>
          )}
        </div>
      )}

      {contextMenu && (
        <div 
          className="fixed z-[9000] bg-[#161719] border border-white/10 rounded-2xl shadow-2xl p-1.5 min-w-[160px] animate-in zoom-in-95 duration-150 backdrop-blur-xl"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => { 
              if (context.type === 'realm' && context.realm) {
                onOpenSuspendModal?.(contextMenu.targetUser, context.realm.id); 
              }
              setContextMenu(null); 
            }}
            className="w-full text-left px-4 py-3 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center justify-between group"
          >
            <span>{rit('chat_context_suspend', 'Suspend')}</span>
            <span className="opacity-40 group-hover:opacity-100">⚖️</span>
          </button>
        </div>
      )}
    </div>
  );
};