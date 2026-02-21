
import React from 'react';
import { Friend, ShopItem } from './types';

// Initial friend list for empty states
export const INITIAL_FRIENDS: Friend[] = [];

export interface EmojiData {
  emoji: string;
  name: string;
  category: string;
}

// Fix: Moved BORDER_COLORS to constants for shared access
export const BORDER_COLORS = [
  { name: 'Gold', value: '#ffd154' },
  { name: 'Blurple', value: '#5865f2' },
  { name: 'Emerald', value: '#23a559' },
  { name: 'Crimson', value: '#f23f43' },
  { name: 'Pink', value: '#eb459e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Sky', value: '#00a8fc' },
  { name: 'White', value: '#ffffff' },
  { name: 'Neon', value: '#39ff14' },
  { name: 'Flame', value: '#ff8c00' }
];

// Updated DEFAULT_PRODUCTS: Pulse Sub now costs 25,000 shards
export const DEFAULT_PRODUCTS: ShopItem[] = [
  {
    id: 'pulse',
    name: 'Pulse Sub',
    description: 'The definitive Realms experience. Always active once unlocked. Exclusive badges and HD profile uploads.',
    cost: 25000,
    period: 'Permanent Active',
    icon: '⚡',
    rarity: 'Legendary',
    rarityColor: 'bg-indigo-500 text-white border-indigo-400'
  },
  {
    id: 'icon-border',
    name: 'Standard Ring',
    description: 'A sleek, customizable neon border around your profile icon. Change your signature color anytime after unlocking.',
    cost: 100,
    period: 'Permanent Item',
    icon: '', // Removed ring emoji as requested
    rarity: 'Rare',
    rarityColor: 'bg-emerald-600 text-white border-emerald-400',
    isAura: true
  }
];

// Comprehensive emoji list for the EmojiPicker component
export const ALL_EMOJIS: EmojiData[] = [
  // Smileys & Emotion
  { emoji: '😀', name: 'grinning face', category: 'Smileys' },
  { emoji: '😃', name: 'grinning face with big eyes', category: 'Smileys' },
  { emoji: '😄', name: 'grinning face with smiling eyes', category: 'Smileys' },
  { emoji: '😁', name: 'beaming face with smiling eyes', category: 'Smileys' },
  { emoji: '😆', name: 'grinning squinting face', category: 'Smileys' },
  { emoji: '😅', name: 'grinning face with sweat', category: 'Smileys' },
  { emoji: '🤣', name: 'rolling on the floor laughing', category: 'Smileys' },
  { emoji: '😂', name: 'face with tears of joy', category: 'Smileys' },
  { emoji: '🙂', name: 'slightly smiling face', category: 'Smileys' },
  { emoji: '🙃', name: 'upside-down face', category: 'Smileys' },
  { emoji: '😉', name: 'winking face', category: 'Smileys' },
  { emoji: '😊', name: 'smiling face with smiling eyes', category: 'Smileys' },
  { emoji: '😇', name: 'smiling face with halo', category: 'Smileys' },
  { emoji: '🥰', name: 'smiling face with hearts', category: 'Smileys' },
  { emoji: '😍', name: 'smiling face with heart-eyes', category: 'Smileys' },
  { emoji: '🤩', name: 'star-struck', category: 'Smileys' },
  { emoji: '😘', name: 'face blowing a kiss', category: 'Smileys' },
  { emoji: '😗', name: 'kissing face', category: 'Smileys' },
  { emoji: '😚', name: 'kissing face with closed eyes', category: 'Smileys' },
  { emoji: '😙', name: 'kissing face with smiling eyes', category: 'Smileys' },
  { emoji: '😋', name: 'face savoring food', category: 'Smileys' },
  { emoji: '😛', name: 'face with tongue', category: 'Smileys' },
  { emoji: '😜', name: 'winking face with tongue', category: 'Smileys' },
  { emoji: '🤪', name: 'zany face', category: 'Smileys' },
  { emoji: '😝', name: 'squinting face with tongue', category: 'Smileys' },
  { emoji: '🤑', name: 'money-mouth face', category: 'Smileys' },
  { emoji: '🤗', name: 'hugging face', category: 'Smileys' },
  { emoji: '🤭', name: 'face with hand over mouth', category: 'Smileys' },
  { emoji: '🤫', name: 'shushing face', category: 'Smileys' },
  { emoji: '🤔', name: 'thinking face', category: 'Smileys' },
  { emoji: '🤐', name: 'zipper-mouth face', category: 'Smileys' },
  { emoji: '🤨', name: 'face with raised eyebrow', category: 'Smileys' },
  { emoji: '😐', name: 'neutral face', category: 'Smileys' },
  { emoji: '😑', name: 'expressionless face', category: 'Smileys' },
  { emoji: '😶', name: 'face without mouth', category: 'Smileys' },
  { emoji: '😏', name: 'smirking face', category: 'Smileys' },
  { emoji: '😒', name: 'unamused face', category: 'Smileys' },
  { emoji: '🙄', name: 'face with rolling eyes', category: 'Smileys' },
  { emoji: '😬', name: 'grimacing face', category: 'Smileys' },
  { emoji: '🤥', name: 'lying face', category: 'Smileys' },
  { emoji: '😌', name: 'relieved face', category: 'Smileys' },
  { emoji: '😔', name: 'pensive face', category: 'Smileys' },
  { emoji: '😪', name: 'sleepy face', category: 'Smileys' },
  { emoji: '🤤', name: 'drooling face', category: 'Smileys' },
  { emoji: '😴', name: 'sleeping face', category: 'Smileys' },
  { emoji: '😷', name: 'face with medical mask', category: 'Smileys' },
  { emoji: '🤒', name: 'face with thermometer', category: 'Smileys' },
  { emoji: '🤕', name: 'face with head-bandage', category: 'Smileys' },
  { emoji: '🤢', name: 'nauseated face', category: 'Smileys' },
  { emoji: '🤮', name: 'face vomiting', category: 'Smileys' },
  { emoji: '🤧', name: 'sneezing face', category: 'Smileys' },
  { emoji: '🥵', name: 'hot face', category: 'Smileys' },
  { emoji: '🥶', name: 'cold face', category: 'Smileys' },
  { emoji: '🥴', name: 'woozy face', category: 'Smileys' },
  { emoji: '😵', name: 'dizzy face', category: 'Smileys' },
  { emoji: '🤯', name: 'exploding head', category: 'Smileys' },
  { emoji: '🤠', name: 'cowboy hat face', category: 'Smileys' },
  { emoji: '🥳', name: 'partying face', category: 'Smileys' },
  { emoji: '😎', name: 'smiling face with sunglasses', category: 'Smileys' },
];

// Reusable icon components for the application UI
export const Icons = {
  Amethyst: ({ className }: { className?: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L4 9L12 22L20 9L12 2Z" fill="currentColor" fillOpacity="0.8" />
      <path d="M12 2L8 9L12 22L16 9L12 2Z" fill="currentColor" />
      <path d="M12 2L4 9L12 9V2Z" fill="white" fillOpacity="0.2" />
      <path d="M12 2L20 9L12 9V2Z" fill="black" fillOpacity="0.1" />
    </svg>
  ),
  PulseBadge: ({ className }: { className?: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
    </svg>
  ),
  Shop: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Inbox: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
  Question: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Portal: () => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="50" cy="50" r="20" fill="currentColor"/>
      <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="7"/>
      <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="8" strokeDasharray="26 8.5"/>
    </svg>
  ),
  Emoji: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Verified: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 5.26L19.44 5.9L20.08 10.25L23.34 13.34L21.11 16.7L21.11 21.11L16.7 21.11L13.34 23.34L10.25 20.08L5.9 19.44L5.26 15.09L2 12L5.26 8.91L5.9 4.56L10.25 3.92L12 2Z" />
      <path d="M9 12L11 14L15 10" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  Inventory: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15"/>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <path d="m3.3 7 8.7 5 8.7-5"/>
      <path d="M12 22V12"/>
    </svg>
  ),
  Lock: ({ className }: { className?: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Scroll: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
      <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
    </svg>
  ),
  ArrowUp: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  ),
  ArrowDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  )
};
