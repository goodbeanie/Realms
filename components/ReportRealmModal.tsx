
import React, { useState } from 'react';
import { Realm } from '../types';

interface ReportRealmModalProps {
  realm: Realm;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const REPORT_REASONS = [
  'Inappropriate Name',
  'Inappropriate Icon',
  'Inappropriate Bio',
  'Suspicious Activity',
  'Impersonation',
  'Hate Speech',
  'Harassment or Bullying',
  'Self-harm or Violence',
  'Spamming',
];

export const ReportRealmModal: React.FC<ReportRealmModalProps> = ({ realm, onClose, onSubmit }) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReason) {
      onSubmit(selectedReason);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[#313338] w-full max-w-sm rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight text-center">Report Community</h2>
          <p className="text-neutral-400 text-[11px] text-center mb-6 px-4">Our AI will review this Realm based on your selection. Suspicious or inappropriate content is automatically removed.</p>
          
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-xs font-bold uppercase tracking-tight flex items-center justify-between group ${
                  selectedReason === reason 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                    : 'bg-white/5 border-white/5 text-muted hover:bg-white/10 hover:text-white'
                }`}
              >
                {reason}
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${selectedReason === reason ? 'bg-red-500 border-red-500' : 'border-white/10'}`}>
                  {selectedReason === reason && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#2b2d31] p-4 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 text-white hover:underline px-4 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!selectedReason}
            className="flex-1 bg-red-500 text-white font-black disabled:opacity-30 px-6 py-3 rounded-xl transition-all hover:brightness-110 uppercase text-[11px] tracking-widest shadow-xl shadow-red-500/20 active:scale-95"
          >
            Submit Report
          </button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};
