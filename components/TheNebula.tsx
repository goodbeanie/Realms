
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, ShopItem, Friend, RedeemCode, ResaleItem } from '../types';
import { Icons, BORDER_COLORS, DEFAULT_PRODUCTS } from '../constants';
import { pushShopItem, deleteShopItem, pushRedeemCode, pushUser, pushResaleItem, deleteResaleItem } from '../firebase';

interface TheNebulaProps {
  user: User;
  users: User[];
  products: ShopItem[];
  resaleItems: ResaleItem[];
  redeemCodes: RedeemCode[];
  systemConfig: any;
  onUpdateProducts: (items: ShopItem[]) => void;
  onUpdateRedeemCodes: (codes: RedeemCode[]) => void;
  onPurchase: (itemId: string, cost: number, metadata?: { iconBorderColor?: string, equippedAuraScale?: number, purchasedIcon?: string }) => void;
  onResalePurchase: (resaleId: string) => void;
  onUnlistResale: (resaleId: string) => void;
  onListForResale: (itemId: string, price: number) => void;
  onEquip: (itemId: string | null, type: 'aura' | 'banner') => void;
  onRedeemCode: (code: string) => Promise<{ success: boolean; message: string }>;
  onUpdateOtherUser?: (uid: string, updates: Partial<User>) => void;
  onBack: () => void;
  renderInteractiveText?: (id: string, defaultText: string, className?: string) => React.ReactNode;
}

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

export const TheNebula: React.FC<TheNebulaProps> = ({ 
  user, users, products, resaleItems, redeemCodes, systemConfig, onUpdateProducts, onUpdateRedeemCodes, 
  onPurchase, onResalePurchase, onUnlistResale, onListForResale, onEquip, onRedeemCode, onUpdateOtherUser, onBack,
  renderInteractiveText
}) => {
  const [selectedBorderColor, setSelectedBorderColor] = useState(user.iconBorderColor || BORDER_COLORS[0].value);
  const [showInventory, setShowInventory] = useState(false);
  const [showResellShop, setShowResellShop] = useState(false);
  const [showAdminHub, setShowAdminHub] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemStatus, setRedeemStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessingCode, setIsProcessingCode] = useState(false);
  const [resellSearch, setSearch] = useState('');
  
  const [resellModalItem, setResellModalItem] = useState<ShopItem | null>(null);
  const [resellPriceInput, setResellPriceInput] = useState<number>(500);
  const [showResaleSelection, setShowResaleSelection] = useState(false);

  const rit = renderInteractiveText || ((id, def) => def);

  // Economic cut definitions
  const sellerProfitPct = systemConfig.sellerProfitPct ?? 50;
  const creatorProfitPct = systemConfig.creatorProfitPct ?? 40;
  const nebulaProfitPct = systemConfig.nebulaProfitPct ?? 10;

  const [timeToReset, setTimeToReset] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const resetTime = new Date(now.getTime());
      resetTime.setUTCHours(8, 0, 0, 0); 
      if (now.getUTCHours() >= 8) {
        resetTime.setUTCDate(resetTime.getUTCDate() + 1);
      }
      const diff = resetTime.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeToReset(`${h}h ${m}m ${s}s`);
    };
    updateTimer();
    const int = setInterval(updateTimer, 1000);
    return () => clearInterval(int);
  }, []);

  const activeVariantIndex = useMemo(() => {
    const now = new Date();
    const day = new Date(now.getTime());
    day.setUTCHours(now.getUTCHours() - 8);
    const seedStr = day.toISOString().split('T')[0];
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }, [timeToReset]);

  const displayedProducts = useMemo(() => {
    let list: (ShopItem & { resaleId?: string, sellerId?: string })[] = [];
    if (showInventory) {
      list = products.filter(p => user.unlockedItems && user.unlockedItems.includes(p.id));
    } else if (showResellShop) {
      list = resaleItems.map(r => {
        const product = products.find(p => p.id === r.itemId);
        return product ? { ...product, cost: r.price, resaleId: r.id, sellerId: r.sellerId } : null;
      }).filter(Boolean) as any[];

      if (resellSearch.trim()) {
        const s = resellSearch.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
      }
    } else {
      const pinned = products.filter(p => p.isPinned);
      const nonPinned = products.filter(p => !p.isPinned);
      
      const seed = activeVariantIndex;
      const shuffledNonPinned = [...nonPinned].sort((a, b) => {
          const valA = hashString(a.id + seed);
          const valB = hashString(b.id + seed);
          return valA - valB;
      });
      
      const limit = systemConfig.shopShuffleLimit ?? 5;
      list = [...pinned, ...shuffledNonPinned.slice(0, limit)];
    }
    return list;
  }, [products, user.unlockedItems, showInventory, showResellShop, resaleItems, resellSearch, activeVariantIndex, systemConfig.shopShuffleLimit]);

  const ownedItemsNotListed = useMemo(() => {
    const owned = products.filter(p => user.unlockedItems?.includes(p.id) && p.isResellable !== false);
    const listedIds = resaleItems.filter(r => r.sellerId === user.id).map(r => r.itemId);
    return owned.filter(p => !listedIds.includes(p.id));
  }, [products, user.unlockedItems, resaleItems, user.id]);

  const FIXED_BORDER_SCALE = 130;

  return (
    <div className="flex-1 bg-[#0f1012] flex flex-col h-full overflow-hidden animate-in fade-in duration-700 relative">
      <div className="h-16 border-b border-white/5 bg-[#0f1012]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-40 sticky top-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 text-muted hover:text-white hover:bg-white/5 rounded-2xl transition-all active:scale-90">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-accent text-2xl drop-shadow-[0_0_12px_rgba(var(--accent-color-rgb),0.4)]"><Icons.Shop /></span>
            <span className="font-black text-xs uppercase tracking-[0.4em] text-white/80 hidden sm:block">
              {showInventory ? rit('shop_tab_vault_small', 'INVENTORY') : showResellShop ? rit('shop_tab_resell_small', 'RESELL HUB') : rit('shop_tab_nebula_small', 'NEBULA')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
            <button 
              onClick={() => { setShowResellShop(!showResellShop); setShowInventory(false); }} 
              className={`p-2 rounded-xl transition-all active:scale-90 flex items-center gap-2 px-3 ${showResellShop ? 'bg-white text-black shadow-lg' : 'text-muted hover:text-white'}`}
            >
               <span className="text-[9px] font-black uppercase tracking-widest">{rit('shop_btn_resell_tab', 'Resell')}</span>
            </button>
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            <button 
              onClick={() => { setShowInventory(!showInventory); setShowResellShop(false); }} 
              className={`p-2 rounded-xl transition-all active:scale-90 flex items-center gap-2 px-3 ${showInventory ? 'bg-white text-black shadow-lg' : 'text-muted hover:text-white'}`}
            >
               <Icons.Inventory /><span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">{rit('shop_btn_vault_tab', 'INVENTORY')}</span>
            </button>
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            <div className="flex items-center gap-2 px-3">
               <Icons.Amethyst className="text-[#a855f7] w-3.5 h-3.5" />
               <span className="text-[10px] font-black text-white tracking-widest">{(user.shards || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-12 pb-32">
          <div className="text-center py-10 sm:py-16">
            <h1 className="text-4xl sm:text-7xl font-black uppercase tracking-tighter leading-none mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/20">
              {showInventory ? rit('shop_title_vault', 'THE INVENTORY') : showResellShop ? rit('shop_title_resell', 'RESELL HUB') : rit('shop_title_main', 'THE NEBULA')}
            </h1>
            <p className="text-muted text-sm sm:text-lg font-black max-w-xl mx-auto leading-tight opacity-50 uppercase tracking-widest">
              {showInventory ? rit('shop_subtitle_vault', 'Your rare galactic collection.') : showResellShop ? rit('shop_subtitle_resell', 'Peer-to-peer artifact exchange.') : rit('shop_subtitle_main', 'Discover legendary artifacts.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {showResellShop && (
              <div 
                onClick={() => setShowResaleSelection(true)}
                className="group relative cursor-pointer"
              >
                <div className="bg-white/5 rounded-[28px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center h-full min-h-[300px] transition-all hover:bg-white/[0.08] hover:border-accent/40 active:scale-95 shadow-xl">
                   <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-4xl font-black transition-transform group-hover:rotate-90 group-hover:scale-110 shadow-inner">
                      +
                   </div>
                   <p className="mt-6 text-[10px] font-black text-white uppercase tracking-[0.3em]">{rit('shop_list_artifact_btn', 'List Artifact')}</p>
                </div>
              </div>
            )}

            {displayedProducts.map(product => {
              const isUnlocked = user.unlockedItems && user.unlockedItems.includes(product.id);
              const isEquipped = product.isBanner ? user.equippedBannerId === product.id : user.equippedAuraId === product.id;
              const canAfford = (user.shards || 0) >= product.cost;
              
              const isResale = (product as any).resaleId;
              const isMyResale = isResale && (product as any).sellerId === user.id;

              let currentIcon = product.icon;
              if (product.variants && product.variants.length > 0) {
                 currentIcon = user.purchasedArtifactIcons?.[product.id] || product.variants[activeVariantIndex % product.variants.length];
              }

              return (
                <div key={isResale ? (product as any).resaleId : product.id} className="bg-[#161719] rounded-[28px] border border-white/5 flex flex-col h-full overflow-hidden relative shadow-xl transition-all duration-500 hover:-translate-y-2 group">
                  <div className="h-48 bg-black/40 flex items-center justify-center relative overflow-hidden">
                    <div className={`absolute top-4 left-4 z-10 px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md ${product.rarityColor || 'bg-white/10'}`}>
                      {product.rarity}
                    </div>
                    {product.isAura ? (
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-28 h-28 z-10 flex items-center justify-center" style={{ transform: `scale(${FIXED_BORDER_SCALE/100})` }}>
                           {(!currentIcon || currentIcon.length <= 10) ? <div className="w-28 h-28 rounded-full border-[3px] flex items-center justify-center" style={{ borderColor: isEquipped ? user.iconBorderColor : selectedBorderColor }} /> : <div className="w-full h-full" style={{ background: `url(${currentIcon}) center/contain no-repeat` }} />}
                        </div>
                        <img src={user.avatarUrl || 'https://via.placeholder.com/150'} className="w-28 h-28 object-cover rounded-full opacity-40 shadow-inner" />
                      </div>
                    ) : product.isBanner ? (
                      <div className="w-full h-full relative group/banner">
                        <img src={currentIcon} className="w-full h-full object-cover transition-transform group-hover/banner:scale-110 duration-700" alt={product.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      </div>
                    ) : (
                      <div className="w-32 h-32 flex items-center justify-center">
                        {currentIcon && currentIcon.length > 10 ? <img src={currentIcon} className="w-full h-full object-contain" /> : <span className="text-6xl">{currentIcon || '✨'}</span>}
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                       <div className="min-w-0">
                          <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight truncate">{product.name}</h3>
                          <p className="text-[8px] font-black text-muted uppercase tracking-widest opacity-60 mt-1">
                            {isResale ? rit('shop_type_resale', 'Resale Listing') : product.activationType === 'always-active' ? 'Always Active' : 'Equippable'}
                          </p>
                       </div>
                    </div>
                    <p className="text-neutral-300 text-xs leading-snug mb-6 opacity-80 line-clamp-2">{product.description}</p>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                         <Icons.Amethyst className="text-[#a855f7] w-4 h-4" />
                         <span className="text-lg font-black text-white tracking-tighter">{(product.cost || 0).toLocaleString()}</span>
                      </div>
                      {isUnlocked && !isResale ? (
                        <div className="flex items-center gap-2">
                          {product.isResellable !== false && showInventory && (
                             <button onClick={() => setResellModalItem(product)} className="px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-white/10 text-muted hover:text-white active:scale-95 transition-all">Resell</button>
                          )}
                          <button onClick={() => onEquip(isEquipped ? null : product.id, product.isBanner ? 'banner' : 'aura')} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border transition-all ${isEquipped ? 'bg-white text-black border-white' : 'bg-transparent border-white/20 text-white hover:bg-white/5'}`}>
                             {isEquipped ? 'Unequip' : 'Equip'}
                          </button>
                        </div>
                      ) : isMyResale ? (
                         <button onClick={() => onUnlistResale((product as any).resaleId)} className="px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95">Unlist</button>
                      ) : (
                         <button onClick={() => isResale ? onResalePurchase((product as any).resaleId) : onPurchase(product.id, product.cost)} disabled={!canAfford || (isResale && isMyResale)} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border transition-all ${canAfford ? 'bg-accent border-accent text-black hover:scale-105 active:scale-95' : 'bg-white/5 border-white/5 text-neutral-600 opacity-50 cursor-not-allowed'}`}>
                            {canAfford ? 'Acquire' : 'Locked'}
                         </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showResaleSelection && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in" onClick={() => setShowResaleSelection(false)}>
           <div className="bg-[#161719] border border-white/10 rounded-[40px] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-6">{rit('shop_sel_resale_title', 'Select Artifact to Resell')}</h3>
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                 {ownedItemsNotListed.length === 0 ? (
                   <div className="text-center py-20 opacity-20 border-2 border-dashed border-white/10 rounded-[32px]"><p className="text-[11px] font-black uppercase tracking-widest">No available artifacts to resell</p></div>
                 ) : (
                   ownedItemsNotListed.map(p => (
                     <div key={p.id} onClick={() => { setResellModalItem(p); setShowResaleSelection(false); }} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-2xl cursor-pointer transition-all active:scale-[0.98] group">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-tertiary border border-white/10 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                              {p.icon && p.icon.length > 10 ? <img src={p.icon} className="w-full h-full object-cover" /> : <span className="text-2xl">{p.icon || '✨'}</span>}
                           </div>
                           <div>
                              <p className="text-xs font-black text-white uppercase tracking-tight">{p.name}</p>
                              <p className="text-[8px] text-muted font-bold uppercase tracking-widest opacity-40">{p.rarity} Artifact</p>
                           </div>
                        </div>
                        <div className="text-[10px] font-black text-accent opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Select</div>
                     </div>
                   ))
                 )}
              </div>
              <button onClick={() => setShowResaleSelection(false)} className="mt-8 w-full py-4 rounded-2xl bg-white/5 text-muted hover:text-white font-black text-[10px] uppercase tracking-widest transition-all">Cancel</button>
           </div>
        </div>
      )}

      {resellModalItem && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in" onClick={() => setResellModalItem(null)}>
           <div className="bg-[#161719] border border-white/10 rounded-[40px] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Relist Artifact</h3>
              <p className="text-[9px] text-muted font-bold uppercase tracking-widest mb-6 opacity-60">Set your exchange price in Shards</p>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2 opacity-50 ml-1">Market Price</label>
                    <div className="relative">
                       <Icons.Amethyst className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
                       <input type="number" value={resellPriceInput} onChange={e => setResellPriceInput(parseInt(e.target.value) || 0)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-12 text-lg font-black text-white outline-none focus:ring-1 focus:ring-accent" />
                    </div>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[8px] font-black text-muted uppercase tracking-widest opacity-40">Profit Distribution</p>
                    <div className="flex justify-between text-[10px] font-bold"><span className="text-white/60">You ({sellerProfitPct}%)</span><span className="text-emerald-400">+{Math.floor(resellPriceInput * (sellerProfitPct / 100))}</span></div>
                    <div className="flex justify-between text-[10px] font-bold"><span className="text-white/60">Creator ({creatorProfitPct}%)</span><span className="text-purple-400">+{Math.floor(resellPriceInput * (creatorProfitPct / 100))}</span></div>
                    <div className="flex justify-between text-[10px] font-bold"><span className="text-white/60">Node ({nebulaProfitPct}%)</span><span className="text-amber-400">+{Math.floor(resellPriceInput * (nebulaProfitPct / 100))}</span></div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setResellModalItem(null)} className="flex-1 bg-white/5 text-muted hover:text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest transition-all">Cancel</button>
                    <button onClick={() => { onListForResale(resellModalItem.id, resellPriceInput); setResellModalItem(null); }} className="flex-1 bg-accent text-black font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-accent/20 transition-all hover:brightness-110 active:scale-95">Relist</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="p-4 bg-black/60 border-t border-white/5 flex flex-col items-center justify-center gap-1 shrink-0 z-40 backdrop-blur-xl">
         <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" /><span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Reshuffle In</span></div>
         <span className="text-lg font-black text-accent tracking-widest font-mono">{timeToReset}</span>
      </div>
    </div>
  );
};
