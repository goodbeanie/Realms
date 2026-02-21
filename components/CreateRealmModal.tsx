import React, { useState, useRef } from 'react';
import { Icons } from '../constants';

interface CreateRealmModalProps {
  onClose: () => void;
  onCreate: (name: string, avatarUrl?: string) => void;
  renderInteractiveText?: (id: string, defaultText: string, className?: string) => React.ReactNode;
}

export const CreateRealmModal: React.FC<CreateRealmModalProps> = ({ onClose, onCreate, renderInteractiveText }) => {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const rit = renderInteractiveText || ((id, def) => def);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), avatarUrl || undefined);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 p-4" onClick={onClose}>
      <div 
        className="bg-[#161719] w-full max-w-md rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">{rit('create_realm_title', 'Create Realm')}</h2>
          <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{rit('create_realm_sub', 'Establish a new community frequency')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="flex flex-col items-center">
            <div 
              className="w-24 h-24 rounded-[32px] bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-accent hover:text-accent transition-all group relative overflow-hidden shadow-inner"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Realm Icon" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
              ) : (
                <div className="text-muted group-hover:text-accent flex flex-col items-center gap-1 transition-colors">
                   <Icons.Plus />
                   <span className="text-[9px] font-black uppercase tracking-widest mt-1">{rit('create_realm_upload', 'Upload Icon')}</span>
                </div>
              )}
              {avatarUrl && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">{rit('create_realm_change', 'Change')}</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-muted uppercase mb-3 tracking-widest ml-1 opacity-50 text-center">{rit('create_realm_label', 'Realm Name')}</label>
            <input 
              autoFocus
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={rit('create_realm_placeholder', 'e.g. Project Aurora') as string}
              required
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-accent transition-all text-center font-black placeholder:opacity-20 shadow-inner"
            />
          </div>
        </form>

        <div className="bg-black/20 p-6 flex gap-4 border-t border-white/5">
          <button 
            onClick={onClose}
            className="flex-1 text-white hover:underline px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100 transition-all"
          >
            {rit('create_realm_cancel', 'Cancel')}
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex-[2] bg-accent text-black font-black disabled:opacity-30 disabled:scale-95 px-6 py-4 rounded-2xl uppercase text-[11px] tracking-widest shadow-xl shadow-accent/20 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            {rit('create_realm_btn', 'Create Realm')}
          </button>
        </div>
      </div>
    </div>
  );
};