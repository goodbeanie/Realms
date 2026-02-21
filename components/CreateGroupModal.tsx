import React, { useState } from 'react';
import { Friend } from '../types';

interface CreateGroupModalProps {
  friends: Friend[];
  onClose: () => void;
  onCreate: (name: string, memberIds: string[]) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ friends, onClose, onCreate }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleFriend = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName.trim() && selectedIds.length > 0) {
      onCreate(groupName.trim(), selectedIds);
    }
  };

  const onlyRealFriends = friends.filter(f => !f.isGroup);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 p-4" onClick={onClose}>
      <div 
        className="bg-[#161719] w-full max-w-[360px] rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">New Group Chat</h2>
          <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Connect with multiple users at once</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div>
            <label className="block text-[10px] font-black text-muted uppercase mb-3 tracking-widest ml-1 opacity-50 text-center">Group Name</label>
            <input 
              autoFocus
              type="text" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Team Alpha"
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-accent transition-all text-center font-black placeholder:opacity-20 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-muted uppercase mb-4 tracking-widest ml-1 opacity-50 text-center">Select Members ({selectedIds.length})</label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 bg-black/20 rounded-2xl p-3 shadow-inner border border-white/5 no-scrollbar">
              {onlyRealFriends.length === 0 ? (
                <p className="text-[10px] text-muted p-4 italic text-center font-black uppercase tracking-widest opacity-40">No friends available.</p>
              ) : (
                onlyRealFriends.map(friend => (
                  <div 
                    key={friend.id}
                    onClick={() => toggleFriend(friend.id)}
                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${selectedIds.includes(friend.id) ? 'bg-accent/10 border-accent/20 shadow-xl' : 'hover:bg-white/5 border-transparent'}`}
                  >
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.includes(friend.id) ? 'bg-accent border-accent' : 'border-neutral-700'}`}>
                      {selectedIds.includes(friend.id) && <span className="text-[11px] text-black font-black">✓</span>}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-[10px] font-black overflow-hidden border border-white/10 shrink-0">
                      {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full object-cover" /> : friend.initials}
                    </div>
                    <span className="text-xs font-black text-white truncate uppercase tracking-tight">{friend.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>

        <div className="bg-black/20 p-6 flex gap-4 border-t border-white/5">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 text-white hover:underline px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!groupName.trim() || selectedIds.length === 0}
            className="flex-[2] bg-accent text-black px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-30 shadow-xl shadow-accent/10 active:scale-[0.98]"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};