
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';
import { EmojiPicker } from './EmojiPicker';

interface NamingModalProps {
  title: string;
  placeholder: string;
  initialValue?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export const NamingModal: React.FC<NamingModalProps> = ({ title, placeholder, initialValue = '', onClose, onSubmit }) => {
  const [name, setName] = useState(initialValue);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
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
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 p-4" onClick={onClose}>
      <div 
        className="bg-[#161719] w-full max-w-[95%] sm:max-w-sm rounded-[32px] shadow-[0_32px_128px_rgba(0,0,0,0.8)] border border-white/5 overflow-visible animate-in zoom-in-95 duration-200 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center border-b border-white/5">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h2>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="relative">
            <label className="block text-[10px] font-black text-muted uppercase mb-3 tracking-widest ml-1 text-center opacity-50">Entry Label</label>
            
            <div className="relative flex items-center bg-black/40 rounded-2xl border border-white/5 focus-within:ring-2 focus-within:ring-accent transition-all shadow-inner overflow-hidden">
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="pl-4 pr-2 text-xl hover:scale-110 transition-transform active:scale-95"
              >
                😊
              </button>
              <input 
                ref={inputRef}
                autoFocus
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={placeholder}
                required
                className="w-full bg-transparent border-none py-4 pr-4 text-white outline-none font-bold placeholder:opacity-20 text-sm"
              />

              {showEmojiPicker && (
                <div ref={emojiRef} className="absolute bottom-full left-0 mb-4 z-[700]">
                  <EmojiPicker onSelect={addEmoji} onClose={() => setShowEmojiPicker(false)} />
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="bg-black/20 p-5 sm:p-6 rounded-b-[32px] border-t border-white/5 flex gap-3 sm:gap-4">
          <button 
            onClick={onClose}
            className="flex-1 text-white hover:underline px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex-1 bg-accent text-black font-black disabled:opacity-30 px-6 py-3 rounded-xl transition-all hover:brightness-110 uppercase text-[10px] sm:text-[11px] tracking-widest shadow-xl shadow-accent/20 active:scale-95"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
