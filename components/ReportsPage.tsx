
import React from 'react';
import { Report } from '../types';

interface ReportsPageProps {
  reports: Report[];
  onResolve: (id: string) => void;
  onBan: (realmId: string, reportId: string) => void;
  onCleanUp: () => void;
  onBack: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ reports, onResolve, onBan, onCleanUp, onBack }) => {
  const pendingReports = reports.filter(r => r.status === 'pending');

  return (
    <div className="flex-1 bg-chat p-4 sm:p-8 text-center overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between max-w-4xl mx-auto mb-10">
        <button onClick={onBack} className="p-2 text-muted hover:text-primary bg-white/5 rounded-lg transition-all">← Back</button>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-black uppercase tracking-tighter text-primary">Realm Reports</h2>
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Manual review for @beanie and @realms</p>
        </div>
        <button 
          onClick={onCleanUp}
          disabled={pendingReports.length === 0}
          className="bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-20"
        >
          Clean Up
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.3em] text-left px-2 mb-4 opacity-50">
            Pending Review — {pendingReports.length}
          </h3>
          
          {pendingReports.length === 0 ? (
            <div className="bg-secondary/40 border border-dashed border-subtle p-20 rounded-3xl text-center">
              <p className="text-muted text-sm font-medium italic">No reports pending review.</p>
            </div>
          ) : (
            pendingReports.map(r => (
              <div key={r.id} className="bg-secondary p-6 rounded-3xl text-left border border-subtle shadow-xl space-y-6 animate-in fade-in slide-in-from-top-1">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    {/* Display the reported Icon */}
                    {r.realmAvatarUrl ? (
                      <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 shrink-0 ${r.reason === 'Inappropriate Icon' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse' : 'border-white/10'}`}>
                        <img src={r.realmAvatarUrl} className="w-full h-full object-cover" alt="Reported Realm Icon" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-tertiary flex items-center justify-center text-xl font-black text-white/20 border border-white/5 shrink-0">
                        ?
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-black text-white uppercase tracking-tight leading-tight">{r.realmName}</h4>
                      <p className="text-[10px] text-muted font-mono mt-1">ID: {r.realmId}</p>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    r.aiClassification === 'INAPPROPRIATE' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                    r.aiClassification === 'UNSURE' ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' :
                    'bg-green-500/20 text-green-400 border-green-500/20'
                  }`}>
                    AI: {r.aiClassification}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-tertiary/40 p-4 rounded-2xl border border-white/5">
                      <label className="text-[9px] font-black text-muted uppercase tracking-widest block mb-2">Reporter claim</label>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${r.reason === 'Inappropriate Icon' ? 'bg-red-500 text-white' : 'bg-white/10 text-muted'}`}>
                          {r.reason}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white/80 leading-relaxed">Reported by {r.reporterName}</p>
                   </div>
                   <div className="bg-tertiary/40 p-4 rounded-2xl border border-white/5">
                      <label className="text-[9px] font-black text-muted uppercase tracking-widest block mb-2">AI Analysis</label>
                      <p className="text-sm font-medium text-white/80 leading-relaxed">{r.aiAnalysis}</p>
                   </div>
                </div>

                {/* Larger Preview for Icon Reports */}
                {r.reason === 'Inappropriate Icon' && r.realmAvatarUrl && (
                  <div className="bg-tertiary/20 p-4 rounded-2xl border border-red-500/10">
                    <label className="text-[9px] font-black text-red-400 uppercase tracking-widest block mb-3">Enlarged Icon Preview</label>
                    <div className="flex justify-center">
                      <img src={r.realmAvatarUrl} className="max-w-[200px] max-h-[200px] rounded-3xl border-2 border-red-500 shadow-2xl" alt="Large Icon Preview" />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                  <button onClick={() => onResolve(r.id)} className="bg-white/5 text-muted hover:text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Dismiss</button>
                  <button onClick={() => onBan(r.realmId, r.id)} className="bg-red-500 text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-lg shadow-red-500/20 transition-all">Ban Community</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
