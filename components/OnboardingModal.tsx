
import React, { useState } from 'react';
import { Realm, OnboardingQuestion } from '../types';

interface OnboardingModalProps {
  realm: Realm;
  onFinish: (answers: Record<string, string>) => void;
  onCancel: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ realm, onFinish, onCancel }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const questions = realm.onboarding || [];
  
  const handleAnswer = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const isComplete = questions.every(q => !q.required || (answers[q.id] && answers[q.id].trim().length > 0));

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#313338] w-full max-w-md rounded-3xl shadow-2xl border border-white/5 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center border-b border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto mb-4 text-2xl">✨</div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Welcome to {realm.name}</h2>
          <p className="text-muted text-sm mt-2">Just a few quick questions before you join our community.</p>
        </div>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-3">
              <label className="block text-[10px] font-black text-muted uppercase tracking-widest ml-1">
                Question #{idx + 1} {q.required && <span className="text-red-400">*</span>}
              </label>
              <p className="text-sm font-bold text-white leading-tight mb-2">{q.question}</p>
              <textarea 
                value={answers[q.id] || ''} 
                onChange={(e) => handleAnswer(q.id, e.target.value)}
                className="w-full bg-[#1e1f22] rounded-xl p-4 border border-white/5 outline-none text-sm font-medium focus:ring-2 focus:ring-accent transition-all min-h-[80px]"
                placeholder="Type your answer here..."
              />
            </div>
          ))}
        </div>

        <div className="bg-[#2b2d31] p-6 flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 text-white hover:underline text-[11px] font-black uppercase tracking-widest opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={() => onFinish(answers)}
            disabled={!isComplete}
            className="flex-[2] bg-accent text-black font-black py-4 rounded-xl text-[11px] uppercase tracking-widest shadow-xl shadow-accent/10 disabled:opacity-30 transition-all active:scale-95"
          >
            Finish & Join
          </button>
        </div>
      </div>
    </div>
  );
};
