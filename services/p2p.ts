import Peer, { MediaConnection } from 'peerjs';
import { GlobalStore } from '../types';

type SyncCallback = (newStore: GlobalStore) => void;
type ErrorCallback = (err: any) => void;

class P2PSyncService {
  public peer: Peer | null = null;
  private connections: Set<any> = new Set();
  private onSync: SyncCallback | null = null;
  private onIncomingCall: ((call: MediaConnection) => void) | null = null;
  private onError: ErrorCallback | null = null;
  private currentStore: GlobalStore | null = null;
  private myId: string | null = null;
  private reconnectInterval: any = null;
  private isReconnecting = false;
  private lastInitTime = 0;
  private heartbeatInterval: any = null;

  public init(userId: string) {
    const now = Date.now();
    // Throttle init calls to prevent spamming server connections
    if (now - this.lastInitTime < 5000) return;
    
    // Safety check: Don't re-init if already open and bound to this user
    if (this.peer && !this.peer.destroyed && this.peer.open && this.myId === userId) return;

    this.myId = userId;
    this.lastInitTime = now;
    this.cleanup();
    
    console.log('P2P: Initializing signaling node...', userId);
    
    try {
      this.peer = new Peer(userId, { 
        debug: 1, 
        secure: true,
        config: {
          'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }],
          'sdpSemantics': 'unified-plan'
        }
      });
      this.setupPeerListeners();
      this.startHeartbeat();
    } catch (e) {
      console.warn("P2P: Initialization critical failure", e);
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (this.peer && this.peer.disconnected && !this.peer.destroyed) {
        console.log("P2P Heartbeat: Server link idle, reconnecting socket...");
        this.peer.reconnect();
      }
    }, 15000); // 15s heartbeat for cloud server
  }

  public isPeerReady(): boolean {
    return !!(this.peer && !this.peer.disconnected && !this.peer.destroyed && this.peer.open);
  }

  private setupPeerListeners() {
    if (!this.peer) return;

    this.peer.on('open', (id: string) => {
      console.log('P2P: Signal node active:', id);
      this.isReconnecting = false;
    });

    this.peer.on('connection', (conn: any) => {
      this.setupConnection(conn);
    });

    this.peer.on('call', (call: MediaConnection) => {
      if (this.onIncomingCall) this.onIncomingCall(call);
    });

    this.peer.on('disconnected', () => {
      console.warn('P2P: Signaling socket disconnected.');
      // Reconnect immediately on server-side disconnects
      if (!this.peer?.destroyed) {
        this.peer?.reconnect();
      }
    });

    this.peer.on('error', (err: any) => {
      console.error('P2P Signal Alert:', err.type, err);

      if (err.type === 'peer-unavailable') {
        if (this.onError) this.onError(err);
        return;
      }

      // Handle socket or server errors by attempting a recovery
      if (['network', 'server-error', 'socket-error'].includes(err.type)) {
        this.attemptRecovery();
      }
      
      if (this.onError) this.onError(err);
    });
  }

  private attemptRecovery() {
    if (this.isReconnecting || !this.myId) return;
    this.isReconnecting = true;
    
    console.log('P2P: Initiating signal recovery protocol...');
    
    if (this.reconnectInterval) clearInterval(this.reconnectInterval);

    this.reconnectInterval = setInterval(() => {
      if (this.isPeerReady()) {
        console.log("P2P: Recovery successful.");
        this.isReconnecting = false;
        clearInterval(this.reconnectInterval);
        return;
      }
      
      if (this.peer && !this.peer.destroyed) {
        this.peer.reconnect();
      } else if (this.myId) {
        this.init(this.myId);
      }
    }, 10000);
  }

  private cleanup() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.reconnectInterval) clearInterval(this.reconnectInterval);
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (e) {}
      this.peer = null;
    }
    this.connections.clear();
  }

  public setOnIncomingCall(callback: (call: MediaConnection) => void) { this.onIncomingCall = callback; }
  public setOnError(callback: ErrorCallback) { this.onError = callback; }

  private setupConnection(conn: any) {
    conn.on('open', () => {
      this.connections.add(conn);
    });
    conn.on('data', (data: any) => {
      if (data.type === 'SYNC' && this.onSync) {
        this.onSync(data.payload);
      }
    });
    conn.on('close', () => this.connections.delete(conn));
  }

  public setSyncCallback(callback: SyncCallback) { this.onSync = callback; }
}

export const p2pSync = new P2PSyncService();