
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, ShopItem } from '../types';
import { Icons, BORDER_COLORS } from '../constants';
import { hashPassword } from './Auth';

interface SettingsProps {
  user: User;
  accounts: User[];
  isAdmin?: boolean;
  onUpdateUser: (updates: Partial<User>) => void;
  onUpdateOtherUser?: (uid: string, updates: Partial<User>) => void;
  onClose: () => void;
  onLogout: () => void;
  onSwitchAccount: (user: User) => void;
  onAddAccount: () => void;
  onRemoveIdentity: (uid: string) => void;
  uiOverrides: Record<string, string>;
  onUpdateUIOverride: (key: string, value: any) => void;
  globalUsers?: User[];
  systemConfig: any;
  shopItems: ShopItem[];
  renderInteractiveText?: (id: string, defaultText: string, className?: string) => React.ReactNode;
  onEnterEditMode?: () => void;
}

type TabId = 'profile' | 'appearance' | 'accounts' | 'security' | 'users' | 'voice' | 'content_edit';

export const Settings: React.FC<SettingsProps> = ({ 
  user, accounts, isAdmin, onUpdateUser, onUpdateOtherUser, onClose, onLogout, onSwitchAccount, onAddAccount, onRemoveIdentity,
  systemConfig, shopItems, globalUsers = [], onUpdateUIOverride, renderInteractiveText, onEnterEditMode
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [bannerUrl, setBannerUrl] = useState(user.bannerUrl || '');
  const [socialLinks, setSocialLinks] = useState(user.socialLinks || { youtube: '', tiktok: '', twitch: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const rit = renderInteractiveText || ((id, def) => def);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await onUpdateUser({ displayName, bio, avatarUrl, bannerUrl, socialLinks });
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) return setPassError('Passwords do not match');
    const hashed = await hashPassword(newPassword);
    await onUpdateUser({ password: hashed });
    setNewPassword(''); setConfirmPassword('');
    setSaveSuccess(true);
  };

  const tabs: { id: TabId; label: string; adminOnly?: boolean }[] = [
    { id: 'profile', label: 'My Profile' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'voice', label: 'Voice & Video' },
    { id: 'security', label: 'Security' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'users', label: 'User Directory', adminOnly: true },
    { id: 'content_edit', label: 'Edit Content', adminOnly: true },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex bg-primary animate-in duration-200">
      <div className="w-64 sm:w-80 bg-sidebar flex-shrink-0 flex flex-col items-end pt-16 px-6 border-r border-white/5 h-full overflow-y-auto">
        <div className="w-48 space-y-1">
          {tabs.filter(t => !t.adminOnly || isAdmin).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold ${activeTab === t.id ? 'bg-white/10 text-white' : 'text-muted hover:bg-white/5 hover:text-white'}`}>{t.label}</button>
          ))}
          <div className="h-[1px] bg-white/5 my-4" />
          <button onClick={onLogout} className="w-full text-left px-3 py-2 text-red-400 font-bold hover:bg-red-500/10 rounded-lg">Log Out</button>
        </div>
      </div>
      <div className="flex-1 bg-chat overflow-y-auto p-8 sm:p-16 no-scrollbar">
        <div className="max-w-xl mx-auto space-y-12">
           <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{activeTab.replace('_', ' ').toUpperCase()}</h2>
              <button onClick={onClose} className="p-2 text-muted hover:text-white">✕</button>
           </div>

           {activeTab === 'profile' && (
             <div className="space-y-8 animate-in">
               <div className="space-y-4">
                  <label className="text-[10px] font-bold text-muted uppercase">Explorer Identity</label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-tertiary p-4 rounded-xl outline-none text-white border border-white/5 font-bold" />
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-bold text-muted uppercase">Identity Log (Bio)</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="w-full bg-tertiary p-4 rounded-xl outline-none text-white border border-white/5 resize-none text-sm" />
               </div>
               
               <div className="space-y-4">
                  <label className="text-[10px] font-bold text-muted uppercase">Neural Connections (Socials)</label>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-4 bg-tertiary p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] font-black text-red-400 uppercase w-20">YouTube</span>
                      <input type="text" value={socialLinks.youtube} onChange={e => setSocialLinks({...socialLinks, youtube: e.target.value})} placeholder="https://youtube.com/..." className="bg-transparent flex-1 outline-none text-xs text-white" />
                    </div>
                    <div className="flex items-center gap-4 bg-tertiary p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] font-black text-pink-400 uppercase w-20">TikTok</span>
                      <input type="text" value={socialLinks.tiktok} onChange={e => setSocialLinks({...socialLinks, tiktok: e.target.value})} placeholder="https://tiktok.com/@..." className="bg-transparent flex-1 outline-none text-xs text-white" />
                    </div>
                    <div className="flex items-center gap-4 bg-tertiary p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] font-black text-purple-400 uppercase w-20">Twitch</span>
                      <input type="text" value={socialLinks.twitch} onChange={e => setSocialLinks({...socialLinks, twitch: e.target.value})} placeholder="https://twitch.tv/..." className="bg-transparent flex-1 outline-none text-xs text-white" />
                    </div>
                  </div>
               </div>

               <button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-accent text-black font-black py-4 rounded-xl hover:brightness-110 transition-all uppercase text-xs tracking-widest shadow-xl shadow-accent/20">
                 {isSaving ? 'Syncing...' : saveSuccess ? 'Profile Saved ✓' : 'Publish Identity'}
               </button>
             </div>
           )}

           {activeTab === 'appearance' && (
             <div className="space-y-12 animate-in">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Interface Frequency</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => onUpdateUser({ theme: 'dark' })} className={`p-6 rounded-2xl border-2 transition-all font-bold uppercase text-[10px] tracking-widest ${user.theme !== 'light' ? 'border-accent bg-accent/5 text-accent shadow-lg shadow-accent/10' : 'border-white/5 hover:bg-white/5 text-muted'}`}>Midnight Protocol</button>
                    <button onClick={() => onUpdateUser({ theme: 'light' })} className={`p-6 rounded-2xl border-2 transition-all font-bold uppercase text-[10px] tracking-widest ${user.theme === 'light' ? 'border-accent bg-accent/5 text-accent shadow-lg shadow-accent/10' : 'border-white/5 hover:bg-white/5 text-muted'}`}>Solar Exposure</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Spectrum Pin (Accent)</label>
                  <div className="grid grid-cols-5 gap-3">
                    {BORDER_COLORS.map(c => (
                      <button key={c.value} onClick={() => onUpdateUser({ accentColor: c.value })} className={`aspect-square rounded-2xl border-4 transition-all hover:scale-110 active:scale-95 ${user.accentColor === c.value ? 'border-white shadow-xl' : 'border-transparent opacity-60'}`} style={{ backgroundColor: c.value }} />
                    ))}
                  </div>
                </div>
                <div className="pt-8 border-t border-white/5">
                   <button onClick={onEnterEditMode} className="w-full py-6 border-2 border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase text-muted hover:border-accent hover:text-accent hover:bg-accent/5 transition-all shadow-inner tracking-[0.2em]">
                     Initialize Visual Calibration Mode
                   </button>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
