

export interface User {
  id: string;
  email: string;
  password?: string;
  username: string;
  normalizedUsername: string;
  displayName: string;
  avatarUrl?: string;
  bannerColor?: string;
  bannerUrl?: string;
  theme?: 'light' | 'dark' | 'custom';
  customTheme?: {
    type: 'color' | 'gradient';
    bg: string;
    text: string;
    accent?: string;
  };
  accentColor?: string;
  bio?: string;
  shards: number;
  unlockedItems?: string[];
  purchasedArtifactIcons?: Record<string, string>;
  equippedAuraId?: string;
  equippedBannerId?: string;
  equippedAuraScale?: number;
  iconBorderColor?: string;
  socialLinks?: {
    youtube?: string;
    tiktok?: string;
    twitch?: string;
  };
  isPrivileged?: boolean;
  isGlobalAdmin?: boolean;
  isModerator?: boolean;
  isCreator?: boolean;
  hasUnlimitedPulse?: boolean;
  isEmailVerified?: boolean;
  redeemedCodeIds?: string[];
  friendIds: string[];
  lastActive?: number;
  realmSuspensions?: Record<string, number>; // realmId -> endTimestamp (ms)
  realmSuspensionReasons?: Record<string, string>; // realmId -> reason string
  messageCount?: number;
  resaleCount?: number;
  purchaseCount?: number;
  completedQuestIds?: string[];
  questBaselines?: Record<string, number>;
  lastDailyBonusClaimedAt?: number;
  lastDailyResetAt?: number;
  dailyMsgCount_dms?: number;
  dailyMsgCount_realms?: number;
  dailyMsgCount_groups?: number;
  dailyChattedFriendIds?: string[];
  dailyResaleCount?: number;
  preferredMicId?: string;
  preferredCamId?: string;
  // Added layoutConfig for UI calibration persistence
  layoutConfig?: LayoutConfig;
}

export type QuestType = 'SEND_MESSAGES' | 'RESELL_ITEMS' | 'ADD_AVATAR' | 'ADD_BANNER' | 'ADD_BIO' | 'BUY_ITEM' | 'CHAT_WITH_FRIENDS';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  targetValue: number;
  rewardShards: number;
  createdBy: string;
  timestamp: number;
  isDaily?: boolean;
  isQueued?: boolean;
  isOld?: boolean;
  requiredLocation?: 'dms' | 'realms' | 'groups';
  icon?: string;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: number;
  direction?: 'incoming' | 'outgoing';
  fromName?: string;
  fromUsername?: string;
}

export interface GlobalMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  readStatus: { [userId: string]: boolean };
  fileUrl?: string;
  fileName?: string;
  inviteRealmId?: string;
  inviteCode?: string;
  inviteRealmData?: Partial<Realm>;
  callData?: {
    duration?: number;
    type: 'voice' | 'video';
    status: 'ended' | 'missed' | 'started';
  };
}

export interface Message extends GlobalMessage {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorBorderColor?: string;
  isMe: boolean;
}

export interface GlobalChat {
  id: string;
  isGroup: boolean;
  name?: string;
  participantIds: string[];
  roles?: { [userId: string]: 'owner' | 'admin' | 'member' };
  messages: GlobalMessage[];
  lastActivity: number;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
  };
}

export interface GlobalStore {
  users: User[];
  requests: FriendRequest[];
  chats: GlobalChat[];
  realms: Realm[];
  shopItems?: ShopItem[];
  redeemCodes?: RedeemCode[];
  quests?: Quest[];
  uiOverrides?: Record<string, string>;
  lastUpdated: number;
}

export interface RedeemCode {
  id: string;
  code: string;
  prizeType: 'shards';
  prizeValue: number;
  maxUses?: number;
  timesUsed: number;
  createdBy: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  variants?: string[];
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  rarityColor?: string;
  period?: string;
  isAura?: boolean;
  isBanner?: boolean;
  borderScale?: number;
  showAsBadge?: boolean;
  paymentType?: 'one-time' | 'monthly';
  activationType?: 'equippable' | 'always-active';
  createdBy?: string;
  isPinned?: boolean;
  isResellable?: boolean;
}

export interface ResaleItem {
  id: string;
  itemId: string;
  sellerId: string;
  price: number;
  timestamp: number;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  hoist: boolean;
  permissions: string[];
  memberIds: string[];
}

export interface Section {
  id: string;
  name: string;
  chats: Chat[];
}

export interface Chat {
  id: string;
  name: string;
  type: 'text' | 'announcements' | 'rules';
  allowedRoleIds?: string[];
  rules?: RuleItem[];
}

export interface RuleItem {
  id: string;
  title: string;
  content: string;
  suspensionMinutes?: number;
}

export interface Realm {
  id: string;
  name: string;
  avatarUrl?: string;
  bannerColor?: string;
  ownerId: string;
  memberIds: string[];
  initials: string;
  isVerified?: boolean;
  isBanned?: boolean;
  verificationStatus?: 'none' | 'pending' | 'verified';
  bio?: string;
  sections: Section[];
  roles?: Role[];
  levelingConfig?: LevelingConfig;
  memberStats?: MemberStats[];
  onboarding?: OnboardingQuestion[];
  autoModConfig?: {
    enabled: boolean;
    harshness: 'None' | 'Low' | 'Moderate' | 'Harsh';
  };
}

export interface OnboardingQuestion {
  id: string;
  question: string;
  type: 'text' | 'choice';
  required: boolean;
  options?: string[];
}

export interface MemberStats {
  userId: string;
  xp: number;
  level: number;
}

export interface LevelingConfig {
  enabled: boolean;
  xpPerMessage: number;
  baseXpPerLevel: number;
  levelRoles: { level: number; roleId: string }[];
}

export interface Report {
  id: string;
  realmId: string;
  realmName: string;
  realmAvatarUrl?: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  timestamp: number;
  status: 'pending' | 'resolved';
  aiAnalysis: string;
  aiClassification: 'SAFE' | 'INAPPROPRIATE' | 'UNSURE';
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  status: 'online' | 'offline';
  initials: string;
  avatarUrl?: string;
  isGroup?: boolean;
  memberIds?: string[];
  unreadCount?: number;
  iconBorderColor?: string;
  lastActive?: number;
}

// Added LayoutElement and LayoutConfig for UI calibration features
export interface LayoutElement {
  id: string;
  x: number | string;
  y: number | string;
  w: number | string;
  h: number | string;
}

export interface LayoutConfig {
  [key: string]: LayoutElement;
}
