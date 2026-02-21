import React, { useState } from 'react';

interface JoinRealmModalProps {
  onClose: () => void;
  onJoin: (code: string) => { success: boolean; message: string } | Promise<{ success: boolean; message: string }>;
  renderInteractiveText?: (id: string, defaultText: string, className?: string) => React.ReactNode;
}

export const JoinRealmModal: React.FC<JoinRealmModalProps> = ({ onClose, onJoin, renderInteractiveText }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  const rit = renderInteractiveText || ((id, def) => def);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isLoading) return;
    
    setIsLoading(true);
    setStatus({ type: null, message: null });
    
    try {
      const result = await onJoin(code.trim());
      setStatus({ type: result.success ? 'success' : 'error', message: result.message });
      
      if (result.success) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setStatus({ type: 'error', message: rit('join_realm_fail', 'Synchronization link failed. Please try again.') as string });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 p-4" onClick={onClose}>
      <div 
        className="bg-[#161719] w-full max-w-md rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">{rit('join_realm_title', 'Join Realm')}</h2>
          <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{rit('join_realm_sub', 'Synchronize with an existing frequency')}</p>
        </div>
        
        <div className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-muted uppercase mb-3 tracking-widest ml-1 opacity-50 text-center">{rit('join_realm_label', 'Transmission Code')}</label>
              <input 
                autoFocus
                type="text" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={rit('join_realm_placeholder', 'INV-CODE-XYZ') as string}
                disabled={isLoading}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-accent outline-none focus:ring-2 focus:ring-accent transition-all text-center font-mono text-xl font-black uppercase tracking-[0.2em] placeholder:opacity-20 shadow-inner disabled:opacity-50"
              />
            </div>

            {status.message && (
              <div className={`text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center animate-in fade-in ${status.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {status.message}
              </div>
            )}
          </form>
        </div>

        <div className="bg-black/20 p-6 flex gap-4 border-t border-white/5">
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 text-white hover:underline px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100 transition-all disabled:opacity-20"
          >
            {rit('join_realm_abort', 'Abort')}
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!code.trim() || isLoading}
            className="flex-[2] bg-accent text-black font-black disabled:opacity-30 disabled:scale-95 px-6 py-4 rounded-2xl uppercase text-[11px] tracking-widest shadow-xl shadow-accent/20 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            {isLoading ? rit('join_realm_loading', 'Establishing...') : rit('join_realm_btn', 'Establish Link')}
          </button>
        </div>
      </div>
    </div>
  );
};