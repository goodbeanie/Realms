
import React, { useState } from 'react';

interface AddFriendModalProps {
  onClose: () => void;
  onSend: (username: string) => { success: boolean; message: string } | Promise<{ success: boolean; message: string }>;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({ onClose, onSend }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || isLoading) return;
    
    setIsLoading(true);
    setStatus({ type: null, message: null });
    
    try {
      const result = await onSend(username.trim());
      setStatus({ type: result.success ? 'success' : 'error', message: result.message });
      
      if (result.success) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-primary w-full max-w-sm rounded-lg shadow-2xl border border-subtle overflow-hidden animate-in zoom-in-95 duration-200 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-primary mb-2">Add Friend</h2>
          <p className="text-muted text-sm mb-4">You can add friends with their Realms username.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input 
                autoFocus
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a username"
                disabled={isLoading}
                className="w-full bg-tertiary border-none rounded p-3 text-primary outline-none focus:ring-2 focus:ring-accent transition-all text-center disabled:opacity-50"
              />
            </div>

            {status.message && (
              <div className={`text-xs p-2 rounded ${status.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {status.message}
              </div>
            )}

            <div className="flex flex-row gap-3 pt-2">
              <button 
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 text-primary hover:underline px-4 py-2 border border-subtle rounded font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!username.trim() || isLoading}
                className="flex-1 bg-accent text-black px-6 py-2 rounded font-bold transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  'Send Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
