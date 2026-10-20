export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  level: number;
  score: number;
  wins: number;
  losses: number;
  streak: number;
  bestStreak: number;
  gamesPlayed: number;
  winRate: string;
  friendsCount: number;
  createdAt: number;
}

export interface Friend {
  friendshipId: string;
  friendId: string;
  username: string;
  avatar: string;
  level: number;
  score: number;
  isOnline: boolean;
  lastSeen?: number;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  username: string;
  avatar: string;
  level: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  message: string;
  createdAt: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: "game_invite" | "friend_request" | "chat_message" | "match_result";
  title: string;
  message: string;
  data?: {
    pairCode?: string;
    fromUserId?: string;
    fromUserName?: string;
    gameMode?: string;
    gridSize?: number;
    matchId?: string;
    friendId?: string;
    conversationId?: string;
  };
  read: boolean;
  createdAt: number;
}

export interface MatchHistoryItem {
  id: string;
  gameId: string;
  pairCode: string;
  winnerId: string;
  winnerName: string;
  loserId: string;
  loserName: string;
  winnerScore: number;
  loserScore: number;
  gameMode: string;
  gridSize: number;
  completedAt: number;
}
