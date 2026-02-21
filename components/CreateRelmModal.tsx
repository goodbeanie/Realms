
import React, { useState, useRef } from 'react';

interface CreateRelmModalProps {
  onClose: () => void;
  onCreate: (name: string, avatarUrl?: string) => void;
}

export const CreateRelmModal: React.FC<CreateRelmModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#313338] w-full max-w-md rounded-lg shadow-2xl border border-white/5 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Customize your Relm</h2>
          <p className="text-neutral-400 text-sm">Give your new Relm a personality with a name and an icon. You can always change it later.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex flex-col items-center">
            <div 
              className="w-20 h-20 rounded-full bg-[#4a4d53] border-2 border-dashed border-neutral-500 flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors group relative overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Relm Icon" className="w-full h-full object-cover" />
              ) : (
                <div className="text-neutral-400 group-hover:text-indigo-400 flex flex-col items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                   <span className="text-[10px] font-bold uppercase mt-1">Upload</span>
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
            <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Relm Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name"
              required
              className="w-full bg-[#1e1f22] border-none rounded p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </form>

        <div className="bg-[#2b2d31] p-4 flex flex-row-reverse gap-3">
          <button 
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-medium transition-colors"
          >
            Create
          </button>
          <button 
            onClick={onClose}
            className="text-white hover:underline px-4 py-2"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};
