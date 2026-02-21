
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Realm, Role, OnboardingQuestion } from '../types';
import { Icons } from '../constants';
import { GoogleGenAI } from "@google/genai";

interface RealmSettingsProps {
  user: User;
  realm: Realm;
  onUpdateRealm: (rid: string, updates: Partial<Realm>) => void;
  onClose: () => void;
}

type TabId = 'general' | 'roles' | 'verify' | 'leveling' | 'questions' | 'automod' | 'notifications';

const PERMISSIONS = [
  { id: 'SEND_MESSAGES', label: 'Send Messages', desc: 'Allows members to send text messages.' },
  { id: 'MENTION_USERS', label: 'Mention Users', desc: 'Allows members to mention specific users.' },
  { id: 'MENTION_EVERYONE', label: 'Mention @everyone', desc: 'Allows members to notify everyone in the realm.' },
  { id: 'ADMINISTRATOR', label: 'Administrator', desc: 'Full control over the realm and all its settings.' },
];

const AUTOMOD_LEVELS = [
  { id: 'None', label: 'Disabled', desc: 'AI moderation is inactive. Manual oversight required.' },
  { id: 'Low', label: 'Low Frequency', desc: 'Guardian is lenient. Only obvious violations trigger a suspension.' },
  { id: 'Moderate', label: 'Standard Sync', desc: 'Guardian actively evaluates linguistic patterns against guidelines.' },
  { id: 'Harsh', label: 'Maximum Guard', desc: 'Zero tolerance. Even subtle guideline breaches result in immediate isolation.' },
] as const;

export const RealmSettings: React.FC<RealmSettingsProps> = ({ 
  user, realm, onUpdateRealm, onClose 
}) => {
  const isOwner = realm.ownerId === user.id;
  const [activeTab, setActiveTab] = useState<TabId>('general');
  
  const [realmName, setRealmName] = useState(realm.name);
  const [realmBio, setRealmBio] = useState(realm.bio || '');
  const [xpPerMsg, setXpPerMsg] = useState(realm.levelingConfig?.xpPerMessage || 10);
  const [baseXpPerLevel, setBaseXpPerLevel] = useState(realm.levelingConfig?.baseXpPerLevel || 100);
  const [bannerColor, setBannerColor] = useState(realm.bannerColor || '#5865f2');
  const [avatarUrl, setAvatarUrl] = useState(realm.avatarUrl || '');
  const [autoModHarshness, setAutoModHarshness] = useState<Realm['autoModConfig']['harshness']>(realm.autoModConfig?.harshness || 'None');
  const [autoModEnabled, setAutoModEnabled] = useState(realm.autoModConfig?.enabled || false);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifError, setVerifError] = useState<string | null>(null);

  const initialRoles = useMemo(() => {
    const r = realm.roles || [];
    if (!r.find(role => role.id === 'everyone')) {
      return [{ id: 'everyone', name: 'Everyone', color: '#ffffff', hoist: false, permissions: ['SEND_MESSAGES'], memberIds: realm.memberIds || [] }, ...r];
    }
    return r;
  }, [realm.roles, realm.memberIds]);

  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [onboarding, setOnboarding] = useState<OnboardingQuestion[]>(realm.onboarding || []);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const editingRole = useMemo(() => roles.find(r => r.id === editingRoleId), [roles, editingRoleId]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const verificationMetrics = useMemo(() => {
    const allChats = realm.sections.flatMap(s => s.chats);
    const textChats = allChats.filter(c => c.type === 'text');
    return {
      chatCount: textChats.length,
      hasAnnouncements: allChats.some(c => c.name.toLowerCase() === 'announcements'),
      hasRules: allChats.some(c => c.name.toLowerCase() === 'rules' || c.type === 'rules'),
    };
  }, [realm]);

  const isEligibleForVerification = 
    verificationMetrics.chatCount >= 5 && 
    verificationMetrics.hasAnnouncements && 
    verificationMetrics.hasRules;

  const handleCreateRole = () => {
    const newRole: Role = {
      id: 'role_' + Math.random().toString(36).substr(2, 9),
      name: 'new role',
      color: '#ffffff',
      hoist: false,
      permissions: ['SEND_MESSAGES'],
      memberIds: []
    };
    setRoles([...roles, newRole]);
    setEditingRoleId(newRole.id);
  };

  const updateEditingRole = (updates: Partial<Role>) => {
    if (!editingRoleId) return;
    setRoles(roles.map(r => r.id === editingRoleId ? { ...r, ...updates } : r));
  };

  const togglePermission = (permId: string) => {
    if (!editingRole) return;
    const hasPerm = editingRole.permissions.includes(permId);
    const nextPerms = hasPerm 
      ? editingRole.permissions.filter(p => p !== permId)
      : [...editingRole.permissions, permId];
    updateEditingRole({ permissions: nextPerms });
  };

  const handleReset = () => {
    setRealmName(realm.name);
    setRealmBio(realm.bio || '');
    setXpPerMsg(realm.levelingConfig?.xpPerMessage || 10);
    setBaseXpPerLevel(realm.levelingConfig?.baseXpPerLevel || 100);
    setBannerColor(realm.bannerColor || '#5865f2');
    setAvatarUrl(realm.avatarUrl || '');
    setRoles(initialRoles);
    setOnboarding(realm.onboarding || []);
    setAutoModHarshness(realm.autoModConfig?.harshness || 'None');
    setAutoModEnabled(realm.autoModConfig?.enabled || false);
  };

  const hasChanges = useMemo(() => {
    return (
      realmName !== realm.name ||
      realmBio !== (realm.bio || '') ||
      xpPerMsg !== (realm.levelingConfig?.xpPerMessage || 10) ||
      baseXpPerLevel !== (realm.levelingConfig?.baseXpPerLevel || 100) ||
      bannerColor !== (realm.bannerColor || '#5865f2') ||
      avatarUrl !== (realm.avatarUrl || '') ||
      autoModHarshness !== (realm.autoModConfig?.harshness || 'None') ||
      autoModEnabled !== (realm.autoModConfig?.enabled || false) ||
      JSON.stringify(roles) !== JSON.stringify(realm.roles || initialRoles) ||
      JSON.stringify(onboarding) !== JSON.stringify(realm.onboarding || [])
    );
  }, [realmName, realmBio, xpPerMsg, baseXpPerLevel, bannerColor, avatarUrl, roles, onboarding, autoModHarshness, autoModEnabled, realm, initialRoles]);

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Evaluate for safety: Community Name: "${realmName}", Bio: "${realmBio}". If safe, return only 'SAFE'. Else return 'REJECTED: [reason]'.`,
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      
      const result = response.text?.trim() || 'REJECTED: AI failed to respond';
      if (result === 'SAFE') {
        onUpdateRealm(realm.id, { isVerified: true, verificationStatus: 'verified' });
        setVerifError(null);
      } else {
        setVerifError(result.replace('REJECTED: ', ''));
      }
    } catch (err) {
      setVerifError('Verification service currently unavailable.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = () => {
    onUpdateRealm(realm.id, { 
      name: realmName, 
      bio: realmBio,
      bannerColor, 
      avatarUrl, 
      roles,
      onboarding,
      autoModConfig: { enabled: autoModEnabled, harshness: autoModHarshness },
      initials: realmName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      levelingConfig: { ...realm.levelingConfig, xpPerMessage: xpPerMsg, baseXpPerLevel: baseXpPerLevel, enabled: realm.levelingConfig?.enabled || true, levelRoles: realm.levelingConfig?.levelRoles || [] }
    });
  };

  const SidebarItem = ({ id, label, adminOnly }: { id: TabId, label: string, adminOnly?: boolean }) => {
    if (adminOnly && !isOwner) return null;
    return (
      <button onClick={() => { setActiveTab(id); setEditingRoleId(null); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] font-black uppercase tracking-tight transition-all ${activeTab === id && !editingRoleId ? 'bg-white/10 text-white' : 'text-muted hover:bg-white/5 hover:text-primary'}`}>{label}</button>
    );
  };

  return (
    <div className="fixed inset-0 z-[1000] flex bg-primary animate-in duration-200">
      <div className="w-64 sm:w-80 bg-sidebar flex-shrink-0 flex flex-col items-end pt-16 px-6 border-r border-white/5">
        <div className="w-48 space-y-0.5">
          <h3 className="text-[10px] font-black text-muted uppercase tracking-widest px-3 mb-2 opacity-50 truncate">{realm.name}</h3>
          <SidebarItem id="general" label="General" adminOnly />
          <SidebarItem id="roles" label="Roles & Permissions" adminOnly />
          <SidebarItem id="questions" label="Onboarding" adminOnly />
          <SidebarItem id="automod" label="Auto-mod" adminOnly />
          <SidebarItem id="verify" label="Verify Realm" adminOnly />
          <SidebarItem id="leveling" label="Leveling" adminOnly />
          <SidebarItem id="notifications" label="Notifications" />
          <div className="h-[1px] bg-white/5 my-4 mx-3" />
          <button onClick={onClose} className="w-full text-left px-3 py-1.5 rounded-lg text-[13px] font-black uppercase tracking-tight text-muted hover:bg-white/5 transition-all">Exit Protocols</button>
        </div>
      </div>

      <div className="flex-1 bg-chat relative overflow-y-auto pt-16 px-6 sm:px-12 pb-32 no-scrollbar">
        <div className="max-w-2xl mx-auto animate-in duration-300">
          <div className="fixed top-12 right-12 flex flex-col items-center gap-2 group cursor-pointer z-50" onClick={onClose}>
            <div className="w-10 h-10 rounded-full border-2 border-muted flex items-center justify-center text-muted group-hover:text-primary group-hover:border-primary transition-all active:scale-90"><span className="text-xl font-light">✕</span></div>
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Esc</span>
          </div>

          {activeTab === 'general' && (
            <div className="space-y-10 animate-in">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">General Protocols</h2>
              <div className="bg-secondary/40 border border-white/5 rounded-3xl p-8 space-y-10 shadow-inner backdrop-blur-sm">
                <div className="flex items-center gap-8">
                  <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-[32px] bg-tertiary flex items-center justify-center border-2 border-dashed border-white/10 hover:border-accent hover:text-accent transition-all cursor-pointer overflow-hidden group relative shadow-2xl">
                    {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover group-hover:brightness-50" /> : <Icons.Plus />}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-black text-white uppercase tracking-widest">Update</span></div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setAvatarUrl(reader.result as string); reader.readAsDataURL(file); } }} className="hidden" accept="image/*" />
                  <div className="flex-1">
                    <h4 className="text-[11px] font-black text-white uppercase mb-1 tracking-widest">Realm Identifier</h4>
                    <p className="text-[10px] text-muted font-medium mb-4 opacity-50">Upload a custom image to represent this community.</p>
                  </div>
                </div>
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-muted uppercase mb-3 tracking-widest ml-1">Frequency Name</label>
                    <input type="text" value={realmName} onChange={(e) => setRealmName(e.target.value)} className="w-full bg-black/40 rounded-xl p-4 border border-white/5 outline-none font-black text-white focus:ring-2 focus:ring-accent transition-all shadow-inner" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-muted uppercase mb-3 tracking-widest ml-1">Realm Guidelines (Bio)</label>
                    <textarea value={realmBio} onChange={(e) => setRealmBio(e.target.value)} className="w-full bg-black/40 rounded-xl p-4 border border-white/5 outline-none text-sm min-h-[100px] font-medium text-white focus:ring-2 focus:ring-accent transition-all shadow-inner" placeholder="Tell people about your realm..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-muted uppercase mb-3 tracking-widest ml-1">Spectrum Index</label>
                      <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/5 shadow-inner">
                        <input type="color" value={bannerColor} onChange={(e) => setBannerColor(e.target.value)} className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer" />
                        <span className="text-[10px] font-mono font-black text-white uppercase opacity-40">{bannerColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'automod' && (
            <div className="space-y-10 animate-in">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">AI Signal Guardian</h2>
              <div className="bg-secondary/40 border border-white/5 rounded-3xl p-8 space-y-8 shadow-inner backdrop-blur-sm">
                <div className="flex items-center justify-between p-6 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
                  <div>
                    <h4 className="text-[12px] font-black text-white uppercase tracking-widest">Guardian Protocol</h4>
                    <p className="text-[10px] text-muted font-bold opacity-50 mt-1 uppercase">Automated neural moderation based on realm guidelines</p>
                  </div>
                  <button 
                    onClick={() => setAutoModEnabled(!autoModEnabled)}
                    className={`w-14 h-8 rounded-full transition-all relative ${autoModEnabled ? 'bg-accent shadow-[0_0_15px_rgba(var(--accent-color-rgb),0.4)]' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full transition-all ${autoModEnabled ? 'right-1 bg-black shadow-lg' : 'left-1 bg-neutral-600'}`} />
                  </button>
                </div>

                {autoModEnabled && (
                  <div className="space-y-6 animate-in fade-in">
                    <label className="block text-[10px] font-black text-muted uppercase tracking-[0.3em] ml-1 opacity-50">Neural Sensitivity Level</label>
                    <div className="grid grid-cols-1 gap-3">
                      {AUTOMOD_LEVELS.map(level => (
                        <button 
                          key={level.id}
                          onClick={() => setAutoModHarshness(level.id)}
                          className={`w-full text-left p-6 rounded-2xl border transition-all active:scale-[0.98] flex items-center justify-between group ${
                            autoModHarshness === level.id 
                              ? 'bg-accent/10 border-accent/40 shadow-inner' 
                              : 'bg-black/20 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className={`text-sm font-black uppercase tracking-tight ${autoModHarshness === level.id ? 'text-accent' : 'text-white'}`}>{level.label}</span>
                              {autoModHarshness === level.id && <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                            </div>
                            <p className="text-[10px] text-muted font-medium opacity-60 leading-relaxed">{level.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                      <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest leading-relaxed">
                        <span className="mr-2">⚠️</span> Suspension duration is derived from the specific Guideline broken. AI assesses the frequency based on your "Guidelines" channel settings.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'verify' && (
            <div className="space-y-10 animate-in">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Verification Neural Check</h2>
              <div className="bg-secondary/40 border border-white/5 rounded-[40px] p-12 text-center space-y-10 relative overflow-hidden shadow-2xl backdrop-blur-md">
                {realm.isVerified && (
                  <div className="absolute top-0 right-0 p-4">
                    <div className="bg-accent text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Authorized Community</div>
                  </div>
                )}
                <div className="relative z-10 space-y-8">
                  <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl border-2 transition-all ${realm.isVerified ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'bg-accent/5 text-accent border-accent/10 animate-pulse'}`}>{realm.isVerified ? '✨' : '✓'}</div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Frequency Sync Review</h3>
                    <p className="text-sm text-muted max-w-sm mx-auto font-medium leading-relaxed opacity-60">AI scanners evaluate your charter and identifiers for compliance with interstellar standards.</p>
                  </div>
                  
                  {verifError && (
                    <div className="p-4 bg-red-400/10 border border-red-400/20 rounded-2xl animate-in shadow-lg">
                      <p className="text-xs font-bold text-red-400">Analysis Halted: {verifError}</p>
                    </div>
                  )}

                  <div className="space-y-4 text-left">
                    <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4 opacity-30 ml-1">Protocol Checklist</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between p-5 bg-black/30 rounded-3xl border border-white/5 shadow-inner"><div className="flex items-center gap-4"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${verificationMetrics.chatCount >= 5 ? 'bg-green-500 text-black' : 'bg-white/5 text-muted'}`}>{verificationMetrics.chatCount >= 5 ? '✓' : '1'}</div><span className="text-[11px] font-black uppercase text-primary tracking-tight">Active Transmissions (5+)</span></div><span className="text-xs font-mono text-muted">{verificationMetrics.chatCount}/5</span></div>
                      <div className="flex items-center justify-between p-5 bg-black/30 rounded-3xl border border-white/5 shadow-inner"><div className="flex items-center gap-4"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${verificationMetrics.hasAnnouncements ? 'bg-green-500 text-black' : 'bg-white/5 text-muted'}`}>{verificationMetrics.hasAnnouncements ? '✓' : '2'}</div><span className="text-[11px] font-black uppercase text-primary tracking-tight">Announcement Node</span></div><span className="text-xs font-mono text-muted">{verificationMetrics.hasAnnouncements ? 'READY' : 'ABSENT'}</span></div>
                      <div className="flex items-center justify-between p-5 bg-black/30 rounded-3xl border border-white/5 shadow-inner"><div className="flex items-center gap-4"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${verificationMetrics.hasRules ? 'bg-green-500 text-black' : 'bg-white/5 text-muted'}`}>{verificationMetrics.hasRules ? '✓' : '3'}</div><span className="text-[11px] font-black uppercase text-primary tracking-tight">Safety Protocol Node</span></div><span className="text-xs font-mono text-muted">{verificationMetrics.hasRules ? 'READY' : 'ABSENT'}</span></div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleVerify}
                    disabled={!isEligibleForVerification || isVerifying || realm.isVerified} 
                    className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-[11px] border transition-all flex items-center justify-center gap-3 shadow-2xl ${realm.isVerified ? 'bg-green-600 border-green-600 text-white opacity-50 cursor-default' : isEligibleForVerification ? 'bg-accent text-black border-accent hover:brightness-110 active:scale-95' : 'bg-white/5 text-muted border-white/5 cursor-not-allowed opacity-50'}`}
                  >
                    {isVerifying ? 'Scanning Frequencies...' : realm.isVerified ? 'Verification Lock Active' : 'Initiate Sync Review'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {hasChanges && isOwner && (
            <div className="fixed bottom-0 left-64 sm:left-80 right-0 bg-black/60 backdrop-blur-2xl border-t border-white/10 p-6 flex items-center justify-center z-[1001] animate-in slide-in-from-bottom-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-8 bg-secondary/80 p-3 pl-8 rounded-3xl border border-white/10 shadow-2xl">
                <p className="text-xs font-black text-white uppercase tracking-widest">Unsaved Protocols Detected!</p>
                <div className="flex items-center gap-3">
                  <button onClick={handleReset} className="px-5 py-3 text-[10px] font-black uppercase text-muted hover:text-white transition-all active:scale-90">Discard</button>
                  <button onClick={handleSave} className="bg-accent text-black px-10 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-accent/20 hover:brightness-110 active:scale-95 transition-all">Publish Protocols</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
