
import React, { useState, useMemo, useRef } from 'react';
import { ALL_EMOJIS, Icons, EmojiData } from '../constants';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose, className = "" }) => {
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return ALL_EMOJIS;
    const s = search.toLowerCase();
    // Unique filtering to avoid showing duplicates if they exist in the constant
    const seen = new Set();
    return ALL_EMOJIS.filter(e => {
      const match = e.name.toLowerCase().includes(s) || e.category.toLowerCase().includes(s);
      if (match && !seen.has(e.emoji)) {
        seen.add(e.emoji);
        return true;
      }
      return false;
    });
  }, [search]);

  const emojisByCategory = useMemo(() => {
    const categories: { [key: string]: EmojiData[] } = {};
    filteredEmojis.forEach(e => {
      if (!categories[e.category]) categories[e.category] = [];
      // Also prevent duplicates within categories
      if (!categories[e.category].some(existing => existing.emoji === e.emoji)) {
        categories[e.category].push(e);
      }
    });
    return categories;
  }, [filteredEmojis]);

  const scrollToCategory = (category: string) => {
    // We use a query selector to find the element within the picker's scroll area
    const element = scrollRef.current?.querySelector(`[data-cat-id="emoji-cat-${category}"]`) as HTMLElement;
    if (element && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: element.offsetTop - 12,
        behavior: 'smooth'
      });
    }
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(ALL_EMOJIS.map(e => e.category)));
    // Filter categories that have emojis in the current view
    if (!search) return cats;
    return cats.filter(c => emojisByCategory[c] && emojisByCategory[c].length > 0);
  }, [search, emojisByCategory]);

  return (
    <div 
      className={`bg-[#2b2d31] border border-white/5 rounded-2xl shadow-2xl z-[800] flex flex-row w-[320px] sm:w-[480px] h-[380px] sm:h-[440px] overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-2 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Left Sidebar: Search & Categories */}
      <div className="w-24 sm:w-32 flex-shrink-0 border-r border-white/5 bg-[#1e1f22]/50 flex flex-col">
        <div className="p-3 space-y-4">
          <div>
            <label className="block text-[8px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 ml-1">Search</label>
            <div className="flex items-center bg-[#1e1f22] rounded-xl px-2 py-1.5 gap-2 border border-white/5 focus-within:ring-1 focus-within:ring-accent/50 transition-all shadow-inner">
              <span className="text-neutral-500 scale-75 shrink-0"><Icons.Search /></span>
              <input 
                autoFocus 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Find..." 
                className="bg-transparent border-none outline-none text-[10px] text-white w-full font-medium" 
              />
            </div>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[250px] no-scrollbar">
            <label className="block text-[8px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 ml-1">Categories</label>
            <div className="flex flex-col gap-0.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => scrollToCategory(cat)}
                  className="text-left px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight text-muted hover:bg-white/5 hover:text-primary transition-all truncate"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-auto p-3 border-t border-white/5 opacity-30 hidden sm:block">
          <div className="text-[8px] font-black text-neutral-500 uppercase tracking-widest text-center">Realms</div>
        </div>
      </div>

      {/* Right Content: Emoji Grid */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-4 bg-[#2b2d31] relative"
      >
        {Object.keys(emojisByCategory).length > 0 ? (
          (Object.entries(emojisByCategory) as [string, EmojiData[]][]).map(([category, emojis]) => (
            <div key={category} data-cat-id={`emoji-cat-${category}`} className="mb-6">
              <h5 className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-3 px-1 sticky top-0 bg-[#2b2d31] py-1 z-10">{category}</h5>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                {emojis.map((e) => (
                  <button 
                    key={e.emoji + e.name} 
                    type="button"
                    title={e.name}
                    onClick={() => {
                      onSelect(e.emoji);
                      onClose();
                    }} 
                    className="w-full aspect-square flex items-center justify-center text-xl sm:text-2xl hover:bg-white/10 rounded-xl transition-all active:scale-75 hover:scale-110"
                  >
                    {e.emoji}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="text-4xl mb-4 opacity-20">🔎</div>
            <div className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">No match</div>
            <button 
              onClick={() => setSearch('')}
              className="mt-4 text-[9px] font-black text-accent uppercase tracking-widest hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
