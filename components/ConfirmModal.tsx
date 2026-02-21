import React from 'react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  title, 
  message, 
  confirmLabel, 
  onConfirm, 
  onCancel 
}) => {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onCancel}>
      <div 
        className="bg-[#313338] w-full max-w-sm rounded-lg shadow-2xl border border-white/5 overflow-hidden animate-in zoom-in-95 duration-200 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
          <p className="text-neutral-400 text-sm leading-relaxed">{message}</p>
        </div>

        <div className="bg-[#2b2d31] p-4 flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 text-white hover:underline px-4 py-2 border border-white/10 rounded"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded font-bold transition-colors shadow-lg"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};