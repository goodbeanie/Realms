import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  initializeFirestore,
  doc, 
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  deleteDoc,
  getDoc,
  getDocs,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZ8USrJ7rWT-80v27L89E_KkmxPZXDKOc",
  authDomain: "realms-messaging.firebaseapp.com",
  projectId: "realms-messaging",
  storageBucket: "realms-messaging.firebasestorage.app",
  messagingSenderId: "264418786662",
  appId: "1:264418786662:web:8109735a59f35d63781ca7",
  measurementId: "G-8FZBLJKRB7"
};

let db: any = null;
let auth: any = null;

try {
  const app = initializeApp(firebaseConfig);
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false
  });
  auth = getAuth(app);
} catch (e) {
  console.warn("Cloud Sync Disabled: Error initializing Firebase.", e);
}

export { db, auth };

/**
 * Robustly sanitizes data for Firestore/JSON.
 * Prevents circular reference errors by blocking internal Firebase/PeerJS types 
 * and using a depth-limited traversal.
 */
export function sanitizeForFirestore(val: any, seen = new WeakSet(), depth = 0): any {
  // Hard limit on depth to prevent accidental infinite recursion or extremely large payloads
  if (depth > 12) return "[Max Depth Reached]";
  
  if (val === null || typeof val !== 'object') {
    return val === undefined ? null : val;
  }
  
  // Handle Firebase Timestamps - convert to number
  if (val && typeof val.toDate === 'function') {
    try {
      return val.toDate().getTime();
    } catch {
      return Date.now();
    }
  }

  // Handle circular references
  if (seen.has(val)) return "[Circular Reference]";
  seen.add(val);

  // Check for common internal class names and patterns that cause serialization errors
  const ctorName = val.constructor?.name;
  const isInternal = ctorName && [
    'Sa', 'Q$1', 'Ma', 'Peer', 'Socket', 'MediaConnection', 
    'RTCPeerConnection', 'EventEmitter', 'Firestore', 'DocumentReference', 
    'CollectionReference', 'QuerySnapshot', 'DocumentSnapshot', 'DocumentKey',
    'ObjectValue', 'FieldValue', 'FieldPath', 'va', 'wa', 'da'
  ].includes(ctorName);
  
  if (
    val instanceof MediaStream || 
    val instanceof MediaStreamTrack || 
    val instanceof Event ||
    val instanceof Element || 
    val instanceof HTMLElement ||
    isInternal ||
    (val.$$typeof) || // React elements
    (val.type && val.type === 'firestore-error') ||
    (val.internalId) // PeerJS internal
  ) {
    return `[Non-Serializable: ${ctorName || 'Internal'}]`;
  }

  // Sanitize Arrays
  if (Array.isArray(val)) {
    return val.map(item => sanitizeForFirestore(item, seen, depth + 1));
  }

  // Sanitize Objects
  const cleaned: Record<string, any> = {};
  try {
    const keys = Object.keys(val);
    for (const key of keys) {
      // Skip internal-only keys, methods, and complex P2P/Firestore references
      if (
        key.startsWith('_') || 
        typeof val[key] === 'function' || 
        ['srcObject', 'connection', 'peerConnection', 'firestore', 'db', 'auth', 'peer', 'socket'].includes(key)
      ) {
        continue;
      }
      cleaned[key] = sanitizeForFirestore(val[key], seen, depth + 1);
    }
  } catch (e) {
    return "[Unserializable Object]";
  }
  
  return cleaned;
}

export const subscribeUsers = (onUpdate: (users: any[]) => void) => {
  if (!db) return () => {};
  return onSnapshot(collection(db, "users"), (snap: any) => {
    const users = snap.docs.map((d: any) => sanitizeForFirestore({ ...d.data(), id: d.id }));
    onUpdate(users);
  }, (err) => console.error("User sub error:", err));
};

export const pushUser = async (userId: string, data: any) => {
  if (!db || !userId) return;
  const safeData = sanitizeForFirestore(data);
  await setDoc(doc(db, "users", userId), safeData, { merge: true });
};

export const subscribeRealms = (onUpdate: (realms: any[]) => void) => {
  if (!db) return () => {};
  return onSnapshot(collection(db, "realms"), (snap: any) => {
    const realms = snap.docs.map((d: any) => sanitizeForFirestore({ ...d.data(), id: d.id }));
    onUpdate(realms);
  }, (err) => console.error("Realm sub error:", err));
};

export const pushRealm = async (realmId: string, data: any) => {
  if (!db || !realmId) return;
  const safeData = sanitizeForFirestore(data);
  await setDoc(doc(db, "realms", realmId), safeData, { merge: true });
};

export const subscribeFriendRequests = (userId: string, onUpdate: (reqs: any[]) => void) => {
  if (!db || !userId) return () => {};
  const q = query(collection(db, "friend_requests"), where("toId", "==", userId));
  return onSnapshot(q, (snap: any) => {
    onUpdate(snap.docs.map((d: any) => sanitizeForFirestore({ ...d.data(), id: d.id })));
  });
};

export const pushFriendRequest = async (reqId: string, data: any) => {
  if (!db || !reqId) return;
  const safeData = sanitizeForFirestore(data);
  await setDoc(doc(db, "friend_requests", reqId), safeData);
};

export const deleteFriendRequest = async (reqId: string) => {
  if (!db || !reqId) return;
  await deleteDoc(doc(db, "friend_requests", reqId));
};

export const subscribeChatHistory = (chatId: string, onUpdate: (messages: any[]) => void) => {
  if (!db || !chatId) return () => {};
  return onSnapshot(doc(db, "messages", "msg-history-" + chatId), (snap: any) => {
    onUpdate(snap.exists() ? (snap.data().messages || []).map((m: any) => sanitizeForFirestore(m)) : []);
  });
};

export const pushChatHistory = async (chatId: string, messages: any[]) => {
  if (!db || !chatId) return;
  // Deep clean the message array before stringifying or sending to Firestore
  const safeMessages = sanitizeForFirestore(messages.slice(-100));
  await setDoc(doc(db, "messages", "msg-history-" + chatId), { 
    messages: safeMessages,
    lastUpdated: Date.now() 
  }, { merge: true });
};

export const deleteChatHistory = async (chatId: string) => {
  if (!db || !chatId) return;
  await deleteDoc(doc(db, "messages", "msg-history-" + chatId));
};

export const subscribeShopItems = (onUpdate: (items: any[]) => void) => {
  if (!db) return () => {};
  return onSnapshot(collection(db, "shop_items"), async (snap: any) => {
    const items = await Promise.all(snap.docs.map(async (d: any) => {
      const data = d.data();
      if (data.hasLargeVariants) {
        try {
          const variantsSnap = await getDocs(collection(db, "shop_items", d.id, "variants_data"));
          const variantsList: string[] = [];
          const sortedDocs = variantsSnap.docs.sort((a: any, b: any) => a.id.localeCompare(b.id));
          sortedDocs.forEach((vDoc: any) => {
            const chunk = vDoc.data().variants || [];
            variantsList.push(...chunk);
          });
          data.variants = variantsList;
        } catch (e) {
          console.warn("Failed to load large variants", e);
        }
      }
      return sanitizeForFirestore({ ...data, id: d.id });
    }));
    onUpdate(items);
  });
};

export const subscribeRedeemCodes = (onUpdate: (codes: any[]) => void) => {
  if (!db) return () => {};
  return onSnapshot(collection(db, "redeem_codes"), (snap: any) => {
    const codes = snap.docs.map((d: any) => sanitizeForFirestore({ ...d.data(), id: d.id }));
    onUpdate(codes);
  });
};

export const subscribeResaleItems = (onUpdate: (items: any[]) => void) => {
  if (!db) return () => {};
  return onSnapshot(collection(db, "resale_items"), (snap: any) => {
    const items = snap.docs.map((d: any) => sanitizeForFirestore({ ...d.data(), id: d.id }));
    onUpdate(items);
  });
};

export const pushShopItem = async (itemId: string, data: any) => {
  if (!db || !itemId) return;
  const { variants, ...baseData } = data;
  
  if (variants && variants.length > 0) {
    baseData.hasLargeVariants = true;
    for (let i = 0; i < variants.length; i++) {
      await setDoc(
        doc(db, "shop_items", itemId, "variants_data", `chunk_${i.toString().padStart(3, '0')}`), 
        { variants: [variants[i]] }
      );
    }
  } else {
    baseData.hasLargeVariants = false;
  }

  try {
    await deleteDoc(doc(db, "shop_items", itemId, "extra", "variants"));
  } catch (e) {}

  await setDoc(doc(db, "shop_items", itemId), sanitizeForFirestore(baseData), { merge: true });
};

export const deleteShopItem = async (itemId: string) => {
  if (!db || !itemId) return;
  await deleteDoc(doc(db, "shop_items", itemId));
  
  const variantsSnap = await getDocs(collection(db, "shop_items", itemId, "variants_data"));
  const deletePromises = variantsSnap.docs.map((d: any) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
  
  await deleteDoc(doc(db, "shop_items", itemId, "extra", "variants"));
};

export const pushRedeemCode = async (codeId: string, data: any) => {
  if (!db || !codeId) return;
  await setDoc(doc(db, "redeem_codes", codeId), sanitizeForFirestore(data), { merge: true });
};

export const pushResaleItem = async (resaleId: string, data: any) => {
  if (!db || !resaleId) return;
  await setDoc(doc(db, "resale_items", resaleId), sanitizeForFirestore(data));
};

export const deleteResaleItem = async (resaleId: string) => {
  if (!db || !resaleId) return;
  await deleteDoc(doc(db, "resale_items", resaleId));
};

export const subscribeQuests = (onUpdate: (quests: any[]) => void) => {
  if (!db) return () => {};
  return onSnapshot(collection(db, "quests"), (snap: any) => {
    const quests = snap.docs.map((d: any) => sanitizeForFirestore({ ...d.data(), id: d.id }));
    onUpdate(quests);
  });
};

export const pushQuest = async (questId: string, data: any) => {
  if (!db || !questId) return;
  await setDoc(doc(db, "quests", questId), sanitizeForFirestore(data), { merge: true });
};

export const deleteQuest = async (questId: string) => {
  if (!db || !questId) return;
  await deleteDoc(doc(db, "quests", questId));
};

export const subscribeSystemConfig = (onUpdate: (data: any) => void) => {
  if (!db) return () => {};
  return onSnapshot(doc(db, "system", "config"), (snap: any) => {
    onUpdate(snap.exists() ? sanitizeForFirestore(snap.data()) : {});
  });
};

export const pushSystemConfig = async (data: any) => {
  if (!db) return;
  const safeData = sanitizeForFirestore(data);
  await setDoc(doc(db, "system", "config"), safeData, { merge: true });
};

export const subscribeChatMetadata = (onUpdate: (chats: any[]) => void) => {
  if (!db) return () => {};
  return onSnapshot(collection(db, "chat_metadata"), (snap: any) => {
    const chats = snap.docs.map((d: any) => sanitizeForFirestore({ ...d.data(), id: d.id }));
    onUpdate(chats);
  });
};

export const pushChatMetadata = async (chatId: string, data: any) => {
  if (!db || !chatId) return;
  const safeData = sanitizeForFirestore(data);
  await setDoc(doc(db, "chat_metadata", chatId), safeData, { merge: true });
};

export const deleteChatMetadata = async (chatId: string) => {
  if (!db || !chatId) return;
  await deleteDoc(doc(db, "chat_metadata", chatId));
};