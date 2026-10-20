import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import type { Express, Request, Response } from "express";
import { db } from "./db";

export interface BingoCellState {
  id: string;
  text: string;
  emoji?: string;
  isFree?: boolean;
  marked: boolean;
}

export interface PlayerInfo {
  id: string;
  userId?: string;
  name: string;
  avatar: string;
  slot: 1 | 2;
  isReady: boolean;
  connected: boolean;
  score: number;
  linesCount: number;
  completedLines: number[][];
  comboMultiplier: number;
  hasShield: boolean;
  doublePointsActive: boolean;
  frozenUntil: number; // timestamp if blocked
  powerUps: Record<string, number>;
  cards: BingoCellState[];
  lastMarkTime?: number;
  rematchRequested?: boolean;
  ws?: WebSocket;
}

export interface SpectatorInfo {
  id: string;
  name: string;
  ws: WebSocket;
}

export interface CallBall {
  id: string;
  label: string; // e.g., "B-12" or "Read 20 Pages"
  letter?: string; // B, I, N, G, O
  number?: number;
  color?: string;
}

export type GameMode =
  | "classic"
  | "race"
  | "battle"
  | "time-attack"
  | "series-bo3"
  | "series-bo5"
  | "sudden-death";

export interface MoveRecord {
  timestamp: number;
  playerSlot: 1 | 2;
  action: string;
  detail: string;
}

export interface BingoRoom {
  code: string;
  pairCode: string;
  createdAt: number;
  gridSize: number;
  title: string;
  gameMode: GameMode;
  targetLines: number;
  timeLimitSec: number;
  remainingTimeSec: number;
  powerUpsEnabled: boolean;
  cardDifficulty: string;
  gameStatus: "waiting" | "starting" | "playing" | "paused" | "won" | "finished";
  player1: PlayerInfo;
  player2: PlayerInfo | null;
  spectators: SpectatorInfo[];
  callPool: CallBall[];
  drawnBalls: CallBall[];
  currentBall: CallBall | null;
  winnerSlot: 1 | 2 | null;
  winningLine: number[] | null;
  autoCaller: boolean;
  callIntervalSec: number;
  p1SeriesWins: number;
  p2SeriesWins: number;
  currentMatch: number;
  moveHistory: MoveRecord[];
  callerTimerId?: NodeJS.Timeout;
  matchTimerId?: NodeJS.Timeout;
  initialTemplateCards?: any[];
}

// In-Memory store for active rooms
export const rooms = new Map<string, BingoRoom>();

// Clean up inactive rooms older than 4 hours
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.createdAt > 4 * 60 * 60 * 1000) {
      if (room.callerTimerId) clearInterval(room.callerTimerId);
      if (room.matchTimerId) clearInterval(room.matchTimerId);
      rooms.delete(code);
    }
  }
}, 15 * 60 * 1000);

/**
 * Generates a clean Pair Code (e.g., 7K9P-X2)
 */
export function generatePairCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let p1 = "";
  for (let i = 0; i < 4; i++) {
    p1 += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  let p2 = "";
  for (let i = 0; i < 2; i++) {
    p2 += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return `${p1}-${p2}`;
}

export function generateRoomCode(): string {
  return generatePairCode();
}

/**
 * Normalizes and looks up a room by exact code or alphanumeric match (e.g. 7K9P-X2 or 7K9PX2)
 */
export function findRoom(inputCode: string): BingoRoom | undefined {
  if (!inputCode) return undefined;
  const clean = inputCode.toUpperCase().trim();
  const normalized = clean.replace(/[^A-Z0-9]/g, "");

  if (rooms.has(clean)) return rooms.get(clean);

  for (const [key, room] of rooms.entries()) {
    if (key.toUpperCase() === clean || key.replace(/[^A-Z0-9]/g, "") === normalized) {
      return room;
    }
  }
  return undefined;
}

function broadcastToRoom(room: BingoRoom, message: any, excludeWs?: WebSocket) {
  const data = JSON.stringify(message);
  if (room.player1.ws && room.player1.ws.readyState === WebSocket.OPEN && room.player1.ws !== excludeWs) {
    room.player1.ws.send(data);
  }
  if (room.player2?.ws && room.player2.ws.readyState === WebSocket.OPEN && room.player2.ws !== excludeWs) {
    room.player2.ws.send(data);
  }
  // Send to all spectators
  room.spectators.forEach((spec) => {
    if (spec.ws && spec.ws.readyState === WebSocket.OPEN && spec.ws !== excludeWs) {
      spec.ws.send(data);
    }
  });
}

/**
 * Generates the identical card deck for both players!
 * Symmetrical, exact same cells and order distributed to both players.
 */
export function generateIdenticalBingoDeck(
  gridSize: number,
  customCards?: any[],
  difficulty: string = "mixed"
): BingoCellState[] {
  const total = gridSize * gridSize;
  const hasFree = gridSize % 2 === 1;
  const centerIdx = Math.floor(total / 2);

  // If custom template cards are provided and match grid size
  if (customCards && customCards.length >= total && difficulty !== "numbers") {
    return customCards.slice(0, total).map((c: any, index: number) => ({
      id: `c-${index}`,
      text: c.text || `Tile ${index + 1}`,
      emoji: c.emoji || "⭐",
      isFree: Boolean(hasFree && index === centerIdx ? true : c.isFree),
      marked: Boolean(hasFree && index === centerIdx ? true : c.isFree),
    }));
  }

  // Classic 5x5 B-I-N-G-O number layout:
  // Col 0 (B): 1-15, Col 1 (I): 16-30, Col 2 (N): 31-45 (center FREE), Col 3 (G): 46-60, Col 4 (O): 61-75
  if (gridSize === 5) {
    const ranges = [
      [1, 15],
      [16, 30],
      [31, 45],
      [46, 60],
      [61, 75],
    ];

    const colNumbers: number[][] = [];
    for (let c = 0; c < 5; c++) {
      const [min, max] = ranges[c];
      const nums: number[] = [];
      while (nums.length < 5) {
        const n = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!nums.includes(n)) nums.push(n);
      }
      colNumbers.push(nums);
    }

    const deck: BingoCellState[] = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const idx = r * 5 + c;
        if (idx === 12) {
          deck.push({
            id: `c-12`,
            text: "FREE",
            emoji: "⭐",
            isFree: true,
            marked: true,
          });
        } else {
          const num = colNumbers[c][r];
          deck.push({
            id: `c-${idx}`,
            text: `${num}`,
            emoji: "🎯",
            isFree: false,
            marked: false,
          });
        }
      }
    }
    return deck;
  }

  // For 3x3 or 4x4 or generic number cards:
  const poolNumbers: number[] = [];
  while (poolNumbers.length < total) {
    const n = Math.floor(Math.random() * 75) + 1;
    if (!poolNumbers.includes(n)) poolNumbers.push(n);
  }

  return poolNumbers.map((num, idx) => {
    const isCenter = hasFree && idx === centerIdx;
    if (isCenter) {
      return {
        id: `c-${idx}`,
        text: "FREE",
        emoji: "⭐",
        isFree: true,
        marked: true,
      };
    }
    return {
      id: `c-${idx}`,
      text: `${num}`,
      emoji: "🎯",
      isFree: false,
      marked: false,
    };
  });
}

function generateCallPool(gridSize: number, cards: BingoCellState[], difficulty: string = "mixed"): CallBall[] {
  const pool: CallBall[] = [];
  const letters = ["B", "I", "N", "G", "O"];

  // Check if cards are pure numbers
  const isNumberCards = cards.filter((c) => !c.isFree).every((c) => !isNaN(Number(c.text.trim())));

  if (isNumberCards || difficulty === "numbers") {
    // 75-ball standard bingo calls
    for (let i = 1; i <= 75; i++) {
      const colIndex = Math.floor((i - 1) / 15);
      pool.push({
        id: `call-num-${i}`,
        label: `${letters[colIndex]}-${i}`,
        letter: letters[colIndex],
        number: i,
      });
    }
  } else {
    // Extract unique labels from card cells
    const uniqueTexts = Array.from(new Set(cards.filter((c) => !c.isFree).map((c) => c.text)));
    if (uniqueTexts.length >= 8) {
      uniqueTexts.forEach((text, index) => {
        const col = index % (letters.length >= gridSize ? gridSize : 5);
        pool.push({
          id: `call-card-${index}`,
          label: text,
          letter: letters[col],
          number: index + 1,
        });
      });
    } else {
      // Fallback 75-ball standard
      for (let i = 1; i <= 75; i++) {
        const colIndex = Math.floor((i - 1) / 15);
        pool.push({
          id: `call-num-${i}`,
          label: `${letters[colIndex]}-${i}`,
          letter: letters[colIndex],
          number: i,
        });
      }
    }
  }

  // Shuffle call pool using Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool;
}

/**
 * Scans all rows, columns, diagonals, and corners for completed lines
 */
export function getAllCompletedLines(gridSize: number, cells: BingoCellState[]): { lines: number[][]; isFullHouse: boolean } {
  const isMarked = (idx: number) => cells[idx]?.marked || cells[idx]?.isFree;
  const completed: number[][] = [];

  // Rows
  for (let r = 0; r < gridSize; r++) {
    const row: number[] = [];
    let win = true;
    for (let c = 0; c < gridSize; c++) {
      const idx = r * gridSize + c;
      row.push(idx);
      if (!isMarked(idx)) {
        win = false;
        break;
      }
    }
    if (win) completed.push(row);
  }

  // Columns
  for (let c = 0; c < gridSize; c++) {
    const col: number[] = [];
    let win = true;
    for (let r = 0; r < gridSize; r++) {
      const idx = r * gridSize + c;
      col.push(idx);
      if (!isMarked(idx)) {
        win = false;
        break;
      }
    }
    if (win) completed.push(col);
  }

  // Diagonals
  const diag1: number[] = [];
  let d1Win = true;
  for (let i = 0; i < gridSize; i++) {
    const idx = i * gridSize + i;
    diag1.push(idx);
    if (!isMarked(idx)) {
      d1Win = false;
      break;
    }
  }
  if (d1Win) completed.push(diag1);

  const diag2: number[] = [];
  let d2Win = true;
  for (let i = 0; i < gridSize; i++) {
    const idx = i * gridSize + (gridSize - 1 - i);
    diag2.push(idx);
    if (!isMarked(idx)) {
      d2Win = false;
      break;
    }
  }
  if (d2Win) completed.push(diag2);

  // Four Corners
  if (gridSize >= 4) {
    const corners = [0, gridSize - 1, gridSize * (gridSize - 1), gridSize * gridSize - 1];
    if (corners.every((idx) => isMarked(idx))) {
      completed.push(corners);
    }
  }

  const isFullHouse = cells.every((c) => c.marked || c.isFree);

  return { lines: completed, isFullHouse };
}

function drawNextBall(room: BingoRoom): CallBall | null {
  if (room.callPool.length === 0) {
    return null;
  }

  const ball = room.callPool.shift()!;
  room.drawnBalls.unshift(ball);
  room.currentBall = ball;

  broadcastToRoom(room, {
    type: "BALL_DRAWN",
    ball,
    drawnCount: room.drawnBalls.length,
    remainingPool: room.callPool.length,
  });

  return ball;
}

function stopRoomTimers(room: BingoRoom) {
  if (room.callerTimerId) {
    clearInterval(room.callerTimerId);
    room.callerTimerId = undefined;
  }
  if (room.matchTimerId) {
    clearInterval(room.matchTimerId);
    room.matchTimerId = undefined;
  }
}

function endMatchWithWinner(room: BingoRoom, winnerSlot: 1 | 2, reason: string, winningLine?: number[]) {
  stopRoomTimers(room);
  room.gameStatus = "won";
  room.winnerSlot = winnerSlot;
  room.winningLine = winningLine || null;

  if (winnerSlot === 1) {
    room.p1SeriesWins += 1;
  } else {
    room.p2SeriesWins += 1;
  }

  const winner = winnerSlot === 1 ? room.player1 : room.player2!;
  const runnerUp = winnerSlot === 1 ? room.player2! : room.player1;

  // Persist outcome to database
  if (winner && runnerUp) {
    db.recordMatchOutcome(
      winner.userId || winner.id,
      runnerUp.userId || runnerUp.id,
      winner.score,
      runnerUp.score,
      room.gameMode,
      room.gridSize,
      room.pairCode || room.code
    );
  }

  broadcastToRoom(room, {
    type: "MATCH_COMPLETE",
    winnerSlot,
    winnerName: winner.name,
    winnerAvatar: winner.avatar,
    winningLine: winningLine || [],
    reason,
    stats: {
      p1Score: room.player1.score,
      p1Lines: room.player1.linesCount,
      p1Combo: room.player1.comboMultiplier,
      p2Score: room.player2 ? room.player2.score : 0,
      p2Lines: room.player2 ? room.player2.linesCount : 0,
      p2Combo: room.player2 ? room.player2.comboMultiplier : 1,
      matchTime: Math.max(0, room.timeLimitSec - room.remainingTimeSec),
      p1SeriesWins: room.p1SeriesWins,
      p2SeriesWins: room.p2SeriesWins,
      gameMode: room.gameMode,
    },
  });
}

function extractUserFromHeader(req: Request): any | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return db.getUserByToken(token);
}

export function registerBingoRoomRoutes(app: Express) {
  // ==========================================
  // AUTH & USER ROUTES
  // ==========================================
  app.post("/api/auth/register", (req: Request, res: Response) => {
    try {
      const { username, password, avatar } = req.body;
      const result = db.registerUser(username, password, avatar);
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const result = db.loginUser(username, password);
      if (result.error) {
        return res.status(401).json({ error: result.error });
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Login failed" });
    }
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.json({ user });
  });

  app.post("/api/auth/update-avatar", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { avatar } = req.body;
    const updated = db.updateUserAvatar(user.id, avatar);
    res.json({ user: updated });
  });

  app.get("/api/users/search", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    const query = String(req.query.q || "");
    const results = db.searchUsers(query, user ? user.id : "");
    res.json({ users: results });
  });

  app.get("/api/users/:id", (req: Request, res: Response) => {
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  });

  // ==========================================
  // FRIENDS ROUTES
  // ==========================================
  app.get("/api/friends", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const friends = db.getFriends(user.id);
    res.json({ friends });
  });

  app.get("/api/friends/requests", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const requests = db.getFriendRequests(user.id);
    res.json(requests);
  });

  app.post("/api/friends/request", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { targetUsername } = req.body;
    const result = db.sendFriendRequest(user.id, targetUsername);
    if (!result.success) return res.status(400).json({ error: result.message });
    res.json(result);
  });

  app.post("/api/friends/accept", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { friendshipId } = req.body;
    const ok = db.acceptFriendRequest(user.id, friendshipId);
    res.json({ success: ok });
  });

  app.post("/api/friends/reject", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { friendshipId } = req.body;
    const ok = db.rejectFriendRequest(user.id, friendshipId);
    res.json({ success: ok });
  });

  app.post("/api/friends/remove", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { friendId } = req.body;
    const ok = db.removeFriend(user.id, friendId);
    res.json({ success: ok });
  });

  // ==========================================
  // PRIVATE CHAT ROUTES
  // ==========================================
  app.get("/api/chat/:friendId", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const messages = db.getConversationMessages(user.id, req.params.friendId);
    res.json({ messages });
  });

  app.post("/api/chat/send", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { friendId, text } = req.body;
    const msg = db.sendPrivateMessage(user.id, friendId, text);
    if (!msg) return res.status(400).json({ error: "Failed to send message" });
    res.json({ message: msg });
  });

  // ==========================================
  // NOTIFICATIONS ROUTES
  // ==========================================
  app.get("/api/notifications", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const notifications = db.getUserNotifications(user.id);
    res.json({ notifications });
  });

  app.post("/api/notifications/read-all", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    db.markAllNotificationsRead(user.id);
    res.json({ success: true });
  });

  app.post("/api/notifications/read/:id", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    db.markNotificationRead(user.id, req.params.id);
    res.json({ success: true });
  });

  // ==========================================
  // MATCH HISTORY ROUTE
  // ==========================================
  app.get("/api/history", (req: Request, res: Response) => {
    const user = extractUserFromHeader(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const history = db.getUserMatchHistory(user.id);
    res.json({ history });
  });

  // ==========================================
  // MULTIPLAYER PAIR & ROOM ROUTES
  // ==========================================
  app.post("/api/multiplayer/create-pair", (req: Request, res: Response) => {
    try {
      const user = extractUserFromHeader(req);
      const {
        hostName = user?.username || "Player 1",
        hostAvatar = user?.avatar || "⚡",
        gridSize = 5,
        title = "Bingo Tingo Duel",
        gameMode = "battle",
        targetLines = 3,
        timeLimitSec = 300,
        powerUpsEnabled = true,
        cardDifficulty = "numbers",
        cards = [],
      } = req.body;

      const pairCode = generatePairCode();
      const code = pairCode;

      // Generate the IDENTICAL deck once for both players
      const identicalDeck = generateIdenticalBingoDeck(gridSize, cards, cardDifficulty);
      const callPool = generateCallPool(gridSize, identicalDeck, cardDifficulty);

      const room: BingoRoom = {
        code,
        pairCode,
        createdAt: Date.now(),
        gridSize,
        title,
        gameMode: gameMode as GameMode,
        targetLines: targetLines || 3,
        timeLimitSec: timeLimitSec || 300,
        remainingTimeSec: timeLimitSec || 300,
        powerUpsEnabled: Boolean(powerUpsEnabled),
        cardDifficulty,
        gameStatus: "waiting",
        initialTemplateCards: cards,
        player1: {
          id: user?.id || `p1-${Date.now()}`,
          userId: user?.id,
          name: hostName,
          avatar: hostAvatar,
          slot: 1,
          isReady: false,
          connected: false,
          score: 0,
          linesCount: 0,
          completedLines: [],
          comboMultiplier: 1,
          hasShield: false,
          doublePointsActive: false,
          frozenUntil: 0,
          powerUps: {
            "double-points": 2,
            "reveal-number": 2,
            "shield": 1,
            "swap-card": 1,
            "block-opponent": 1,
            "lucky-mark": 1,
            "time-boost": 1,
            "combo-multiplier": 2,
          },
          cards: identicalDeck,
        },
        player2: null,
        spectators: [],
        callPool,
        drawnBalls: [],
        currentBall: null,
        winnerSlot: null,
        winningLine: null,
        autoCaller: true,
        callIntervalSec: 5,
        p1SeriesWins: 0,
        p2SeriesWins: 0,
        currentMatch: 1,
        moveHistory: [],
      };

      rooms.set(code, room);

      res.json({
        success: true,
        pairCode,
        roomCode: code,
        playerSlot: 1,
        room: {
          code,
          pairCode,
          title: room.title,
          gridSize: room.gridSize,
          gameMode: room.gameMode,
          timeLimitSec: room.timeLimitSec,
          targetLines: room.targetLines,
          powerUpsEnabled: room.powerUpsEnabled,
          gameStatus: room.gameStatus,
          player1Name: room.player1.name,
          player1Avatar: room.player1.avatar,
          player2Name: null,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create pair" });
    }
  });

  // Direct invite friend to play
  app.post("/api/multiplayer/invite-friend", (req: Request, res: Response) => {
    try {
      const user = extractUserFromHeader(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const {
        friendId,
        gridSize = 5,
        gameMode = "battle",
        cardDifficulty = "numbers",
        cards = [],
      } = req.body;

      const friend = db.getUserById(friendId);
      if (!friend) return res.status(404).json({ error: "Friend not found" });

      const pairCode = generatePairCode();
      const code = pairCode;

      // Server generates the IDENTICAL deck
      const identicalDeck = generateIdenticalBingoDeck(gridSize, cards, cardDifficulty);
      const callPool = generateCallPool(gridSize, identicalDeck, cardDifficulty);

      const room: BingoRoom = {
        code,
        pairCode,
        createdAt: Date.now(),
        gridSize,
        title: `${user.username} vs ${friend.username}`,
        gameMode: gameMode as GameMode,
        targetLines: 3,
        timeLimitSec: 300,
        remainingTimeSec: 300,
        powerUpsEnabled: true,
        cardDifficulty,
        gameStatus: "waiting",
        initialTemplateCards: cards,
        player1: {
          id: user.id,
          userId: user.id,
          name: user.username,
          avatar: user.avatar,
          slot: 1,
          isReady: false,
          connected: false,
          score: 0,
          linesCount: 0,
          completedLines: [],
          comboMultiplier: 1,
          hasShield: false,
          doublePointsActive: false,
          frozenUntil: 0,
          powerUps: {
            "double-points": 2,
            "reveal-number": 2,
            "shield": 1,
            "swap-card": 1,
            "block-opponent": 1,
            "lucky-mark": 1,
            "time-boost": 1,
            "combo-multiplier": 2,
          },
          cards: identicalDeck,
        },
        player2: null,
        spectators: [],
        callPool,
        drawnBalls: [],
        currentBall: null,
        winnerSlot: null,
        winningLine: null,
        autoCaller: true,
        callIntervalSec: 5,
        p1SeriesWins: 0,
        p2SeriesWins: 0,
        currentMatch: 1,
        moveHistory: [],
      };

      rooms.set(code, room);

      // Push real-time Game Invitation to friend
      db.addNotification(
        friend.id,
        "game_invite",
        "🎮 Game Invitation",
        `${user.username} invited you to play Bingo Tingo!`,
        {
          pairCode,
          fromUserId: user.id,
          fromUserName: user.username,
          gameMode,
          gridSize,
        }
      );

      res.json({
        success: true,
        pairCode,
        roomCode: code,
        message: `Invitation sent to ${friend.username}!`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to invite friend" });
    }
  });

  // Legacy & Alias endpoint for create-room
  app.post("/api/multiplayer/create-room", (req: Request, res: Response) => {
    // Re-route to create-pair logic
    try {
      const user = extractUserFromHeader(req);
      const {
        hostName = user?.username || "Player 1",
        hostAvatar = user?.avatar || "⚡",
        gridSize = 4,
        title = "Bingo Tingo Duel",
        gameMode = "battle",
        targetLines = 3,
        timeLimitSec = 300,
        powerUpsEnabled = true,
        cardDifficulty = "mixed",
        cards = [],
      } = req.body;

      const code = generatePairCode();
      const identicalDeck = generateIdenticalBingoDeck(gridSize, cards, cardDifficulty);
      const callPool = generateCallPool(gridSize, identicalDeck, cardDifficulty);

      const room: BingoRoom = {
        code,
        pairCode: code,
        createdAt: Date.now(),
        gridSize,
        title,
        gameMode: gameMode as GameMode,
        targetLines: targetLines || 3,
        timeLimitSec: timeLimitSec || 300,
        remainingTimeSec: timeLimitSec || 300,
        powerUpsEnabled: Boolean(powerUpsEnabled),
        cardDifficulty,
        gameStatus: "waiting",
        initialTemplateCards: cards,
        player1: {
          id: user?.id || `p1-${Date.now()}`,
          userId: user?.id,
          name: hostName,
          avatar: hostAvatar,
          slot: 1,
          isReady: false,
          connected: false,
          score: 0,
          linesCount: 0,
          completedLines: [],
          comboMultiplier: 1,
          hasShield: false,
          doublePointsActive: false,
          frozenUntil: 0,
          powerUps: {
            "double-points": 2,
            "reveal-number": 2,
            "shield": 1,
            "swap-card": 1,
            "block-opponent": 1,
            "lucky-mark": 1,
            "time-boost": 1,
            "combo-multiplier": 2,
          },
          cards: identicalDeck,
        },
        player2: null,
        spectators: [],
        callPool,
        drawnBalls: [],
        currentBall: null,
        winnerSlot: null,
        winningLine: null,
        autoCaller: true,
        callIntervalSec: 5,
        p1SeriesWins: 0,
        p2SeriesWins: 0,
        currentMatch: 1,
        moveHistory: [],
      };

      rooms.set(code, room);

      res.json({
        success: true,
        roomCode: code,
        pairCode: code,
        playerSlot: 1,
        room: {
          code,
          pairCode: code,
          title: room.title,
          gridSize: room.gridSize,
          gameMode: room.gameMode,
          timeLimitSec: room.timeLimitSec,
          targetLines: room.targetLines,
          powerUpsEnabled: room.powerUpsEnabled,
          gameStatus: room.gameStatus,
          player1Name: room.player1.name,
          player1Avatar: room.player1.avatar,
          player2Name: null,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create room" });
    }
  });

  // Join Room / Pair Code endpoint
  app.post("/api/multiplayer/join-room", (req: Request, res: Response) => {
    try {
      const user = extractUserFromHeader(req);
      const {
        roomCode,
        pairCode,
        playerName = user?.username || "Player 2",
        playerAvatar = user?.avatar || "🔥",
      } = req.body;

      const searchCode = pairCode || roomCode;
      const room = findRoom(searchCode);

      if (!room) {
        return res.status(404).json({ error: "Pair Code not found. Please verify the code." });
      }

      if (room.player2 && room.player2.connected) {
        return res.status(409).json({ error: "Match already has 2 players. Join as Spectator instead!" });
      }

      // Symmetrical IDENTICAL CARDS for both players!
      // Player 2 receives the exact same cards in the exact same positions
      const p2Cards: BingoCellState[] = room.player1.cards.map((c, i) => ({
        id: `p2-c-${i}`,
        text: c.text,
        emoji: c.emoji,
        isFree: Boolean(c.isFree),
        marked: Boolean(c.isFree),
      }));

      room.player2 = {
        id: user?.id || `p2-${Date.now()}`,
        userId: user?.id,
        name: playerName,
        avatar: playerAvatar,
        slot: 2,
        isReady: false,
        connected: false,
        score: 0,
        linesCount: 0,
        completedLines: [],
        comboMultiplier: 1,
        hasShield: false,
        doublePointsActive: false,
        frozenUntil: 0,
        powerUps: {
          "double-points": 2,
          "reveal-number": 2,
          "shield": 1,
          "swap-card": 1,
          "block-opponent": 1,
          "lucky-mark": 1,
          "time-boost": 1,
          "combo-multiplier": 2,
        },
        cards: p2Cards,
      };

      res.json({
        success: true,
        roomCode: room.code,
        pairCode: room.pairCode,
        playerSlot: 2,
        room: {
          code: room.code,
          pairCode: room.pairCode,
          title: room.title,
          gridSize: room.gridSize,
          gameMode: room.gameMode,
          timeLimitSec: room.timeLimitSec,
          targetLines: room.targetLines,
          powerUpsEnabled: room.powerUpsEnabled,
          gameStatus: room.gameStatus,
          player1Name: room.player1.name,
          player1Avatar: room.player1.avatar,
          player2Name: room.player2.name,
          player2Avatar: room.player2.avatar,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to join room" });
    }
  });

  // Alias for join-pair
  app.post("/api/multiplayer/join-pair", (req: Request, res: Response) => {
    // Forward to join-room logic
    const user = extractUserFromHeader(req);
    const { pairCode, playerName = user?.username || "Player 2", playerAvatar = user?.avatar || "🔥" } = req.body;
    const room = findRoom(pairCode);

    if (!room) {
      return res.status(404).json({ error: "Pair Code not found. Please double check the code." });
    }

    if (room.player2 && room.player2.connected) {
      return res.status(409).json({ error: "Match already full." });
    }

    const p2Cards: BingoCellState[] = room.player1.cards.map((c, i) => ({
      id: `p2-c-${i}`,
      text: c.text,
      emoji: c.emoji,
      isFree: Boolean(c.isFree),
      marked: Boolean(c.isFree),
    }));

    room.player2 = {
      id: user?.id || `p2-${Date.now()}`,
      userId: user?.id,
      name: playerName,
      avatar: playerAvatar,
      slot: 2,
      isReady: false,
      connected: false,
      score: 0,
      linesCount: 0,
      completedLines: [],
      comboMultiplier: 1,
      hasShield: false,
      doublePointsActive: false,
      frozenUntil: 0,
      powerUps: {
        "double-points": 2,
        "reveal-number": 2,
        "shield": 1,
        "swap-card": 1,
        "block-opponent": 1,
        "lucky-mark": 1,
        "time-boost": 1,
        "combo-multiplier": 2,
      },
      cards: p2Cards,
    };

    res.json({
      success: true,
      roomCode: room.code,
      pairCode: room.pairCode,
      playerSlot: 2,
      room: {
        code: room.code,
        pairCode: room.pairCode,
        title: room.title,
        gridSize: room.gridSize,
        gameMode: room.gameMode,
        timeLimitSec: room.timeLimitSec,
        targetLines: room.targetLines,
        powerUpsEnabled: room.powerUpsEnabled,
        gameStatus: room.gameStatus,
        player1Name: room.player1.name,
        player1Avatar: room.player1.avatar,
        player2Name: room.player2.name,
        player2Avatar: room.player2.avatar,
      },
    });
  });

  // Get Room Status endpoint
  app.get("/api/multiplayer/room/:code", (req: Request, res: Response) => {
    const room = findRoom(req.params.code);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.json({
      code: room.code,
      pairCode: room.pairCode,
      title: room.title,
      gridSize: room.gridSize,
      gameMode: room.gameMode,
      timeLimitSec: room.timeLimitSec,
      remainingTimeSec: room.remainingTimeSec,
      targetLines: room.targetLines,
      powerUpsEnabled: room.powerUpsEnabled,
      gameStatus: room.gameStatus,
      player1: {
        name: room.player1.name,
        avatar: room.player1.avatar,
        connected: room.player1.connected,
        isReady: room.player1.isReady,
        score: room.player1.score,
        linesCount: room.player1.linesCount,
      },
      player2: room.player2
        ? {
            name: room.player2.name,
            avatar: room.player2.avatar,
            connected: room.player2.connected,
            isReady: room.player2.isReady,
            score: room.player2.score,
            linesCount: room.player2.linesCount,
          }
        : null,
      spectatorsCount: room.spectators.length,
      currentBall: room.currentBall,
      drawnCount: room.drawnBalls.length,
      winnerSlot: room.winnerSlot,
      p1SeriesWins: room.p1SeriesWins,
      p2SeriesWins: room.p2SeriesWins,
    });
  });
}

export function setupBingoWebSocket(httpServer: HttpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/bingo" });

  wss.on("connection", (ws: WebSocket) => {
    let currentRoomCode: string | null = null;
    let currentPlayerSlot: 1 | 2 | null = null;
    let identifiedUserId: string | null = null;
    let isSpectator = false;

    ws.on("message", (raw: string) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case "USER_IDENTIFY": {
            const { userId } = msg;
            if (userId) {
              identifiedUserId = userId;
              db.registerUserSocket(userId, ws);
              ws.send(JSON.stringify({ type: "USER_IDENTIFIED", userId }));
            }
            break;
          }

          case "JOIN_ROOM": {
            const { roomCode, pairCode, playerSlot, playerName, playerAvatar, role } = msg;
            const searchCode = pairCode || roomCode;
            const room = findRoom(searchCode);

            if (!room) {
              ws.send(JSON.stringify({ type: "ERROR", message: "Room or Pair Code not found" }));
              return;
            }

            currentRoomCode = room.code;

            if (role === "spectator") {
              isSpectator = true;
              room.spectators.push({
                id: `spec-${Date.now()}`,
                name: playerName || "Spectator",
                ws,
              });

              ws.send(
                JSON.stringify({
                  type: "ROOM_JOINED",
                  role: "spectator",
                  roomCode: room.code,
                  pairCode: room.pairCode,
                  roomState: {
                    code: room.code,
                    pairCode: room.pairCode,
                    title: room.title,
                    gridSize: room.gridSize,
                    gameMode: room.gameMode,
                    timeLimitSec: room.timeLimitSec,
                    remainingTimeSec: room.remainingTimeSec,
                    targetLines: room.targetLines,
                    powerUpsEnabled: room.powerUpsEnabled,
                    gameStatus: room.gameStatus,
                    player1: {
                      name: room.player1.name,
                      avatar: room.player1.avatar,
                      connected: room.player1.connected,
                      isReady: room.player1.isReady,
                      score: room.player1.score,
                      linesCount: room.player1.linesCount,
                      combo: room.player1.comboMultiplier,
                      cards: room.player1.cards,
                    },
                    player2: room.player2
                      ? {
                          name: room.player2.name,
                          avatar: room.player2.avatar,
                          connected: room.player2.connected,
                          isReady: room.player2.isReady,
                          score: room.player2.score,
                          linesCount: room.player2.linesCount,
                          combo: room.player2.comboMultiplier,
                          cards: room.player2.cards,
                        }
                      : null,
                    drawnBalls: room.drawnBalls,
                    currentBall: room.currentBall,
                    winnerSlot: room.winnerSlot,
                    winningLine: room.winningLine,
                    autoCaller: room.autoCaller,
                    p1SeriesWins: room.p1SeriesWins,
                    p2SeriesWins: room.p2SeriesWins,
                  },
                })
              );
              return;
            }

            // Player Join
            currentPlayerSlot = Number(playerSlot) as 1 | 2;
            if (currentPlayerSlot === 1) {
              room.player1.ws = ws;
              room.player1.connected = true;
              if (playerName) room.player1.name = playerName;
              if (playerAvatar) room.player1.avatar = playerAvatar;
            } else if (currentPlayerSlot === 2) {
              if (!room.player2) {
                // Symmetrical identical cards
                const p2Cards = room.player1.cards.map((c, i) => ({
                  id: `p2-c-${i}`,
                  text: c.text,
                  emoji: c.emoji,
                  isFree: Boolean(c.isFree),
                  marked: Boolean(c.isFree),
                }));

                room.player2 = {
                  id: `p2-${Date.now()}`,
                  name: playerName || "Player 2",
                  avatar: playerAvatar || "🔥",
                  slot: 2,
                  isReady: false,
                  connected: true,
                  score: 0,
                  linesCount: 0,
                  completedLines: [],
                  comboMultiplier: 1,
                  hasShield: false,
                  doublePointsActive: false,
                  frozenUntil: 0,
                  powerUps: {
                    "double-points": 2,
                    "reveal-number": 2,
                    "shield": 1,
                    "swap-card": 1,
                    "block-opponent": 1,
                    "lucky-mark": 1,
                    "time-boost": 1,
                    "combo-multiplier": 2,
                  },
                  cards: p2Cards,
                };
              }
              room.player2.ws = ws;
              room.player2.connected = true;
              if (playerName) room.player2.name = playerName;
              if (playerAvatar) room.player2.avatar = playerAvatar;
            }

            // Send initial state to joining player
            ws.send(
              JSON.stringify({
                type: "ROOM_JOINED",
                role: "player",
                slot: currentPlayerSlot,
                roomCode: room.code,
                pairCode: room.pairCode,
                roomState: {
                  code: room.code,
                  pairCode: room.pairCode,
                  title: room.title,
                  gridSize: room.gridSize,
                  gameMode: room.gameMode,
                  timeLimitSec: room.timeLimitSec,
                  remainingTimeSec: room.remainingTimeSec,
                  targetLines: room.targetLines,
                  powerUpsEnabled: room.powerUpsEnabled,
                  gameStatus: room.gameStatus,
                  player1: {
                    name: room.player1.name,
                    avatar: room.player1.avatar,
                    connected: room.player1.connected,
                    isReady: room.player1.isReady,
                    score: room.player1.score,
                    linesCount: room.player1.linesCount,
                    combo: room.player1.comboMultiplier,
                    cards: room.player1.cards,
                    powerUps: room.player1.powerUps,
                  },
                  player2: room.player2
                    ? {
                        name: room.player2.name,
                        avatar: room.player2.avatar,
                        connected: room.player2.connected,
                        isReady: room.player2.isReady,
                        score: room.player2.score,
                        linesCount: room.player2.linesCount,
                        combo: room.player2.comboMultiplier,
                        cards: room.player2.cards,
                        powerUps: room.player2.powerUps,
                      }
                    : null,
                  drawnBalls: room.drawnBalls,
                  currentBall: room.currentBall,
                  winnerSlot: room.winnerSlot,
                  winningLine: room.winningLine,
                  autoCaller: room.autoCaller,
                  p1SeriesWins: room.p1SeriesWins,
                  p2SeriesWins: room.p2SeriesWins,
                },
              })
            );

            // Broadcast presence & ready update
            broadcastToRoom(room, {
              type: "PLAYER_STATUS_CHANGED",
              player1Connected: room.player1.connected,
              player1Ready: room.player1.isReady,
              player1Name: room.player1.name,
              player1Avatar: room.player1.avatar,
              player2Connected: Boolean(room.player2?.connected),
              player2Ready: Boolean(room.player2?.isReady),
              player2Name: room.player2?.name,
              player2Avatar: room.player2?.avatar,
              bothReady: Boolean(room.player1.isReady && room.player2?.isReady),
            });

            break;
          }

          case "TOGGLE_READY": {
            if (!currentRoomCode || !currentPlayerSlot) return;
            const room = findRoom(currentRoomCode);
            if (!room) return;

            const player = currentPlayerSlot === 1 ? room.player1 : room.player2;
            if (player) {
              player.isReady = !player.isReady;

              const bothReady = Boolean(room.player1.isReady && room.player2?.isReady);

              broadcastToRoom(room, {
                type: "READY_STATUS_UPDATED",
                slot: currentPlayerSlot,
                isReady: player.isReady,
                bothReady,
              });

              if (bothReady) {
                broadcastToRoom(room, {
                  type: "BOTH_READY",
                  ready: true,
                });
              }
            }
            break;
          }

          case "START_GAME": {
            if (!currentRoomCode || currentPlayerSlot !== 1) return;
            const room = findRoom(currentRoomCode);
            if (!room) return;

            // Enforcement: Both players must be connected and ready!
            if (!room.player2 || !room.player2.connected) {
              ws.send(
                JSON.stringify({
                  type: "ERROR",
                  message: "Waiting for opponent to connect with Pair Code!",
                })
              );
              return;
            }

            if (!room.player1.isReady || !room.player2.isReady) {
              ws.send(
                JSON.stringify({
                  type: "ERROR",
                  message: "Both players must click READY before starting the match!",
                })
              );
              return;
            }

            stopRoomTimers(room);

            room.gameStatus = "starting";
            broadcastToRoom(room, {
              type: "COUNTDOWN_START",
              countdownSeconds: 3,
            });

            // Start after 3-second countdown
            setTimeout(() => {
              room.gameStatus = "playing";
              room.winnerSlot = null;
              room.winningLine = null;
              room.drawnBalls = [];
              room.currentBall = null;
              room.remainingTimeSec = room.timeLimitSec;
              room.callPool = generateCallPool(room.gridSize, room.player1.cards, room.cardDifficulty);

              // Reset combo & status
              room.player1.score = 0;
              room.player1.linesCount = 0;
              room.player1.completedLines = [];
              room.player1.comboMultiplier = 1;
              room.player1.hasShield = false;
              room.player1.doublePointsActive = false;
              room.player1.frozenUntil = 0;

              // Guarantee identical cards on start
              room.player1.cards.forEach((c) => {
                c.marked = Boolean(c.isFree);
              });

              if (room.player2) {
                room.player2.score = 0;
                room.player2.linesCount = 0;
                room.player2.completedLines = [];
                room.player2.comboMultiplier = 1;
                room.player2.hasShield = false;
                room.player2.doublePointsActive = false;
                room.player2.frozenUntil = 0;

                room.player2.cards = room.player1.cards.map((c, i) => ({
                  id: `p2-c-${i}`,
                  text: c.text,
                  emoji: c.emoji,
                  isFree: Boolean(c.isFree),
                  marked: Boolean(c.isFree),
                }));
              }

              const { autoCaller = true, callIntervalSec = 5 } = msg;
              room.autoCaller = autoCaller;
              room.callIntervalSec = callIntervalSec;

              broadcastToRoom(room, {
                type: "GAME_STARTED",
                autoCaller: room.autoCaller,
                callIntervalSec: room.callIntervalSec,
                timeLimitSec: room.timeLimitSec,
                player1Cards: room.player1.cards,
                player2Cards: room.player2?.cards,
              });

              // Draw initial ball
              drawNextBall(room);

              // Auto Caller Timer
              if (room.autoCaller) {
                room.callerTimerId = setInterval(() => {
                  if (room.gameStatus === "playing") {
                    drawNextBall(room);
                  } else {
                    stopRoomTimers(room);
                  }
                }, room.callIntervalSec * 1000);
              }

              // Match Duration Timer
              if (room.timeLimitSec > 0) {
                room.matchTimerId = setInterval(() => {
                  if (room.gameStatus !== "playing") return;
                  room.remainingTimeSec -= 1;

                  if (room.remainingTimeSec === 10) {
                    broadcastToRoom(room, {
                      type: "TIMER_WARNING",
                      secondsRemaining: 10,
                    });
                  }

                  if (room.remainingTimeSec <= 0) {
                    const p1 = room.player1;
                    const p2 = room.player2!;
                    const winnerSlot = p1.score >= p2.score ? 1 : 2;
                    endMatchWithWinner(room, winnerSlot, "Time Expired - Highest Score Wins!");
                  } else if (room.remainingTimeSec % 5 === 0) {
                    broadcastToRoom(room, {
                      type: "TIMER_TICK",
                      remainingTimeSec: room.remainingTimeSec,
                    });
                  }
                }, 1000);
              }
            }, 3000);

            break;
          }

          case "DRAW_BALL": {
            if (!currentRoomCode) return;
            const room = findRoom(currentRoomCode);
            if (!room || room.gameStatus !== "playing") return;
            drawNextBall(room);
            break;
          }

          case "MARK_CELL": {
            // Anti-cheat verified marking
            if (!currentRoomCode || !currentPlayerSlot) return;
            const room = findRoom(currentRoomCode);
            if (!room || room.gameStatus !== "playing") return;

            const player = currentPlayerSlot === 1 ? room.player1 : room.player2;
            if (!player) return;

            if (Date.now() < player.frozenUntil) {
              ws.send(
                JSON.stringify({
                  type: "ACTION_BLOCKED",
                  message: "You are frozen by opponent! Wait for frost to melt.",
                })
              );
              return;
            }

            const { cellIndex } = msg;
            const cell = player.cards[cellIndex];
            if (!cell) return;

            const wasMarked = cell.marked;
            const isCurrentlyDrawn =
              cell.isFree ||
              room.drawnBalls.some(
                (b) =>
                  b.label.toLowerCase() === cell.text.toLowerCase() ||
                  (b.number !== undefined && cell.text.includes(String(b.number)))
              );

            if (!wasMarked && !isCurrentlyDrawn && !msg.isLuckyMark) {
              ws.send(
                JSON.stringify({
                  type: "ILLEGAL_MOVE",
                  message: "This tile has not been called by the Bingo machine yet!",
                })
              );
              return;
            }

            // Mark or unmark cell on player's own card
            player.cards[cellIndex].marked = !wasMarked;

            if (!wasMarked) {
              // Points scoring calculation
              let points = 25;
              const now = Date.now();
              if (player.lastMarkTime && now - player.lastMarkTime < 3000) {
                player.comboMultiplier = Math.min(3.5, Number((player.comboMultiplier + 0.3).toFixed(1)));
                points += 15;
              } else {
                player.comboMultiplier = 1;
              }
              player.lastMarkTime = now;

              if (player.doublePointsActive) {
                points *= 2;
                player.doublePointsActive = false;
              }

              player.score += Math.round(points * player.comboMultiplier);
            }

            // Recalculate completed lines
            const { lines, isFullHouse } = getAllCompletedLines(room.gridSize, player.cards);
            const newLinesCount = lines.length;

            if (newLinesCount > player.linesCount) {
              const gained = newLinesCount - player.linesCount;
              player.score += gained * 150;
              broadcastToRoom(room, {
                type: "LINE_COMPLETED",
                slot: currentPlayerSlot,
                playerName: player.name,
                linesCount: newLinesCount,
                gainedLines: gained,
                score: player.score,
              });
            }
            player.linesCount = newLinesCount;
            player.completedLines = lines;

            // Broadcast cell mark to sync live boards
            broadcastToRoom(room, {
              type: "CELL_MARKED",
              slot: currentPlayerSlot,
              cellIndex,
              marked: player.cards[cellIndex].marked,
              score: player.score,
              linesCount: player.linesCount,
              comboMultiplier: player.comboMultiplier,
              cards: player.cards,
            });

            // Check Win Condition
            const winTarget = room.targetLines || 3;
            if (newLinesCount >= winTarget || isFullHouse) {
              endMatchWithWinner(
                room,
                currentPlayerSlot,
                isFullHouse ? "Full House Blackout!" : `Completed ${winTarget} Winning Lines!`,
                lines[0] || []
              );
            }

            break;
          }

          case "USE_POWERUP": {
            if (!currentRoomCode || !currentPlayerSlot) return;
            const room = findRoom(currentRoomCode);
            if (!room || room.gameStatus !== "playing" || !room.powerUpsEnabled) return;

            const player = currentPlayerSlot === 1 ? room.player1 : room.player2;
            const opponent = currentPlayerSlot === 1 ? room.player2 : room.player1;
            if (!player) return;

            const { powerUpType } = msg;
            if (!player.powerUps[powerUpType] || player.powerUps[powerUpType] <= 0) {
              ws.send(JSON.stringify({ type: "ERROR", message: "Power-up exhausted!" }));
              return;
            }

            player.powerUps[powerUpType] -= 1;
            let resultNotice = "";

            switch (powerUpType) {
              case "double-points":
                player.doublePointsActive = true;
                resultNotice = `${player.name} activated ⚡ DOUBLE POINTS!`;
                break;
              case "shield":
                player.hasShield = true;
                resultNotice = `${player.name} raised an 🛡️ UNBREAKABLE SHIELD!`;
                break;
              case "block-opponent":
                if (opponent) {
                  if (opponent.hasShield) {
                    opponent.hasShield = false;
                    resultNotice = `${opponent.name}'s 🛡️ SHIELD blocked the Freeze Attack!`;
                  } else {
                    opponent.frozenUntil = Date.now() + 5000;
                    resultNotice = `${player.name} ❄️ FROZE ${opponent.name} for 5 seconds!`;
                  }
                }
                break;
              case "time-boost":
                if (room.timeLimitSec > 0) {
                  room.remainingTimeSec += 15;
                  resultNotice = `${player.name} added ⏱️ +15 SECONDS!`;
                }
                break;
              case "combo-multiplier":
                player.comboMultiplier = Math.min(4.0, player.comboMultiplier + 1.5);
                player.score += 100;
                resultNotice = `${player.name} activated 🔥 COMBO MULTIPLIER (x${player.comboMultiplier})!`;
                break;
            }

            broadcastToRoom(room, {
              type: "POWERUP_USED",
              slot: currentPlayerSlot,
              powerUpType,
              remainingCount: player.powerUps[powerUpType],
              notice: resultNotice,
              player1Cards: room.player1.cards,
              player2Cards: room.player2?.cards,
            });
            break;
          }

          case "REMATCH_REQUEST": {
            if (!currentRoomCode || !currentPlayerSlot) return;
            const room = findRoom(currentRoomCode);
            if (!room) return;

            const player = currentPlayerSlot === 1 ? room.player1 : room.player2;
            if (player) player.rematchRequested = true;

            const opponent = currentPlayerSlot === 1 ? room.player2 : room.player1;

            if (player && opponent && player.rematchRequested && opponent.rematchRequested) {
              // BOTH agreed to rematch!
              // Requirement: "New Match, Same Players, New identical Card generated by server, New Game ID!"
              stopRoomTimers(room);

              room.gameStatus = "playing";
              room.winnerSlot = null;
              room.winningLine = null;
              room.drawnBalls = [];
              room.currentBall = null;
              room.currentMatch += 1;
              room.remainingTimeSec = room.timeLimitSec;
              room.player1.rematchRequested = false;
              if (room.player2) room.player2.rematchRequested = false;

              // Generate a BRAND NEW identical deck for both players!
              const newIdenticalDeck = generateIdenticalBingoDeck(
                room.gridSize,
                room.initialTemplateCards,
                room.cardDifficulty
              );
              room.player1.cards = newIdenticalDeck;
              room.player1.score = 0;
              room.player1.linesCount = 0;
              room.player1.completedLines = [];
              room.player1.comboMultiplier = 1;

              if (room.player2) {
                room.player2.cards = newIdenticalDeck.map((c, i) => ({
                  id: `p2-c-${i}`,
                  text: c.text,
                  emoji: c.emoji,
                  isFree: Boolean(c.isFree),
                  marked: Boolean(c.isFree),
                }));
                room.player2.score = 0;
                room.player2.linesCount = 0;
                room.player2.completedLines = [];
                room.player2.comboMultiplier = 1;
              }

              room.callPool = generateCallPool(room.gridSize, room.player1.cards, room.cardDifficulty);

              broadcastToRoom(room, {
                type: "REMATCH_STARTED",
                currentMatch: room.currentMatch,
                player1Cards: room.player1.cards,
                player2Cards: room.player2?.cards,
              });

              drawNextBall(room);

              if (room.autoCaller) {
                room.callerTimerId = setInterval(() => {
                  if (room.gameStatus === "playing") {
                    drawNextBall(room);
                  } else {
                    stopRoomTimers(room);
                  }
                }, room.callIntervalSec * 1000);
              }
            } else {
              // Notify opponent of rematch request
              broadcastToRoom(room, {
                type: "REMATCH_PENDING",
                requestedBySlot: currentPlayerSlot,
                requestedByName: player?.name,
              });
            }
            break;
          }

          case "REACTION": {
            if (!currentRoomCode || !currentPlayerSlot) return;
            const room = findRoom(currentRoomCode);
            if (!room) return;

            broadcastToRoom(room, {
              type: "PLAYER_REACTION",
              slot: currentPlayerSlot,
              reaction: msg.reaction || "🎉",
            });
            break;
          }
        }
      } catch (e) {
        console.error("WebSocket message parse error:", e);
      }
    });

    ws.on("close", () => {
      if (identifiedUserId) {
        db.unregisterUserSocket(identifiedUserId);
      }

      if (currentRoomCode) {
        const room = findRoom(currentRoomCode);
        if (room) {
          if (isSpectator) {
            room.spectators = room.spectators.filter((s) => s.ws !== ws);
          } else if (currentPlayerSlot === 1) {
            room.player1.connected = false;
            room.player1.ws = undefined;
          } else if (currentPlayerSlot === 2 && room.player2) {
            room.player2.connected = false;
            room.player2.ws = undefined;
          }

          broadcastToRoom(room, {
            type: "PLAYER_STATUS_CHANGED",
            player1Connected: room.player1.connected,
            player1Ready: room.player1.isReady,
            player1Name: room.player1.name,
            player1Avatar: room.player1.avatar,
            player2Connected: Boolean(room.player2?.connected),
            player2Ready: Boolean(room.player2?.isReady),
            player2Name: room.player2?.name,
            player2Avatar: room.player2?.avatar,
            spectatorsCount: room.spectators.length,
          });
        }
      }
    });
  });

  return wss;
}
