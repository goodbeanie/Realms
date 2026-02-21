import React, { useState, useRef } from 'react';
import { Realm } from '../types';

interface RealmSettingsModalProps {
  realm: Realm;
  onClose: () => void;
  onUpdate: (realmId: string, updates: Partial<Realm>) => void;
}

export const RealmSettingsModal: React.FC<RealmSettingsModalProps> = ({ realm, onClose, onUpdate }) => {
  const [name, setName] = useState(realm.name);
  const [bio, setBio] = useState(realm.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(realm.avatarUrl || '');
  const [bannerColor, setBannerColor] = useState(realm.bannerColor || '#5865f2');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdate(realm.id, {
      name,
      bio,
      avatarUrl,
      bannerColor,
      initials: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-[#1e1f22] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-white/5 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-40 flex items-center justify-center" style={{ backgroundColor: bannerColor }}>
          <input 
            type="color" 
            value={bannerColor} 
            onChange={(e) => setBannerColor(e.target.value)} 
            className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-black/20 border-2 border-white/20 cursor-pointer overflow-hidden p-0" 
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-3xl bg-secondary border-4 border-[#1e1f22] shadow-2xl flex items-center justify-center overflow-hidden cursor-pointer hover:brightness-110 transition-all group"
          >
            {avatarUrl ? (
              <img src={avatarUrl} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-white">{realm.initials}</span>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-white font-black uppercase">Edit</span>
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
          <button onClick={onClose} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/40 transition-all">✕</button>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">Realm Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Community Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#313338] border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-accent transition-all font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Realm Bio</label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Describe your community..."
                className="w-full bg-[#313338] border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-accent transition-all resize-none font-medium text-sm"
              />
            </div>
            
            <div className="pt-4 flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 bg-accent text-black font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-accent/10 hover:brightness-110 active:scale-95 transition-all"
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