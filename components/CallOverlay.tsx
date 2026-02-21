
import React, { useEffect, useRef, useState } from 'react';
import { User, ShopItem } from '../types';
import { MediaConnection } from 'peerjs';

interface CallOverlayProps {
  call: {
    connection: MediaConnection | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isIncoming: boolean;
    remoteUser: User;
    isVideo: boolean;
    isScreenSharing: boolean;
    status: 'connecting' | 'connected' | 'failed';
    error?: string;
  };
  currentUser: User;
  shopItems: ShopItem[];
  onAnswer: (isVideo: boolean) => void;
  onEnd: () => void;
  onToggleScreenShare: () => void;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({ call, currentUser, shopItems, onAnswer, onEnd, onToggleScreenShare }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(call.isVideo);
  const [answered, setAnswered] = useState(false);
  
  const [remoteCameraActive, setRemoteCameraActive] = useState(false);
  const [localMicLevel, setLocalMicLevel] = useState(0);
  const [remoteMicLevel, setRemoteMicLevel] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    let audioCtx: AudioContext | null = null;
    
    const setupAnalyser = (stream: MediaStream, callback: (val: number) => void) => {
      try {
        const tracks = stream.getAudioTracks();
        if (tracks.length === 0) return;

        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 64;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const update = () => {
          if (!analyser || audioCtx?.state === 'closed') return;
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          callback(average);
          animationFrame = requestAnimationFrame(update);
        };
        update();
      } catch (e) {
        console.warn("Audio Context setup failed", e);
      }
    };

    if (call.localStream) setupAnalyser(call.localStream, setLocalMicLevel);
    return () => {
      cancelAnimationFrame(animationFrame);
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [call.localStream]);

  useEffect(() => {
    let animationFrame: number;
    let audioCtx: AudioContext | null = null;

    if (call.remoteStream) {
      const setupAnalyser = (stream: MediaStream, callback: (val: number) => void) => {
        try {
          const tracks = stream.getAudioTracks();
          if (tracks.length === 0) return;
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioCtx.createAnalyser();
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 64;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const update = () => {
            if (!analyser || audioCtx?.state === 'closed') return;
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            callback(average);
            animationFrame = requestAnimationFrame(update);
          };
          update();
        } catch (e) {
          console.warn("Remote Audio Context setup failed", e);
        }
      };
      setupAnalyser(call.remoteStream, setRemoteMicLevel);
    }
    return () => {
      cancelAnimationFrame(animationFrame);
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [call.remoteStream]);

  useEffect(() => {
    if (remoteVideoRef.current && call.remoteStream) {
      if (remoteVideoRef.current.srcObject !== call.remoteStream) {
        remoteVideoRef.current.srcObject = call.remoteStream;
      }
      remoteVideoRef.current.play().catch(e => console.warn("Remote play failed", e));
    }
  }, [call.remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && call.localStream) {
      if (localVideoRef.current.srcObject !== call.localStream) {
        localVideoRef.current.srcObject = call.localStream;
      }
      localVideoRef.current.play().catch(e => console.warn("Local play failed", e));
    }
  }, [call.localStream, videoEnabled, call.isScreenSharing]);

  useEffect(() => {
    if (!call.remoteStream) return;
    const checkTracks = () => {
      const vt = call.remoteStream?.getVideoTracks() || [];
      setRemoteCameraActive(vt.length > 0 && vt.some(t => t.enabled && t.readyState === 'live'));
    };
    checkTracks();
    const interval = setInterval(checkTracks, 1000);
    return () => clearInterval(interval);
  }, [call.remoteStream]);

  const toggleMic = () => {
    const newState = !micEnabled;
    if (call.localStream) {
      call.localStream.getAudioTracks().forEach(track => { track.enabled = newState; });
    }
    setMicEnabled(newState);
  };

  const toggleVideo = () => {
    const newState = !videoEnabled;
    if (call.localStream) {
      call.localStream.getVideoTracks().forEach(track => { track.enabled = newState; });
    }
    setVideoEnabled(newState);
  };

  const handleAnswerClick = (video: boolean) => {
    setAnswered(true);
    onAnswer(video);
  };

  const renderPlaceholder = (user: User | undefined, micLevel: number, label: string) => {
    if (!user) return null;
    const aura = shopItems.find(p => p.id === user.equippedAuraId);
    const hasCustomAura = aura?.isAura && aura.icon && aura.icon.length > 10;
    const hasStandardRing = aura?.isAura && (!aura.icon || aura.icon.length <= 10);
    const ringColor = user.iconBorderColor || '#ffffff';
    const ringScale = 130; // Icon borders always scale at 130%
    const isSpeaking = micLevel > 12;

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1b1e] to-[#0f1012] overflow-hidden z-10">
        <div className="relative flex items-center justify-center">
          {isSpeaking && (
            <>
              <div className="speaking-aura" style={{ animationDuration: '1.2s' }} />
              <div className="speaking-aura" style={{ animationDelay: '0.4s', animationDuration: '1.2s', opacity: 0.25 }} />
              <div className="speaking-aura" style={{ animationDelay: '0.8s', animationDuration: '1.2s', opacity: 0.1 }} />
            </>
          )}
          <div 
            className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#1e1f22] flex items-center justify-center relative transition-all duration-300 z-20 shadow-2xl ${isSpeaking ? 'scale-110' : 'scale-100'}`}
            style={{ 
              border: hasStandardRing ? `4px solid ${ringColor}` : 'none',
              padding: hasStandardRing ? '4px' : '0px',
              boxShadow: isSpeaking ? `0 0 50px rgba(var(--accent-color-rgb), 0.4)` : '0 10px 40px rgba(0,0,0,0.4)'
            }}
          >
            {hasCustomAura && (
               <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center" style={{ transform: `scale(${ringScale/100})` }}>
                  <div className="w-full h-full" style={{ background: `url(${aura.icon}) center/contain no-repeat` }} />
               </div>
            )}
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-tertiary relative z-10 border border-white/5">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} className="w-full h-full object-cover" alt={user.displayName} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl sm:text-4xl font-black text-white/10 uppercase">{user.displayName?.[0] || '?'}</div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 sm:mt-12 flex flex-col items-center gap-3 px-4 text-center">
           <p className={`text-[9px] font-black uppercase tracking-[0.5em] transition-all duration-500 ${isSpeaking ? 'text-accent opacity-100' : 'text-white/40 opacity-50'}`}>{isSpeaking ? 'TRANSMITTING' : label}</p>
           <div className={`flex gap-1.5 items-end justify-center h-4 transition-all duration-500 ${isSpeaking ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
              {[1,2,3,4,5].map(i => <div key={i} className="w-1 bg-accent rounded-full animate-bounce" style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.1}s`, animationDuration: '0.6s' }} />)}
           </div>
        </div>
      </div>
    );
  };

  if (!call.remoteUser) return null;

  if (call.status === 'failed') {
    return (
      <div className="absolute inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <div className="bg-[#1e1f22] border border-red-500/20 rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-300 w-full max-w-[360px] text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-500"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Signal Lost</h3>
            <p className="text-[10px] text-red-400 font-black uppercase tracking-[0.4em] mt-2">{call.error || "Target Frequency Unavailable"}</p>
          </div>
          <button onClick={onEnd} className="w-full bg-red-500 text-white font-black py-4 rounded-2xl uppercase text-[11px] tracking-widest hover:brightness-110 shadow-xl shadow-red-500/20 transition-all active:scale-95">Disconnect</button>
        </div>
      </div>
    );
  }

  if (call.isIncoming && call.status === 'connecting' && !answered) {
    return (
      <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <div className="bg-[#1e1f22] border border-white/10 rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-300 w-full max-w-[360px] ring-4 ring-black/50 text-center space-y-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full border-4 border-accent shadow-[0_0_30px_rgba(var(--accent-color-rgb),0.3)] overflow-hidden relative mx-auto">
               {call.remoteUser.avatarUrl ? <img src={call.remoteUser.avatarUrl} className="w-full h-full object-cover" alt={call.remoteUser.displayName} /> : <div className="w-full h-full bg-secondary flex items-center justify-center font-black text-white/20 text-2xl uppercase">{(call.remoteUser.displayName || '?')[0]}</div>}
            </div>
            <div className="absolute -inset-2 border-2 border-accent/20 animate-ping rounded-full pointer-events-none" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{call.remoteUser.displayName}</h3>
            <p className="text-[10px] text-accent font-black uppercase tracking-[0.4em] animate-pulse">Incoming Frequency Link</p>
          </div>
          <div className="flex gap-4">
            <button onClick={onEnd} className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 font-black py-4 rounded-2xl uppercase text-[11px] tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95">Reject</button>
            <button onClick={() => handleAnswerClick(true)} className="flex-1 bg-accent text-black font-black py-4 rounded-2xl uppercase text-[11px] tracking-widest hover:brightness-110 shadow-xl shadow-accent/20 transition-all active:scale-95">Connect</button>
          </div>
        </div>
      </div>
    );
  }

  const remoteDisplayingMedia = remoteCameraActive || (call.status === 'connected' && call.isScreenSharing);
  const localDisplayingMedia = videoEnabled && call.localStream && call.localStream.getVideoTracks().some(t => t.enabled && t.readyState === 'live');

  return (
    <div className="w-full h-full bg-sidebar flex flex-col overflow-hidden relative animate-in slide-in-from-right">
      <div className="flex items-center justify-between p-4 bg-black/40 border-b border-white/5 backdrop-blur-xl shrink-0">
         <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
               {call.remoteUser.avatarUrl ? <img src={call.remoteUser.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-tertiary flex items-center justify-center font-black text-white/20 text-xs">{(call.remoteUser.displayName || '?')[0]}</div>}
            </div>
            <p className="text-xs font-black text-white uppercase tracking-wider truncate">{call.remoteUser.displayName}</p>
         </div>
         <div className={`flex items-center gap-1.5 px-2.5 py-1 ${call.status === 'connected' ? 'bg-green-500/10 border-green-500/20' : 'bg-amber-500/10 border-amber-500/20'} rounded-full shrink-0`}>
            <div className={`w-1.5 h-1.5 rounded-full ${call.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
            <span className={`text-[8px] font-black ${call.status === 'connected' ? 'text-green-400' : 'text-amber-400'} uppercase tracking-widest`}>{call.status === 'connected' ? 'Linked' : 'Ringing'}</span>
         </div>
      </div>

      <div className="flex-1 flex flex-col bg-black/20 p-4 space-y-4 overflow-y-auto no-scrollbar">
        <div className="flex-1 rounded-[32px] bg-[#161719] border border-white/5 overflow-hidden relative shadow-inner group flex flex-col min-h-[220px]">
          <video ref={remoteVideoRef} autoPlay playsInline className={`w-full h-full object-cover ${!remoteDisplayingMedia ? 'hidden' : ''}`} />
          {!remoteDisplayingMedia && renderPlaceholder(call.remoteUser, remoteMicLevel, call.status === 'connected' ? 'SIGNAL PAUSED' : 'CONNECTING...')}
          
          {remoteMicLevel > 12 && remoteDisplayingMedia && (
            <div className="absolute top-4 right-4 flex gap-1 items-end h-4 pointer-events-none bg-black/40 px-2 py-1 rounded-lg backdrop-blur-md border border-white/5 z-20">
              {[1,2,3].map(i => <div key={i} className="w-1 bg-accent rounded-full animate-bounce" style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.1}s` }} />)}
            </div>
          )}

          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/5 z-20">
             <p className="text-[10px] font-black text-white uppercase tracking-wider truncate max-w-[120px]">{call.remoteUser.displayName}</p>
          </div>
        </div>

        <div className="flex-1 rounded-[32px] bg-[#161719] border border-white/5 overflow-hidden relative shadow-inner group flex flex-col min-h-[220px]">
          <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${call.isScreenSharing ? '' : '-scale-x-100'} ${!localDisplayingMedia ? 'hidden' : ''}`} />
          {!localDisplayingMedia && renderPlaceholder(currentUser, localMicLevel, 'YOU')}
          
          {localMicLevel > 12 && localDisplayingMedia && (
            <div className="absolute top-4 right-4 flex gap-1 items-end h-4 pointer-events-none bg-black/40 px-2 py-1 rounded-lg backdrop-blur-md border border-white/5 z-20">
              {[1,2,3].map(i => <div key={i} className="w-1 bg-accent rounded-full animate-bounce" style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.1}s` }} />)}
            </div>
          )}

          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/5 z-20">
             <p className="text-[10px] font-black text-white uppercase tracking-wider">You</p>
          </div>
        </div>
      </div>

      <div className="bg-black/40 border-t border-white/5 p-6 backdrop-blur-xl shrink-0 pb-safe">
        <div className="flex items-center justify-center gap-4">
          <button onClick={toggleMic} className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-90 border ${micEnabled ? 'bg-white/5 hover:bg-white/10 text-white border-white/5' : 'bg-red-500/20 text-red-500 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}>
             {micEnabled ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
          </button>
          
          <button onClick={onEnd} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-red-500 text-white shadow-xl shadow-red-500/30 active:scale-95 transition-all">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path><line x1="23" y1="1" x2="1" y2="23"></line></svg>
          </button>

          <button onClick={toggleVideo} className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-90 border ${videoEnabled ? 'bg-white/5 hover:bg-white/10 text-white border-white/5' : 'bg-red-500/20 text-red-500 border-red-500/30'}`}>
             {videoEnabled ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m16 16 3 3 3-3"/><path d="m16 8 3-3 3 3"/><path d="M1 5h12c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H1c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2Z"/><path d="m2 2 20 20"/></svg>}
          </button>

          <button onClick={onToggleScreenShare} className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-90 border ${call.isScreenSharing ? 'bg-accent text-black border-accent' : 'bg-white/5 hover:bg-white/10 text-white border-white/5'}`}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
