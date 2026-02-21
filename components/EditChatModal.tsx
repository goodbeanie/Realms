
import React, { useState } from 'react';
import { Role, Chat } from '../types';
import { Icons } from '../constants';

interface EditChatModalProps {
  chat: Chat;
  roles: Role[];
  onClose: () => void;
  onUpdate: (updates: Partial<Chat>) => void;
}

export const EditChatModal: React.FC<EditChatModalProps> = ({ chat, roles, onClose, onUpdate }) => {
  const [name, setName] = useState(chat.name);
  const [allowedRoleIds, setAllowedRoleIds] = useState<string[]>(chat.allowedRoleIds || []);

  const toggleRole = (roleId: string) => {
    setAllowedRoleIds(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSave = () => {
    onUpdate({ name, allowedRoleIds: allowedRoleIds.length > 0 ? allowedRoleIds : undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[#313338] w-full max-w-md rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Edit Chat</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-neutral-500 uppercase mb-2 tracking-widest ml-1">Chat Name (Supports Emojis)</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1e1f22] border-none rounded-xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-accent transition-all font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-neutral-500 uppercase mb-3 tracking-widest ml-1">Permissions — Who can view this chat?</label>
              <p className="text-[10px] text-muted mb-4 px-1 italic">If none are selected, everyone can view this chat.</p>
              <div className="space-y-2 bg-[#1e1f22] rounded-xl p-3 max-h-48 overflow-y-auto">
                {roles.filter(r => r.id !== 'everyone').map(role => (
                  <div 
                    key={role.id} 
                    onClick={() => toggleRole(role.id)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${allowedRoleIds.includes(role.id) ? 'bg-accent/10' : 'hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                      <span className="text-[11px] font-bold text-white uppercase tracking-tight">{role.name}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${allowedRoleIds.includes(role.id) ? 'bg-accent border-accent' : 'border-neutral-600'}`}>
                      {allowedRoleIds.includes(role.id) && <span className="text-[10px] text-black font-black">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={onClose}
                className="flex-1 text-white hover:underline px-4 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-[1.5] bg-accent text-black px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all hover:brightness-110 shadow-xl shadow-accent/10 active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
