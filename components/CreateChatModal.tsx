import React, { useState, useRef, useEffect } from 'react';
import { EmojiPicker } from './EmojiPicker';

interface CreateChatModalProps {
  onClose: () => void;
  onSubmit: (name: string, type: 'text' | 'announcements' | 'rules') => void;
  renderInteractiveText?: (id: string, defaultText: string, className?: string) => React.ReactNode;
}

const TYPE_CONFIG = [
  { id: 'text', label: 'Text Channel', icon: '💬', desc: 'Broadcast signals for basic transmission.' },
  { id: 'announcements', label: 'Announcements', icon: '📢', desc: 'Station alerts that notify all synced units.' },
  { id: 'rules', label: 'Guidelines', icon: '📜', desc: 'Protocol guidelines for community conduct.' },
] as const;

export const CreateChatModal: React.FC<CreateChatModalProps> = ({ onClose, onSubmit, renderInteractiveText }) => {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<'text' | 'announcements' | 'rules'>('text');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const rit = renderInteractiveText || ((id, def) => def);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim().toLowerCase().replace(/\s+/g, '-'), selectedType);
    }
  };

  const addEmoji = (emoji: string) => {
    setName(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 p-4" onClick={onClose}>
      <div 
        className="bg-[#161719] w-full max-w-[440px] rounded-[32px] shadow-[0_32px_128px_rgba(0,0,0,0.8)] border border-white/5 overflow-visible animate-in zoom-in-95 duration-300 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">{rit('create_chat_title', 'New Frequency')}</h2>
          <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{rit('create_chat_sub', 'Designate a new transmission channel')}</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-8">
            <div>
              <label className="block text-[10px] font-black text-muted uppercase mb-4 tracking-widest ml-1 opacity-50">{rit('create_chat_type_label', 'Channel Protocols')}</label>
              <div className="space-y-2">
                {TYPE_CONFIG.map((config) => (
                  <button
                    key={config.id}
                    type="button"
                    onClick={() => setSelectedType(config.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left active:scale-[0.98] ${
                      selectedType === config.id 
                        ? 'bg-accent/10 border-accent/40 shadow-xl shadow-accent/5' 
                        : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/30'
                    }`}
                  >
                    <span className={`text-2xl transition-transform ${selectedType === config.id ? 'scale-110' : 'opacity-40 grayscale'}`}>{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black uppercase tracking-tight ${selectedType === config.id ? 'text-accent' : 'text-primary'}`}>{rit(`create_chat_type_${config.id}`, config.label)}</p>
                      <p className="text-[10px] text-muted font-medium opacity-60 truncate">{rit(`create_chat_type_desc_${config.id}`, config.desc)}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedType === config.id ? 'bg-accent border-accent' : 'border-neutral-700'}`}>
                      {selectedType === config.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-muted uppercase mb-3 tracking-widest ml-1 opacity-50">{rit('create_chat_alias_label', 'Identity Alias')}</label>
              <div className="relative flex items-center bg-black/40 rounded-2xl border border-white/5 focus-within:ring-2 focus-within:ring-accent transition-all shadow-inner overflow-hidden">
                <button 
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="pl-4 pr-1 text-xl hover:scale-110 transition-transform active:scale-95"
                >
                  😊
                </button>
                <span className="text-neutral-500 text-lg font-light mx-2 opacity-30">#</span>
                <input 
                  ref={inputRef}
                  autoFocus
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={rit('create_chat_placeholder', 'frequency-alias') as string}
                  required
                  className="w-full bg-transparent border-none py-4 pr-4 text-white outline-none font-black placeholder:opacity-20"
                />
                {showEmojiPicker && (
                  <div ref={emojiRef} className="absolute bottom-full left-0 mb-4">
                    <EmojiPicker onSelect={addEmoji} onClose={() => setShowEmojiPicker(false)} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-black/20 p-6 flex gap-4 border-t border-white/5">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 text-white hover:underline px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100 transition-all"
            >
              {rit('create_chat_cancel', 'Cancel')}
            </button>
            <button 
              type="submit"
              disabled={!name.trim()}
              className="flex-[1.5] bg-accent text-black px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-30 shadow-xl shadow-accent/10 active:scale-[0.98]"
            >
              {rit('create_chat_btn', 'Establish Channel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};