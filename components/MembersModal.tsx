
import React from 'react';
import { Friend, User } from '../types';

interface MembersModalProps {
  friend: Friend; // friend here represents the group
  onClose: () => void;
}

export const MembersModal: React.FC<MembersModalProps> = ({ friend, onClose }) => {
  const usersDb: User[] = JSON.parse(localStorage.getItem('nebula_db_users') || '[]');
  const members = usersDb.filter(u => friend.memberIds?.includes(u.id));

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[#313338] w-full max-w-sm rounded-lg shadow-2xl overflow-hidden border border-white/5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-bold text-white">Group Members ({members.length})</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">✕</button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded hover:bg-white/5">
              <div className="w-8 h-8 rounded-full bg-[#1e1f22] overflow-hidden flex items-center justify-center border border-white/5 flex-shrink-0">
                {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : <span>{m.displayName[0]}</span>}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{m.displayName}</div>
                <div className="text-[10px] text-neutral-400">@{m.username}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
