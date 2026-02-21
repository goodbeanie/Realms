
import React from 'react';
import { Icons } from '../constants';
import { Realm } from '../types';

interface TopNavProps {
  realms: Realm[];
  activeRealmId: string | null;
  onSelectRealm: (id: string | null) => void;
  onOpenCreateRealm: () => void;
  onOpenJoinRealm: () => void;
  customLogoUrl?: string;
  // Added renderInteractiveText to satisfy TopNavProps usage in App.tsx
  renderInteractiveText?: (id: string, defaultText: string, className?: string) => React.ReactNode;
}

export const TopNav: React.FC<TopNavProps> = ({ 
  realms, 
  activeRealmId, 
  onSelectRealm, 
  onOpenCreateRealm, 
  onOpenJoinRealm, 
  customLogoUrl,
  renderInteractiveText
}) => {
  // Use renderInteractiveText if provided, otherwise default to the text itself
  const rit = renderInteractiveText || ((id, def) => def);

  return (
    <div className="h-16 bg-topnav flex items-center px-3 sm:px-6 gap-3 sm:gap-4 border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar scroll-smooth relative z-[120] shadow-xl">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-max h-full">
        {/* Home/DM Button */}
        <div 
          onClick={() => onSelectRealm(null)}
          className={`w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center cursor-pointer transition-all duration-300 shadow-xl group overflow-hidden touch-manipulation ${
            activeRealmId === null ? 'bg-accent rounded-2xl p-2 shadow-accent/20 ring-2 ring-[var(--accent-color-dark)] ring-offset-2 ring-offset-topnav' : 'bg-primary rounded-full hover:rounded-2xl hover:bg-white p-2 sm:p-2.5 text-white hover:text-black border border-white/5'
          }`}
          title="Home"
        >
          <div className={`w-full h-full flex items-center justify-center transition-transform group-hover:scale-110 active:scale-90 ${activeRealmId === null ? 'text-black' : ''}`}>
            {customLogoUrl ? (
              <img src={customLogoUrl} className="w-full h-full object-contain" alt="Home" />
            ) : (
              <Icons.Portal />
            )}
          </div>
        </div>
        
        <div className="w-[1px] h-7 sm:h-8 bg-white/5 mx-1 flex-shrink-0" />

        {/* Dynamic Realms */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {realms.map((realm) => (
            <div 
              key={realm.id}
              onClick={() => onSelectRealm(realm.id)}
              title={realm.name}
              className={`w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center text-white font-black cursor-pointer transition-all duration-300 overflow-hidden touch-manipulation ${
                activeRealmId === realm.id ? 'rounded-2xl bg-accent scale-105 shadow-2xl shadow-accent/30 ring-2 ring-[var(--accent-color-dark)] ring-offset-2 ring-offset-topnav' : 'rounded-full bg-white/5 border border-white/5 hover:rounded-2xl hover:bg-accent hover:border-accent hover:text-black'
              }`}
            >
              {realm.avatarUrl ? (
                <img src={realm.avatarUrl} alt={realm.name} className="w-full h-full object-cover transition-opacity hover:opacity-80" />
              ) : (
                <span className="text-[10px] uppercase tracking-tighter">{realm.initials}</span>
              )}
            </div>
          ))}

          <div className="flex gap-2 sm:gap-2.5 ml-1">
            <button 
              onClick={(e) => { e.stopPropagation(); onOpenCreateRealm(); }}
              className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 bg-white/[0.03] border-2 border-dashed border-white/10 rounded-full flex items-center justify-center text-neutral-500 cursor-pointer hover:text-accent hover:border-accent hover:rounded-2xl transition-all duration-300 group active:scale-95"
              title="Create Realm"
            >
              <div className="transition-transform group-hover:rotate-90 scale-90 sm:scale-100">
                <Icons.Plus />
              </div>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); onOpenJoinRealm(); }}
              className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 bg-white/[0.03] border-2 border-dotted border-white/10 rounded-full flex items-center justify-center text-neutral-500 cursor-pointer hover:text-accent hover:border-accent hover:rounded-2xl transition-all duration-300 group active:scale-95"
              title="Join Realm"
            >
              <div className="transition-transform group-hover:scale-110 scale-90 sm:scale-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
