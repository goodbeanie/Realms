import React, { useState } from 'react';
import { User, GlobalStore } from '../types';
import { pushUser } from '../firebase';
import { SyncStatus } from '../App';
import { Icons } from '../constants';

export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

interface AuthProps {
  onAuth: (user: User) => void;
  globalStore: GlobalStore;
  syncStatus: SyncStatus;
  renderInteractiveText: (id: string, defaultText: string, className?: string) => React.ReactNode;
  customLogoUrl?: string;
}

export const Auth: React.FC<AuthProps> = ({ onAuth, globalStore, syncStatus, renderInteractiveText, customLogoUrl }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const rit = renderInteractiveText;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const users: User[] = globalStore.users || [];
    const hashedPassword = await hashPassword(password);
    const cleanUsername = username.trim();

    try {
      if (isLogin) {
        const found = users.find(u => u.normalizedUsername === cleanUsername.toLowerCase() && u.password === hashedPassword);
        if (found) {
          onAuth(found);
        } else {
          setError('Authorization failed: Invalid credentials.');
        }
      } else {
        if (!email.includes('@')) throw new Error('Invalid communication email.');
        if (users.some(u => u.normalizedUsername === cleanUsername.toLowerCase())) throw new Error('Identity conflict: Username unavailable.');
        
        const newUser: User = {
          id: Math.random().toString(36).substring(2, 11),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          username: cleanUsername,
          normalizedUsername: cleanUsername.toLowerCase(),
          displayName: cleanUsername,
          shards: 500,
          friendIds: [],
          unlockedItems: [],
          accentColor: '#ffd154',
          theme: 'dark',
          isEmailVerified: true
        };
        await pushUser(newUser.id, newUser);
        onAuth(newUser);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#050506]/80 backdrop-blur-3xl z-0" />
      
      <div className="w-full max-w-[440px] bg-[#161719] rounded-[48px] border border-white/10 shadow-[0_32px_128px_rgba(0,0,0,1)] p-8 sm:p-12 relative z-10 animate-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-accent/10 rounded-[24px] flex items-center justify-center text-accent mb-6 border border-accent/20 shadow-2xl ring-4 ring-accent/5">
            {customLogoUrl ? <img src={customLogoUrl} className="w-full h-full object-contain" /> : <Icons.Portal />}
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{isLogin ? rit('auth_login_title', 'Authorize') : rit('auth_signup_title', 'Create Identity')}</h1>
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest opacity-60">
            {syncStatus === 'connected' ? rit('auth_status_ready', 'Frequency Node Ready') : rit('auth_status_sync', 'Synchronizing...')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase rounded-2xl text-center animate-in fade-in">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">{rit('auth_label_user', 'Username')}</label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:ring-1 focus:ring-accent shadow-inner transition-all" 
                placeholder="explorer_01" 
              />
            </div>

            {!isLogin && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">{rit('auth_label_email', 'Email Address')}</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:ring-1 focus:ring-accent shadow-inner transition-all" 
                  placeholder="link@network.net" 
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">{rit('auth_label_pass', 'Passcode')}</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:ring-1 focus:ring-accent shadow-inner transition-all" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-accent text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-accent/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 mt-4"
          >
            {isLoading ? rit('auth_btn_loading', 'Establishing...') : (isLogin ? rit('auth_btn_login', 'Authorize Entry') : rit('auth_btn_register', 'Generate Node'))}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
           <button 
             onClick={() => { setIsLogin(!isLogin); setError(null); }}
             className="text-[10px] font-black text-neutral-500 uppercase tracking-widest hover:text-accent transition-all"
           >
             {isLogin ? rit('auth_toggle_signup', "Don't have a node? Create one") : rit('auth_toggle_login', "Already have an identity? Authorize")}
           </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 w-full text-center opacity-20 pointer-events-none">
        <p className="text-[9px] font-black text-white uppercase tracking-[0.6em]">Nebula Unified Protocol v4.2</p>
      </div>
    </div>
  );
};