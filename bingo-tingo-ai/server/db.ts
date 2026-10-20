import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  avatar: string;
  score: number;
  level: number;
  wins: number;
  losses: number;
  streak: number;
  bestStreak: number;
  gamesPlayed: number;
  createdAt: number;
  lastSeen: number;
}

export interface FriendshipRecord {
  id: string;
  requesterId: string;
  requesterName: string;
  receiverId: string;
  receiverName: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  message: string;
  readAt?: number;
  createdAt: number;
}

export interface ConversationRecord {
  id: string;
  user1Id: string;
  user2Id: string;
  lastMessageText?: string;
  lastMessageTime?: number;
  updatedAt: number;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: "game_invite" | "friend_request" | "chat_message" | "match_result";
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: number;
}

export interface MatchHistoryRecord {
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

interface DBData {
  users: UserRecord[];
  friendships: FriendshipRecord[];
  conversations: ConversationRecord[];
  messages: MessageRecord[];
  notifications: NotificationRecord[];
  matchHistory: MatchHistoryRecord[];
}

const DATA_DIR = path.join(process.cwd(), "server", "data");
const DB_FILE = path.join(DATA_DIR, "store.json");

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password: string, salt: string, hash: string): boolean {
  const checkHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(checkHash, "hex"), Buffer.from(hash, "hex"));
}

class BingoTingoDB {
  private data: DBData = {
    users: [],
    friendships: [],
    conversations: [],
    messages: [],
    notifications: [],
    matchHistory: [],
  };

  private sessions = new Map<string, string>(); // token -> userId
  private userSockets = new Map<string, any>(); // userId -> ws socket connection

  constructor() {
    this.loadFromDisk();
    this.seedDefaultsIfEmpty();
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
      }
    } catch (e) {
      console.error("Failed to load DB file, using in-memory store:", e);
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save DB file:", e);
    }
  }

  private seedDefaultsIfEmpty() {
    if (this.data.users.length === 0) {
      // Seed sample users Rahul123, PriyaGaming, and Amit45 with realistic stats
      const sampleUsers = [
        {
          username: "Rahul123",
          pass: "bingo123",
          avatar: "🔥",
          level: 14,
          score: 9420,
          wins: 48,
          losses: 22,
          streak: 4,
          bestStreak: 9,
          gamesPlayed: 70,
        },
        {
          username: "PriyaGaming",
          pass: "bingo123",
          avatar: "⭐",
          level: 11,
          score: 6890,
          wins: 34,
          losses: 21,
          streak: 2,
          bestStreak: 7,
          gamesPlayed: 55,
        },
        {
          username: "Amit45",
          pass: "bingo123",
          avatar: "🎯",
          level: 9,
          score: 4750,
          wins: 21,
          losses: 19,
          streak: 0,
          bestStreak: 5,
          gamesPlayed: 40,
        },
      ];

      for (const u of sampleUsers) {
        const salt = crypto.randomBytes(16).toString("hex");
        const passwordHash = hashPassword(u.pass, salt);
        this.data.users.push({
          id: `u-${u.username.toLowerCase()}`,
          username: u.username,
          passwordHash,
          salt,
          avatar: u.avatar,
          level: u.level,
          score: u.score,
          wins: u.wins,
          losses: u.losses,
          streak: u.streak,
          bestStreak: u.bestStreak,
          gamesPlayed: u.gamesPlayed,
          createdAt: Date.now() - 30 * 24 * 3600 * 1000,
          lastSeen: Date.now() - 5 * 60 * 1000,
        });
      }
      this.saveToDisk();
    }
  }

  // --- Auth & User Methods ---
  public registerUser(username: string, pass: string, avatar: string = "⚡"): { user?: any; token?: string; error?: string } {
    const cleanUsername = username.trim();
    if (!cleanUsername || cleanUsername.length < 3) {
      return { error: "Username must be at least 3 characters long." };
    }
    if (!pass || pass.length < 6) {
      return { error: "Password must be at least 6 characters long." };
    }

    const existing = this.data.users.find(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (existing) {
      return { error: "Username is already taken. Please choose another." };
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(pass, salt);
    const newUser: UserRecord = {
      id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      username: cleanUsername,
      passwordHash,
      salt,
      avatar: avatar || "⚡",
      score: 0,
      level: 1,
      wins: 0,
      losses: 0,
      streak: 0,
      bestStreak: 0,
      gamesPlayed: 0,
      createdAt: Date.now(),
      lastSeen: Date.now(),
    };

    this.data.users.push(newUser);

    // Auto-befriend sample users Rahul123 so the new account immediately has friends to chat and invite!
    const rahul = this.data.users.find((u) => u.username === "Rahul123");
    if (rahul) {
      this.data.friendships.push({
        id: `f-${Date.now()}-1`,
        requesterId: rahul.id,
        requesterName: rahul.username,
        receiverId: newUser.id,
        receiverName: newUser.username,
        status: "accepted",
        createdAt: Date.now(),
      });
      // Add initial greeting message
      const convId = this.getConversationId(rahul.id, newUser.id);
      this.data.conversations.push({
        id: convId,
        user1Id: rahul.id,
        user2Id: newUser.id,
        lastMessageText: "Ready for a Bingo Tingo duel? 😎",
        lastMessageTime: Date.now(),
        updatedAt: Date.now(),
      });
      this.data.messages.push({
        id: `m-${Date.now()}`,
        conversationId: convId,
        senderId: rahul.id,
        senderName: rahul.username,
        receiverId: newUser.id,
        receiverName: newUser.username,
        message: "Ready for a Bingo Tingo duel? 😎",
        createdAt: Date.now(),
      });
      this.data.notifications.push({
        id: `n-${Date.now()}`,
        userId: newUser.id,
        type: "chat_message",
        title: "New Message from Rahul123",
        message: "Ready for a Bingo Tingo duel? 😎",
        data: { fromUserId: rahul.id, fromUserName: rahul.username },
        read: false,
        createdAt: Date.now(),
      });
    }

    const priya = this.data.users.find((u) => u.username === "PriyaGaming");
    if (priya) {
      this.data.friendships.push({
        id: `f-${Date.now()}-2`,
        requesterId: priya.id,
        requesterName: priya.username,
        receiverId: newUser.id,
        receiverName: newUser.username,
        status: "accepted",
        createdAt: Date.now(),
      });
    }

    this.saveToDisk();

    const token = `token-${newUser.id}-${crypto.randomBytes(24).toString("hex")}`;
    this.sessions.set(token, newUser.id);

    return {
      token,
      user: this.sanitizeUser(newUser),
    };
  }

  public loginUser(username: string, pass: string): { user?: any; token?: string; error?: string } {
    const cleanUsername = username.trim();
    const user = this.data.users.find(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (!user) {
      return { error: "Invalid username or password." };
    }

    const isValid = verifyPassword(pass, user.salt, user.passwordHash);
    if (!isValid) {
      return { error: "Invalid username or password." };
    }

    user.lastSeen = Date.now();
    this.saveToDisk();

    const token = `token-${user.id}-${crypto.randomBytes(24).toString("hex")}`;
    this.sessions.set(token, user.id);

    return {
      token,
      user: this.sanitizeUser(user),
    };
  }

  public getUserByToken(token: string): any | null {
    if (!token) return null;
    const userId = this.sessions.get(token);
    if (!userId) return null;
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.lastSeen = Date.now();
    return this.sanitizeUser(user);
  }

  public getUserById(userId: string): any | null {
    const user = this.data.users.find((u) => u.id === userId);
    return user ? this.sanitizeUser(user) : null;
  }

  public searchUsers(query: string, currentUserId: string): any[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return this.data.users
      .filter((u) => u.id !== currentUserId && u.username.toLowerCase().includes(q))
      .slice(0, 10)
      .map((u) => this.sanitizeUser(u));
  }

  public updateUserAvatar(userId: string, avatar: string) {
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      user.avatar = avatar;
      this.saveToDisk();
      return this.sanitizeUser(user);
    }
    return null;
  }

  public recordMatchOutcome(
    winnerId: string,
    loserId: string,
    winnerScore: number,
    loserScore: number,
    gameMode: string,
    gridSize: number,
    pairCode: string
  ) {
    const winner = this.data.users.find((u) => u.id === winnerId);
    const loser = this.data.users.find((u) => u.id === loserId);

    if (winner) {
      winner.wins += 1;
      winner.gamesPlayed += 1;
      winner.streak += 1;
      if (winner.streak > winner.bestStreak) winner.bestStreak = winner.streak;
      winner.score += Math.max(100, winnerScore);
      winner.level = Math.floor(winner.score / 600) + 1;
    }

    if (loser) {
      loser.losses += 1;
      loser.gamesPlayed += 1;
      loser.streak = 0;
      loser.score = Math.max(0, loser.score + Math.floor(loserScore / 2));
      loser.level = Math.floor(loser.score / 600) + 1;
    }

    const match: MatchHistoryRecord = {
      id: `m-${Date.now()}`,
      gameId: `g-${Date.now()}`,
      pairCode,
      winnerId,
      winnerName: winner ? winner.username : "Player",
      loserId,
      loserName: loser ? loser.username : "Opponent",
      winnerScore,
      loserScore,
      gameMode,
      gridSize,
      completedAt: Date.now(),
    };

    this.data.matchHistory.unshift(match);
    if (this.data.matchHistory.length > 200) {
      this.data.matchHistory = this.data.matchHistory.slice(0, 200);
    }

    // Add victory notification for winner
    if (winner) {
      this.addNotification(
        winner.id,
        "match_result",
        "🏆 Match Victory!",
        `You won against ${loser ? loser.username : "Opponent"} (+${winnerScore} pts)`,
        { matchId: match.id }
      );
    }

    this.saveToDisk();
  }

  public getUserMatchHistory(userId: string): MatchHistoryRecord[] {
    return this.data.matchHistory
      .filter((m) => m.winnerId === userId || m.loserId === userId)
      .slice(0, 25);
  }

  // --- Friendships ---
  public getFriends(userId: string): any[] {
    const accepted = this.data.friendships.filter(
      (f) => f.status === "accepted" && (f.requesterId === userId || f.receiverId === userId)
    );

    return accepted.map((f) => {
      const friendId = f.requesterId === userId ? f.receiverId : f.requesterId;
      const friendUser = this.data.users.find((u) => u.id === friendId);
      const isOnline = friendUser ? Date.now() - friendUser.lastSeen < 15 * 60 * 1000 : false;
      return {
        friendshipId: f.id,
        friendId,
        username: friendUser?.username || "Friend",
        avatar: friendUser?.avatar || "👤",
        level: friendUser?.level || 1,
        score: friendUser?.score || 0,
        isOnline,
        lastSeen: friendUser?.lastSeen,
      };
    });
  }

  public getFriendRequests(userId: string): { incoming: any[]; outgoing: any[] } {
    const incoming = this.data.friendships
      .filter((f) => f.receiverId === userId && f.status === "pending")
      .map((f) => {
        const u = this.data.users.find((user) => user.id === f.requesterId);
        return {
          id: f.id,
          requesterId: f.requesterId,
          username: f.requesterName,
          avatar: u?.avatar || "👤",
          level: u?.level || 1,
          createdAt: f.createdAt,
        };
      });

    const outgoing = this.data.friendships
      .filter((f) => f.requesterId === userId && f.status === "pending")
      .map((f) => ({
        id: f.id,
        receiverId: f.receiverId,
        username: f.receiverName,
        createdAt: f.createdAt,
      }));

    return { incoming, outgoing };
  }

  public sendFriendRequest(requesterId: string, targetUsername: string): { success: boolean; message: string } {
    const cleanTarget = targetUsername.trim();
    const requester = this.data.users.find((u) => u.id === requesterId);
    if (!requester) return { success: false, message: "Requester not found" };

    if (requester.username.toLowerCase() === cleanTarget.toLowerCase()) {
      return { success: false, message: "You cannot add yourself as a friend." };
    }

    const target = this.data.users.find(
      (u) => u.username.toLowerCase() === cleanTarget.toLowerCase()
    );
    if (!target) {
      return { success: false, message: `User "${cleanTarget}" not found.` };
    }

    const existing = this.data.friendships.find(
      (f) =>
        (f.requesterId === requesterId && f.receiverId === target.id) ||
        (f.requesterId === target.id && f.receiverId === requesterId)
    );

    if (existing) {
      if (existing.status === "accepted") {
        return { success: false, message: `You are already friends with ${target.username}!` };
      }
      if (existing.status === "pending") {
        return { success: false, message: "Friend request is already pending." };
      }
    }

    const reqRecord: FriendshipRecord = {
      id: `f-${Date.now()}`,
      requesterId: requester.id,
      requesterName: requester.username,
      receiverId: target.id,
      receiverName: target.username,
      status: "pending",
      createdAt: Date.now(),
    };

    this.data.friendships.push(reqRecord);

    this.addNotification(
      target.id,
      "friend_request",
      "👥 New Friend Request",
      `${requester.username} sent you a friend request.`,
      { requesterId: requester.id, requesterName: requester.username }
    );

    this.saveToDisk();
    return { success: true, message: `Friend request sent to ${target.username}!` };
  }

  public acceptFriendRequest(userId: string, friendshipId: string): boolean {
    const friendship = this.data.friendships.find(
      (f) => f.id === friendshipId && f.receiverId === userId && f.status === "pending"
    );
    if (!friendship) return false;

    friendship.status = "accepted";
    this.addNotification(
      friendship.requesterId,
      "friend_request",
      "👥 Friend Request Accepted",
      `${friendship.receiverName} accepted your friend request!`,
      { friendId: userId }
    );

    this.saveToDisk();
    return true;
  }

  public rejectFriendRequest(userId: string, friendshipId: string): boolean {
    const friendship = this.data.friendships.find(
      (f) => f.id === friendshipId && f.receiverId === userId && f.status === "pending"
    );
    if (!friendship) return false;

    friendship.status = "rejected";
    this.saveToDisk();
    return true;
  }

  public removeFriend(userId: string, friendId: string): boolean {
    const initialLen = this.data.friendships.length;
    this.data.friendships = this.data.friendships.filter(
      (f) =>
        !(
          (f.requesterId === userId && f.receiverId === friendId) ||
          (f.requesterId === friendId && f.receiverId === userId)
        )
    );
    if (this.data.friendships.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // --- Private Chat ---
  private getConversationId(u1: string, u2: string): string {
    return [u1, u2].sort().join("--");
  }

  public getConversationMessages(userId: string, friendId: string): MessageRecord[] {
    const convId = this.getConversationId(userId, friendId);
    return this.data.messages.filter((m) => m.conversationId === convId);
  }

  public sendPrivateMessage(senderId: string, receiverId: string, text: string): MessageRecord | null {
    const sender = this.data.users.find((u) => u.id === senderId);
    const receiver = this.data.users.find((u) => u.id === receiverId);
    if (!sender || !receiver || !text.trim()) return null;

    const convId = this.getConversationId(senderId, receiverId);
    let conv = this.data.conversations.find((c) => c.id === convId);
    if (!conv) {
      conv = {
        id: convId,
        user1Id: senderId,
        user2Id: receiverId,
        updatedAt: Date.now(),
      };
      this.data.conversations.push(conv);
    }
    conv.lastMessageText = text.trim();
    conv.lastMessageTime = Date.now();
    conv.updatedAt = Date.now();

    const msg: MessageRecord = {
      id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      conversationId: convId,
      senderId,
      senderName: sender.username,
      receiverId,
      receiverName: receiver.username,
      message: text.trim(),
      createdAt: Date.now(),
    };

    this.data.messages.push(msg);

    this.addNotification(
      receiverId,
      "chat_message",
      `💬 ${sender.username}`,
      text.trim().slice(0, 60),
      { conversationId: convId, senderId, senderName: sender.username }
    );

    this.saveToDisk();
    return msg;
  }

  // --- Notifications ---
  public addNotification(
    userId: string,
    type: "game_invite" | "friend_request" | "chat_message" | "match_result",
    title: string,
    message: string,
    data?: any
  ) {
    const notif: NotificationRecord = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: Date.now(),
    };
    this.data.notifications.unshift(notif);
    if (this.data.notifications.length > 500) {
      this.data.notifications = this.data.notifications.slice(0, 500);
    }
    this.saveToDisk();

    // Push real-time notification to user's active socket if connected
    const ws = this.userSockets.get(userId);
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: "NOTIFICATION_RECEIVED", notification: notif }));
    }
  }

  public getUserNotifications(userId: string): NotificationRecord[] {
    return this.data.notifications.filter((n) => n.userId === userId).slice(0, 30);
  }

  public markAllNotificationsRead(userId: string) {
    this.data.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    this.saveToDisk();
  }

  public markNotificationRead(userId: string, notifId: string) {
    const notif = this.data.notifications.find((n) => n.id === notifId && n.userId === userId);
    if (notif) {
      notif.read = true;
      this.saveToDisk();
    }
  }

  // --- Sockets ---
  public registerUserSocket(userId: string, ws: any) {
    this.userSockets.set(userId, ws);
    const user = this.data.users.find((u) => u.id === userId);
    if (user) user.lastSeen = Date.now();
  }

  public unregisterUserSocket(userId: string) {
    this.userSockets.delete(userId);
  }

  private sanitizeUser(u: UserRecord) {
    const winRate = u.gamesPlayed > 0 ? ((u.wins / u.gamesPlayed) * 100).toFixed(1) : "0.0";
    const friendsCount = this.data.friendships.filter(
      (f) => f.status === "accepted" && (f.requesterId === u.id || f.receiverId === u.id)
    ).length;

    return {
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      score: u.score,
      level: u.level,
      wins: u.wins,
      losses: u.losses,
      streak: u.streak,
      bestStreak: u.bestStreak,
      gamesPlayed: u.gamesPlayed,
      winRate: `${winRate}%`,
      friendsCount,
      createdAt: u.createdAt,
    };
  }
}

export const db = new BingoTingoDB();
