import React, { useState, useMemo, useRef } from 'react';
import { User, ShopItem } from '../types';
import { Icons } from '../constants';

interface ArtifactRegistryProps {
  shopItems: ShopItem[];
  onUpdateShopItem: (id: string, data: any) => Promise<void>;
  onDeleteShopItem: (id: string) => Promise<void>;
  globalUsers: User[];
  onUpdateOtherUser: (uid: string, updates: Partial<User>) => Promise<void>;
  onBack: () => void;
  renderInteractiveText?: (id: string, defaultText: string, className?: string) => React.ReactNode;
}

export const ArtifactRegistry: React.FC<ArtifactRegistryProps> = ({
  shopItems, onUpdateShopItem, onDeleteShopItem, globalUsers, onUpdateOtherUser, onBack, renderInteractiveText
}) => {
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ShopItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [purgeInventory, setPurgeInventory] = useState(false);
  const variantInputRef = useRef<HTMLInputElement>(null);

  const rit = renderInteractiveText || ((id, def) => def);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return shopItems;
    const s = search.toLowerCase();
    return shopItems.filter(item => 
      item.name.toLowerCase().includes(s) || 
      item.description.toLowerCase().includes(s)
    );
  }, [shopItems, search]);

  const handleTogglePin = async (item: ShopItem) => {
    await onUpdateShopItem(item.id, { ...item, isPinned: !item.isPinned });
  };

  const handleSaveEdits = async () => {
    if (!editingItem) return;
    await onUpdateShopItem(editingItem.id, editingItem);
    setEditingItem(null);
  };

  const handleConfirmPurge = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteShopItem(itemToDelete.id);
      if (purgeInventory) {
        const owners = globalUsers.filter(u => u.unlockedItems?.includes(itemToDelete.id));
        for (const owner of owners) {
          const nextUnlocked = (owner.unlockedItems || []).filter(id => id !== itemToDelete.id);
          const updates: Partial<User> = { unlockedItems: nextUnlocked };
          if (owner.equippedAuraId === itemToDelete.id) updates.equippedAuraId = undefined;
          if (owner.equippedBannerId === itemToDelete.id) updates.equippedBannerId = undefined;
          await onUpdateOtherUser(owner.id, updates);
        }
      }
      setItemToDelete(null);
      setPurgeInventory(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 bg-[#0f1012] flex flex-col h-full overflow-hidden animate-in fade-in duration-700 relative">
      {/* Header Bar */}
      <div className="h-16 border-b border-white/5 bg-[#0f1012]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-40 sticky top-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-muted hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent active:scale-90">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-accent text-xl"><Icons.Inventory /></span>
            <span className="font-bold text-sm text-white/90">{rit('artifact_registry_title', 'Artifact Registry')}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-4 pb-32">
          
          {/* Simplified Search & Header Section */}
          <div className="bg-[#161719] border border-white/5 rounded-[24px] p-6 space-y-4 shadow-xl mb-6">
            <div>
              <h1 className="text-xl font-bold text-white mb-1">{rit('artifact_manifest_header', 'Items Manifest')}</h1>
              <p className="text-xs text-neutral-500 font-medium">{rit('artifact_manifest_sub', 'Manage and edit your created artifacts')}</p>
            </div>
            
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted transition-colors group-focus-within:text-accent">
                <Icons.Search />
              </div>
              <input 
                type="text" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl pl-12 pr-4 text-sm font-medium text-white outline-none focus:ring-1 focus:ring-accent transition-all shadow-inner" 
                placeholder="Search items..." 
              />
            </div>
          </div>

          {/* Slim Item Rows (Matching search bar height) */}
          <div className="space-y-2">
            {filteredItems.map(item => (
              <div key={item.id} className="h-14 bg-[#161719] border border-white/5 rounded-xl px-4 flex items-center gap-4 transition-all hover:bg-black/30 group shadow-sm">
                
                {/* Slim Icon Area */}
                <div className="relative shrink-0">
                   <div className="w-10 h-10 rounded-lg bg-tertiary border border-white/10 flex items-center justify-center overflow-hidden shadow-md">
                      {item.icon && item.icon.length > 10 ? <img src={item.icon} className="w-full h-full object-contain" /> : <span className="text-xl">{item.icon || '✨'}</span>}
                   </div>
                   {item.isPinned && (
                      <div className="absolute -top-1 -right-1 bg-accent text-black p-0.5 rounded-md shadow-lg border border-black/10">
                         <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/></svg>
                      </div>
                   )}
                </div>

                {/* Main Identity (Readability focus) */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                   <h3 className="text-sm font-bold text-white truncate shrink-0">{item.name}</h3>
                   <span className="w-[1px] h-3 bg-white/10 shrink-0" />
                   <p className="text-xs text-neutral-500 font-medium truncate opacity-80">{item.description}</p>
                </div>

                {/* Metadata Badges */}
                <div className="hidden sm:flex items-center gap-3 shrink-0">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border border-white/5 shadow-inner ${item.rarityColor || 'bg-white/5 text-neutral-400'}`}>
                    {item.rarity}
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/40 rounded-lg border border-white/5">
                     <Icons.Amethyst className="text-purple-400 w-2.5 h-2.5" />
                     <span className="text-xs font-bold text-white/90">{item.cost.toLocaleString()}</span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button 
                    onClick={() => handleTogglePin(item)}
                    className={`p-2 rounded-lg transition-all active:scale-90 border ${item.isPinned ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-white/5 border-transparent text-neutral-500 hover:text-white'}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={item.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14M16 5l-4.7 2.68M16 19v-4M19 16h-4"/></svg>
                  </button>
                  <button 
                    onClick={() => setEditingItem({ ...item })}
                    className="p-2 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-lg transition-all active:scale-90"
                  >
                    <Icons.Settings />
                  </button>
                  <button 
                    onClick={() => setItemToDelete(item)}
                    className="p-2 bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-500 rounded-lg transition-all active:scale-90"
                  >
                    <Icons.Logout />
                  </button>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="py-12 text-center opacity-20 border-2 border-dashed border-white/5 rounded-2xl">
                 <p className="text-xs font-bold">No items found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editing Overlay (Simplified Text) */}
      {editingItem && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in" onClick={() => setEditingItem(null)}>
           <div className="bg-[#161719] border border-white/10 rounded-[32px] p-8 w-full max-w-xl shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh] no-scrollbar" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-2xl font-bold text-white mb-8 text-center">Edit Artifact</h3>
              <div className="space-y-6">
                 <div className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-500 ml-1">Item Name</label>
                        <input 
                          type="text" 
                          value={editingItem.name} 
                          onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                          className="w-full bg-black/40 border border-white/5 rounded-xl h-12 px-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent transition-all" 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-500 ml-1">Description</label>
                        <textarea 
                          value={editingItem.description} 
                          onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                          rows={2}
                          className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-medium text-white outline-none focus:ring-1 focus:ring-accent resize-none transition-all" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-neutral-500 ml-1">Shard Cost</label>
                           <input 
                             type="number" 
                             value={editingItem.cost} 
                             onChange={e => setEditingItem({...editingItem, cost: parseInt(e.target.value) || 0})}
                             className="w-full bg-black/40 border border-white/5 rounded-xl h-12 px-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent transition-all" 
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-neutral-500 ml-1">Rarity</label>
                           <select 
                             value={editingItem.rarity} 
                             onChange={e => setEditingItem({...editingItem, rarity: e.target.value as any})}
                             className="w-full bg-black/40 border border-white/5 rounded-xl h-12 px-4 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-accent transition-all appearance-none"
                           >
                              <option value="Common">Common</option>
                              <option value="Rare">Rare</option>
                              <option value="Epic">Epic</option>
                              <option value="Legendary">Legendary</option>
                           </select>
                        </div>
                    </div>
                 </div>
                 
                 <div className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-4 text-center">
                    <label className="text-[11px] font-bold text-neutral-500">Icons Array</label>
                    <div className="flex flex-wrap justify-center gap-3">
                       {editingItem.variants?.map((v, idx) => (
                         <div key={idx} className="w-12 h-12 rounded-lg bg-tertiary border border-white/10 relative overflow-hidden group">
                            <img src={v} className="w-full h-full object-cover" />
                            <button onClick={() => setEditingItem({...editingItem, variants: editingItem.variants?.filter((_, i) => i !== idx)})} className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-bold">✕</button>
                         </div>
                       ))}
                       <button onClick={() => variantInputRef.current?.click()} className="w-12 h-12 rounded-lg bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center text-neutral-500 hover:text-accent hover:border-accent transition-all active:scale-95 shadow-md">
                          <Icons.Plus />
                       </button>
                    </div>
                    <input type="file" ref={variantInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend = () => { setEditingItem({...editingItem, variants: [...(editingItem.variants || []), r.result as string]}); }; r.readAsDataURL(f); } }} />
                 </div>

                 <div className="flex gap-4 pt-2">
                    <button onClick={() => setEditingItem(null)} className="flex-1 h-12 bg-white/5 text-neutral-400 hover:text-white font-bold rounded-xl transition-all active:scale-95 border border-white/5 text-sm">Cancel</button>
                    <button onClick={handleSaveEdits} className="flex-[2] h-12 bg-accent text-black font-bold rounded-xl transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-accent/10 text-sm">Update Item</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Delete Item Overlay (Simplified Text) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in" onClick={() => setItemToDelete(null)}>
           <div className="bg-[#161719] border border-red-500/20 rounded-[32px] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 ring-1 ring-white/10 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 text-2xl mx-auto mb-6 shadow-inner border border-red-500/20">✕</div>
              <h3 className="text-xl font-bold text-white mb-2 leading-none">Delete Item?</h3>
              <p className="text-sm text-neutral-400 font-medium mb-8 leading-relaxed">Permanently erase <span className="text-white font-bold">{itemToDelete.name}</span> from the catalog.</p>
              
              <div className="bg-black/40 p-4 rounded-xl border border-white/5 mb-8 group cursor-pointer select-none transition-all hover:bg-black/60 active:scale-[0.98] shadow-inner text-left" onClick={() => setPurgeInventory(!purgeInventory)}>
                 <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${purgeInventory ? 'bg-red-500 border-red-500' : 'border-neutral-700'}`}>{purgeInventory && <span className="text-white font-bold text-[10px]">✓</span>}</div>
                    <div className="min-w-0">
                       <p className="text-xs font-bold text-white">Wipe inventories</p>
                       <p className="text-[11px] text-neutral-500 font-medium">Remove from all user vaults</p>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setItemToDelete(null)} disabled={isDeleting} className="flex-1 h-12 bg-white/5 text-neutral-400 hover:text-white font-bold rounded-xl transition-all active:scale-95 border border-white/5 text-sm">Cancel</button>
                 <button onClick={handleConfirmPurge} disabled={isDeleting} className="flex-[1.5] h-12 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2 text-sm">
                   {isDeleting ? <><div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /><span>Deleting...</span></> : 'Delete Item'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};