
import React, { useState } from 'react';

interface JoinRelmModalProps {
  onClose: () => void;
  onJoin: (code: string) => { success: boolean; message: string };
}

export const JoinRelmModal: React.FC<JoinRelmModalProps> = ({ onClose, onJoin }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    const result = onJoin(code.trim());
    setStatus({ type: result.success ? 'success' : 'error', message: result.message });
    
    if (result.success) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[#313338] w-full max-w-sm rounded-lg shadow-2xl border border-white/5 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Join a community</h2>
          <p className="text-neutral-400 text-sm mb-6">Enter an invite code to join an existing Relm.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input 
                autoFocus
                type="text" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="INV-CODE-123"
                className="w-full bg-[#1e1f22] border-none rounded p-4 text-white outline-none focus:ring-2 focus:ring-accent transition-all text-center font-mono text-lg font-bold uppercase tracking-widest placeholder:opacity-30"
              />
            </div>

            {status.message && (
              <div className={`text-xs p-3 rounded-lg ${status.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {status.message}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 text-white hover:underline px-4 py-3 border border-white/10 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!code.trim()}
                className="flex-1 bg-accent text-black px-6 py-3 rounded-lg font-bold transition-all hover:brightness-110 disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
