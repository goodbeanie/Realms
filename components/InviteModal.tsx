
import React, { useState } from 'react';
import { Friend } from '../types';
import { Icons } from '../constants';

interface InviteModalProps {
  realmId: string;
  friends: Friend[];
  onClose: () => void;
  onCreateInvite: (realmId: string) => string | null;
  onSendInvite: (realmId: string, friendIds: string[], code: string) => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ realmId, friends, onClose, onCreateInvite, onSendInvite }) => {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    const code = inviteCode || onCreateInvite(realmId);
    if (code) {
      onSendInvite(realmId, selectedFriends, code);
      onClose();
    }
  };

  const filteredFriends = friends.filter(f => !f.isGroup && (f.name.toLowerCase().includes(search.toLowerCase()) || f.username.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 p-4" onClick={onClose}>
      <div 
        className="bg-[#161719] w-full max-w-[360px] rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 pb-4 text-center">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Community Link</h2>
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-2 opacity-60">Broadcast this frequency to explorers</p>
        </div>

        <div className="px-8 mb-6">
           <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted group-focus-within:text-accent transition-colors"><Icons.Search /></div>
              <input 
                type="text" 
                placeholder="Search frequencies..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-accent transition-all shadow-inner"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-1.5 pb-4 min-h-[200px] no-scrollbar">
           {filteredFriends.length === 0 ? (
             <p className="text-muted text-[10px] font-black uppercase tracking-widest text-center py-12 opacity-30">No frequencies detected</p>
           ) : (
             filteredFriends.map(friend => (
               <div 
                key={friend.id} 
                onClick={() => toggleFriend(friend.id)}
                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${selectedFriends.includes(friend.id) ? 'bg-accent/10 border-accent/20 shadow-xl' : 'hover:bg-white/5 border-transparent'}`}
               >
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-black overflow-hidden border border-white/5 shadow-lg">
                      {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full object-cover" /> : friend.initials}
                   </div>
                   <div className="min-w-0">
                      <p className="text-sm font-black text-white uppercase tracking-tight truncate">{friend.name}</p>
                      <p className="text-[9px] text-muted font-mono opacity-40">@{friend.username}</p>
                   </div>
                 </div>
                 <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedFriends.includes(friend.id) ? 'bg-accent border-accent' : 'border-neutral-700'}`}>
                    {selectedFriends.includes(friend.id) && <span className="text-[10px] text-black font-black">✓</span>}
                 </div>
               </div>
             ))
           )}
        </div>

        <div className="bg-black/20 p-8 border-t border-white/5 space-y-6">
          <div className="space-y-3">
             <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-1 opacity-50">Direct Transmission Code</label>
             <div className="flex items-center gap-2 bg-black/40 rounded-2xl p-1 pl-5 border border-white/5 shadow-inner">
                <span className="flex-1 font-mono text-sm font-black text-accent tracking-[0.2em] uppercase truncate">
                  {inviteCode || realmId.substring(0, 8).toUpperCase()}
                </span>
                <button 
                  onClick={() => handleCopy(inviteCode || realmId.substring(0, 8).toUpperCase())}
                  className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase transition-all active:scale-90 ${copied ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-white/5 text-white hover:bg-white/10'}`}
                >
                  {copied ? 'Captured' : 'Copy'}
                </button>
             </div>
          </div>

          <div className="flex gap-4">
             <button 
              onClick={onClose}
              className="flex-1 text-white hover:underline text-[10px] font-black uppercase tracking-widest opacity-50 transition-all active:scale-95"
             >
               Abort
             </button>
             <button 
              disabled={selectedFriends.length === 0}
              onClick={handleSend}
              className="flex-[2] bg-accent text-black font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-accent/20 disabled:opacity-30 transition-all active:scale-95"
             >
               Transmit Invites ({selectedFriends.length})
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
