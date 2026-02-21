
import React, { useState } from 'react';
import { User } from '../types';

interface SuspendUserModalProps {
  user: User;
  realmId: string;
  onClose: () => void;
  onSuspend: (minutes: number, reason: string) => Promise<void>;
}

export const SuspendUserModal: React.FC<SuspendUserModalProps> = ({ user, realmId, onClose, onSuspend }) => {
  const [minutes, setMinutes] = useState(60);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (minutes <= 0 || !reason.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSuspend(minutes, reason.trim());
      onClose();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 p-4" onClick={onClose}>
      <div 
        className="bg-[#161719] w-full max-w-md rounded-[32px] shadow-[0_32px_128px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Suspend Explorer</h2>
          <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Block realm access for {user.displayName}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-muted uppercase mb-3 tracking-widest ml-1 opacity-50">Duration (Minutes)</label>
              <input 
                type="number" 
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-black shadow-inner"
                min="1"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-muted uppercase mb-3 tracking-widest ml-1 opacity-50">Reason for Isolation</label>
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Violation of realm guidelines..."
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-sm font-medium placeholder:opacity-20 shadow-inner resize-none min-h-[120px]"
                required
              />
            </div>
          </div>
        </form>

        <div className="bg-black/20 p-6 flex gap-4 border-t border-white/5">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 text-white hover:underline px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100 transition-all"
          >
            Abort
          </button>
          <button 
            onClick={handleSubmit}
            disabled={minutes <= 0 || !reason.trim() || isSubmitting}
            className="flex-[2] bg-red-500 text-white font-black disabled:opacity-30 px-6 py-4 rounded-2xl uppercase text-[11px] tracking-widest shadow-xl shadow-red-500/20 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            {isSubmitting ? 'Isolating...' : 'Confirm Suspension'}
          </button>
        </div>
      </div>
    </div>
  );
};
