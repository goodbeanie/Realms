
/**
 * CryptoService is now deprecated as we have moved to 
 * TLS-in-transit (Discord-style) plaintext messaging.
 * This file is kept as a stub for compatibility.
 */
export class CryptoService {
  static async hashPassword(password: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
