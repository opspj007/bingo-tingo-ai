import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Trophy,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Users,
  Wifi,
  Crown,
  Flame,
  Globe,
  ArrowLeft,
  Swords,
  Award,
  Bot,
  Eye,
} from "lucide-react";
import { BingoCell, GameMode, AIDifficulty, PowerUpType } from "../types";
import { TwoPlayerCell, CallBall, PlayerStats, SeriesState } from "./two-player/types";
import {
  playDabSound,
  playBallDrawSound,
  playBingoChime,
  speakBallAnnouncement,
  playPowerupSound,
  playShieldSound,
  playFreezeSound,
  playTimerWarningSound,
  playCountdownBeep,
  playComboSound,
} from "../utils/audioEffects";
import { usePlayerProfile } from "./two-player/usePlayerProfile";
import { useAIPlayer } from "./two-player/useAIPlayer";
import { LobbyView } from "./two-player/LobbyView";
import { ScoreboardHUD } from "./two-player/ScoreboardHUD";
import { PowerUpBar } from "./two-player/PowerUpBar";
import { PlayerBingoCard } from "./two-player/PlayerBingoCard";
import { BallCallerDisplay } from "./two-player/BallCallerDisplay";
import { MatchResultsModal } from "./two-player/MatchResultsModal";
import { PlayerProgressionModal } from "./two-player/PlayerProgressionModal";
import { QuickReactionOverlay } from "./two-player/QuickReactionOverlay";
import { SpectatorView } from "./two-player/SpectatorView";

interface TwoPlayerArenaProps {
  isOpen: boolean;
  onClose: () => void;
  sourceCells: BingoCell[];
  sourceTitle: string;
  sourceGridSize?: number;
  initialPairCode?: string;
  initialIsHost?: boolean;
}

export const TwoPlayerArena: React.FC<TwoPlayerArenaProps> = ({
  isOpen,
  onClose,
  sourceCells,
  sourceTitle,
  sourceGridSize = 4,
  initialPairCode,
  initialIsHost = false,
}) => {
  // Navigation: "menu" | "lobby" | "playing" | "spectating"
  const [arenaView, setArenaView] = useState<"menu" | "lobby" | "playing" | "spectating">("menu");

  // Audio / Speech
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceCallerEnabled, setVoiceCallerEnabled] = useState(false);

  // Player Profile & Progression
  const { profile, addMatchResult, updateAvatarAndName } = usePlayerProfile();
  const [showProgressionModal, setShowProgressionModal] = useState(false);

  // Match Configuration
  const [roomCode, setRoomCode] = useState("");
  const [inputJoinCode, setInputJoinCode] = useState("");
  const [isHost, setIsHost] = useState(true);
  const [mySlot, setMySlot] = useState<1 | 2>(1);
  const [gameMode, setGameMode] = useState<GameMode>("battle");
  const [gridSize, setGridSize] = useState<number>(sourceGridSize);
  const [timeLimitSec, setTimeLimitSec] = useState<number>(300); // 5 mins default
  const [remainingTimeSec, setRemainingTimeSec] = useState<number>(300);
  const [targetLines, setTargetLines] = useState<number>(3);
  const [powerUpsEnabled, setPowerUpsEnabled] = useState(true);

  // AI Opponent Mode
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>("medium");

  // Player 1 & Player 2 Details
  const [p1Name, setP1Name] = useState(profile.name || "Player 1");
  const [p1Avatar, setP1Avatar] = useState(profile.avatar || "⚡");
  const [p1Ready, setP1Ready] = useState(true);
  const [p1Cards, setP1Cards] = useState<TwoPlayerCell[]>([]);
  const [p1Stats, setP1Stats] = useState<PlayerStats>({
    score: 0,
    linesCount: 0,
    completedLines: [],
    comboMultiplier: 1,
    hasShield: false,
    isFrozen: false,
    doublePointsActive: false,
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
  });

  const [p2Name, setP2Name] = useState<string | null>(null);
  const [p2Avatar, setP2Avatar] = useState<string | null>("🔥");
  const [p2Ready, setP2Ready] = useState(false);
  const [p2Cards, setP2Cards] = useState<TwoPlayerCell[]>([]);
  const [p2Stats, setP2Stats] = useState<PlayerStats>({
    score: 0,
    linesCount: 0,
    completedLines: [],
    comboMultiplier: 1,
    hasShield: false,
    isFrozen: false,
    doublePointsActive: false,
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
  });

  // Series Tracking
  const [seriesState, setSeriesState] = useState<SeriesState>({
    enabled: false,
    targetWins: 2,
    p1Wins: 0,
    p2Wins: 0,
    currentMatch: 1,
  });

  // Call Balls
  const [drawnBalls, setDrawnBalls] = useState<CallBall[]>([]);
  const [currentBall, setCurrentBall] = useState<CallBall | null>(null);
  const [autoCaller, setAutoCaller] = useState(true);

  // Countdown & Timer Warning
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const [is10sWarning, setIs10sWarning] = useState(false);

  // Results Modal State
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [winnerSlot, setWinnerSlot] = useState<1 | 2 | null>(null);
  const [matchEndReason, setMatchEndReason] = useState("");
  const [lastMatchTime, setLastMatchTime] = useState(0);
  const [rewardStats, setRewardStats] = useState<{ xpGained: number; coinsGained: number; leveledUp: boolean }>({
    xpGained: 0,
    coinsGained: 0,
    leveledUp: false,
  });

  // Reactions & Floating Emojis
  const [incomingReaction, setIncomingReaction] = useState<{ emoji: string; slot: 1 | 2; id: number } | null>(null);

  // WebSocket Connection
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);

  // Helper to generate symmetric randomized cards from source
  const createInitialDeck = (size: number): TwoPlayerCell[] => {
    const total = size * size;
    const hasFree = size % 2 === 1;
    const centerIdx = Math.floor(total / 2);

    const baseCells = sourceCells.length > 0 ? sourceCells : [];
    const deck: TwoPlayerCell[] = [];

    for (let i = 0; i < total; i++) {
      const isCenter = hasFree && i === centerIdx;
      if (isCenter) {
        deck.push({
          id: `c-free-${i}`,
          text: "FREE SPACE",
          emoji: "⭐",
          isFree: true,
          marked: true,
        });
      } else {
        const item = baseCells[i % Math.max(1, baseCells.length)];
        deck.push({
          id: `c-cell-${i}`,
          text: item?.text || `Tile ${i + 1}`,
          emoji: item?.emoji || "🎯",
          isFree: false,
          marked: false,
        });
      }
    }
    return deck;
  };

  // Check initialPairCode or URL parameters for ?pair=... / ?room=... or ?spectate=...
  useEffect(() => {
    if (!isOpen) return;

    if (initialPairCode) {
      const code = initialPairCode.toUpperCase();
      setRoomCode(code);
      setIsHost(Boolean(initialIsHost));
      setMySlot(initialIsHost ? 1 : 2);
      setArenaView("lobby");
      connectWebSocket(code, "player", initialIsHost ? 1 : 2);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("pair") || params.get("room");
    const spectateParam = params.get("spectate");

    if (spectateParam) {
      setRoomCode(spectateParam.toUpperCase());
      setArenaView("spectating");
      connectWebSocket(spectateParam.toUpperCase(), "spectator");
    } else if (roomParam) {
      setInputJoinCode(roomParam.toUpperCase());
      handleJoinRoom(roomParam.toUpperCase());
    }
  }, [isOpen, initialPairCode, initialIsHost]);

  // Connect WebSocket
  const connectWebSocket = (code: string, role: "player" | "spectator", slot: 1 | 2 = 1) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}//${host}/ws/bingo`);
    wsRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      socket.send(
        JSON.stringify({
          type: "JOIN_ROOM",
          roomCode: code,
          playerSlot: slot,
          playerName: slot === 1 ? p1Name : p2Name || profile.name,
          playerAvatar: slot === 1 ? p1Avatar : profile.avatar,
          role,
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerMessage(msg);
      } catch (e) {
        console.error("Error parsing WS message:", e);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    socket.onerror = () => {
      setIsConnected(false);
    };
  };

  // Handle Server Events
  const handleServerMessage = (msg: any) => {
    switch (msg.type) {
      case "ROOM_JOINED": {
        if (msg.role === "spectator") {
          setArenaView("spectating");
        } else {
          setArenaView("lobby");
        }
        if (msg.roomState) {
          syncRoomState(msg.roomState);
        }
        break;
      }

      case "PLAYER_STATUS_CHANGED": {
        if (msg.player1Name) setP1Name(msg.player1Name);
        if (msg.player1Avatar) setP1Avatar(msg.player1Avatar);
        setP1Ready(Boolean(msg.player1Ready));

        if (msg.player2Name) setP2Name(msg.player2Name);
        if (msg.player2Avatar) setP2Avatar(msg.player2Avatar);
        setP2Ready(Boolean(msg.player2Ready));
        break;
      }

      case "READY_STATUS_UPDATED": {
        if (msg.slot === 1) setP1Ready(msg.isReady);
        if (msg.slot === 2) setP2Ready(msg.isReady);
        break;
      }

      case "SETTINGS_UPDATED": {
        if (msg.gameMode) setGameMode(msg.gameMode);
        if (msg.timeLimitSec !== undefined) {
          setTimeLimitSec(msg.timeLimitSec);
          setRemainingTimeSec(msg.timeLimitSec);
        }
        if (msg.targetLines !== undefined) setTargetLines(msg.targetLines);
        if (msg.powerUpsEnabled !== undefined) setPowerUpsEnabled(msg.powerUpsEnabled);
        break;
      }

      case "COUNTDOWN_START": {
        let count = msg.countdownSeconds || 3;
        setCountdownSec(count);
        if (soundEnabled) playCountdownBeep(false);

        const cdInterval = setInterval(() => {
          count -= 1;
          if (count > 0) {
            setCountdownSec(count);
            if (soundEnabled) playCountdownBeep(false);
          } else {
            clearInterval(cdInterval);
            setCountdownSec(null);
            if (soundEnabled) playCountdownBeep(true);
            setArenaView("playing");
          }
        }, 1000);
        break;
      }

      case "GAME_STARTED": {
        setArenaView("playing");
        setDrawnBalls([]);
        setCurrentBall(null);
        setIs10sWarning(false);
        break;
      }

      case "BALL_DRAWN": {
        setCurrentBall(msg.ball);
        setDrawnBalls((prev) => [msg.ball, ...prev]);
        if (soundEnabled) playBallDrawSound();
        if (voiceCallerEnabled && msg.ball?.label) {
          speakBallAnnouncement(msg.ball.label);
        }
        break;
      }

      case "PLAYER_SCORE_UPDATE": {
        if (msg.slot === 1) {
          setP1Stats((prev) => ({
            ...prev,
            score: msg.score,
            linesCount: msg.linesCount,
            comboMultiplier: msg.comboMultiplier,
          }));
          setP1Cards((prev) =>
            prev.map((c, i) => (i === msg.cellIndex ? { ...c, marked: msg.marked } : c))
          );
        } else {
          setP2Stats((prev) => ({
            ...prev,
            score: msg.score,
            linesCount: msg.linesCount,
            comboMultiplier: msg.comboMultiplier,
          }));
          setP2Cards((prev) =>
            prev.map((c, i) => (i === msg.cellIndex ? { ...c, marked: msg.marked } : c))
          );
        }
        break;
      }

      case "LINE_COMPLETED": {
        if (soundEnabled) playBingoChime();
        break;
      }

      case "TIMER_TICK": {
        setRemainingTimeSec(msg.remainingTimeSec);
        break;
      }

      case "TIMER_WARNING": {
        setIs10sWarning(true);
        if (soundEnabled) playTimerWarningSound();
        break;
      }

      case "POWERUP_USED": {
        if (soundEnabled) {
          if (msg.powerUpType === "shield") playShieldSound();
          else if (msg.powerUpType === "block-opponent") playFreezeSound();
          else playPowerupSound();
        }

        if (msg.player1Cards) setP1Cards(msg.player1Cards);
        if (msg.player2Cards) setP2Cards(msg.player2Cards);

        // Apply visual freeze status
        if (msg.powerUpType === "block-opponent") {
          const targetSlot = msg.slot === 1 ? 2 : 1;
          if (targetSlot === 1) {
            setP1Stats((prev) => ({ ...prev, isFrozen: true }));
            setTimeout(() => setP1Stats((prev) => ({ ...prev, isFrozen: false })), 5000);
          } else {
            setP2Stats((prev) => ({ ...prev, isFrozen: true }));
            setTimeout(() => setP2Stats((prev) => ({ ...prev, isFrozen: false })), 5000);
          }
        }

        // Deduct inventory count on local player
        if (msg.slot === mySlot) {
          const statsSetter = mySlot === 1 ? setP1Stats : setP2Stats;
          statsSetter((prev) => ({
            ...prev,
            powerUps: {
              ...prev.powerUps,
              [msg.powerUpType]: Math.max(0, msg.remainingCount),
            },
          }));
        }
        break;
      }

      case "PLAYER_REACTION": {
        setIncomingReaction({
          emoji: msg.reaction,
          slot: msg.slot,
          id: Date.now() + Math.random(),
        });
        break;
      }

      case "MATCH_COMPLETE": {
        setWinnerSlot(msg.winnerSlot);
        setMatchEndReason(msg.reason || "BINGO Completed!");
        setLastMatchTime(msg.stats?.matchTime || 0);

        if (soundEnabled) playBingoChime();

        // Award XP and coins to player
        const won = msg.winnerSlot === mySlot;
        const myScore = mySlot === 1 ? p1Stats.score : p2Stats.score;
        const myLines = mySlot === 1 ? p1Stats.linesCount : p2Stats.linesCount;
        const rewards = addMatchResult(won, myScore, myLines);
        setRewardStats(rewards);

        setShowResultsModal(true);
        break;
      }

      case "ILLEGAL_MOVE":
      case "ACTION_BLOCKED":
      case "BINGO_REJECTED": {
        setConnectionNotice(msg.message);
        setTimeout(() => setConnectionNotice(null), 3500);
        break;
      }
    }
  };

  const syncRoomState = (state: any) => {
    setGridSize(state.gridSize || sourceGridSize);
    setGameMode(state.gameMode || "battle");
    setTimeLimitSec(state.timeLimitSec || 300);
    setRemainingTimeSec(state.remainingTimeSec || 300);
    setTargetLines(state.targetLines || 3);
    setPowerUpsEnabled(Boolean(state.powerUpsEnabled));

    if (state.player1) {
      setP1Name(state.player1.name);
      setP1Avatar(state.player1.avatar);
      setP1Ready(Boolean(state.player1.isReady));
      if (state.player1.cards) setP1Cards(state.player1.cards);
      setP1Stats((prev) => ({
        ...prev,
        score: state.player1.score || 0,
        linesCount: state.player1.linesCount || 0,
      }));
    }

    if (state.player2) {
      setP2Name(state.player2.name);
      setP2Avatar(state.player2.avatar);
      setP2Ready(Boolean(state.player2.isReady));
      if (state.player2.cards) setP2Cards(state.player2.cards);
      setP2Stats((prev) => ({
        ...prev,
        score: state.player2.score || 0,
        linesCount: state.player2.linesCount || 0,
      }));
    }

    if (state.drawnBalls) setDrawnBalls(state.drawnBalls);
    if (state.currentBall) setCurrentBall(state.currentBall);

    if (state.p1SeriesWins !== undefined || state.p2SeriesWins !== undefined) {
      setSeriesState((prev) => ({
        ...prev,
        p1Wins: state.p1SeriesWins || 0,
        p2Wins: state.p2SeriesWins || 0,
      }));
    }
  };

  // AI Player Bot Hook (Active when isAiMode is true)
  useAIPlayer({
    enabled: isAiMode && arenaView === "playing",
    difficulty: aiDifficulty,
    drawnBalls,
    aiCards: p2Cards,
    aiStats: p2Stats,
    isAiFrozen: p2Stats.isFrozen,
    gameStatus: arenaView === "playing" ? "playing" : "waiting",
    onAiMarkCell: (cellIndex) => handleCellClick(cellIndex, 2),
    onAiUsePowerup: (powerup) => handleUsePowerUp(powerup, 2),
    onAiClaimBingo: () => handleClaimBingo(2),
  });

  // Action: Create Room
  const handleCreateRoom = async () => {
    try {
      const initialCards = createInitialDeck(gridSize);
      const res = await fetch("/api/multiplayer/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostName: profile.name,
          hostAvatar: profile.avatar,
          gridSize,
          title: sourceTitle || "Bingo Tingo Duel",
          gameMode,
          targetLines,
          timeLimitSec,
          powerUpsEnabled,
          cards: initialCards,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRoomCode(data.roomCode);
        setIsHost(true);
        setMySlot(1);
        setP1Cards(initialCards);
        setP1Name(profile.name);
        setP1Avatar(profile.avatar);
        setP1Ready(true);
        setArenaView("lobby");
        connectWebSocket(data.roomCode, "player", 1);
      }
    } catch (e) {
      console.error("Create room error:", e);
      // Fallback offline room
      fallbackLocalRoom();
    }
  };

  // Action: Join Room with 6-Digit Code
  const handleJoinRoom = async (codeToJoin?: string) => {
    const code = (codeToJoin || inputJoinCode).toUpperCase().trim();
    if (!code || code.length < 5) return;

    try {
      const res = await fetch("/api/multiplayer/join-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: code,
          playerName: profile.name,
          playerAvatar: profile.avatar,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRoomCode(code);
        setIsHost(false);
        setMySlot(2);
        setP2Name(profile.name);
        setP2Avatar(profile.avatar);
        setP2Ready(false);
        setArenaView("lobby");
        connectWebSocket(code, "player", 2);
      } else {
        alert(data.error || "Could not join room");
      }
    } catch (e) {
      console.error("Join room error:", e);
      alert("Network error connecting to room");
    }
  };

  // Fallback offline / practice arena generator
  const fallbackLocalRoom = () => {
    const deck1 = createInitialDeck(gridSize);
    const deck2 = createInitialDeck(gridSize);
    setP1Cards(deck1);
    setP2Cards(deck2);
    setRoomCode("DUEL01");
    setIsHost(true);
    setMySlot(1);
    setArenaView("lobby");
  };

  // Action: Toggle Ready
  const handleToggleReady = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "TOGGLE_READY" }));
    } else {
      if (mySlot === 1) setP1Ready(!p1Ready);
      else setP2Ready(!p2Ready);
    }
  };

  // Action: Start Game
  const handleStartGame = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "START_GAME",
          autoCaller,
          callIntervalSec: 5,
        })
      );
    } else {
      // Local or Practice start
      setArenaView("playing");
      setCountdownSec(3);
      setTimeout(() => {
        setCountdownSec(null);
      }, 3000);
    }
  };

  // Action: Mark Cell
  const handleCellClick = (cellIndex: number, overrideSlot?: 1 | 2) => {
    const slot = overrideSlot || mySlot;
    if (slot === 1 && p1Stats.isFrozen) return;
    if (slot === 2 && p2Stats.isFrozen) return;

    if (soundEnabled) playDabSound();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "MARK_CELL",
          cellIndex,
        })
      );
    } else {
      // Local fallback mark logic
      const targetCards = slot === 1 ? p1Cards : p2Cards;
      const setCards = slot === 1 ? setP1Cards : setP2Cards;
      const setStats = slot === 1 ? setP1Stats : setP2Stats;

      setCards((prev) =>
        prev.map((c, i) => (i === cellIndex ? { ...c, marked: !c.marked } : c))
      );
      setStats((prev) => ({
        ...prev,
        score: prev.score + 20,
      }));
    }
  };

  // Action: Draw Next Ball (Manual Caller)
  const handleDrawBall = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "DRAW_BALL" }));
    } else {
      const letters = ["B", "I", "N", "G", "O"];
      const randomNum = Math.floor(Math.random() * 75) + 1;
      const letter = letters[Math.floor((randomNum - 1) / 15)];
      const ball: CallBall = {
        id: `ball-${Date.now()}`,
        label: `${letter}-${randomNum}`,
        letter,
        number: randomNum,
      };
      setCurrentBall(ball);
      setDrawnBalls((prev) => [ball, ...prev]);
      if (soundEnabled) playBallDrawSound();
    }
  };

  // Action: Claim BINGO
  const handleClaimBingo = (overrideSlot?: 1 | 2) => {
    const slot = overrideSlot || mySlot;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "CLAIM_BINGO" }));
    } else {
      setWinnerSlot(slot);
      setMatchEndReason(`${slot === 1 ? p1Name : p2Name || "Player 2"} called BINGO!`);
      setShowResultsModal(true);
      if (soundEnabled) playBingoChime();
    }
  };

  // Action: Use Power-Up
  const handleUsePowerUp = (type: PowerUpType, overrideSlot?: 1 | 2) => {
    const slot = overrideSlot || mySlot;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "USE_POWERUP",
          powerUpType: type,
        })
      );
    } else {
      // Local execution
      if (type === "shield") {
        if (soundEnabled) playShieldSound();
      } else if (type === "block-opponent") {
        if (soundEnabled) playFreezeSound();
      } else {
        if (soundEnabled) playPowerupSound();
      }
    }
  };

  // Action: Rematch
  const handleRematch = () => {
    setShowResultsModal(false);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "REMATCH" }));
    } else {
      setArenaView("playing");
      setDrawnBalls([]);
      setCurrentBall(null);
    }
  };

  // Action: Send Quick Emoji Reaction
  const handleSendReaction = (emoji: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "REACTION",
          reaction: emoji,
        })
      );
    } else {
      setIncomingReaction({ emoji, slot: mySlot, id: Date.now() });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 text-slate-100 flex flex-col backdrop-blur-xl overflow-hidden animate-fade-in font-sans">
      {/* TOP HEADER BAR */}
      <header className="h-14 px-4 border-b border-amber-500/30 bg-slate-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {arenaView !== "menu" && (
            <button
              onClick={() => setArenaView("menu")}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Return to Menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-md">
              <Swords className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-rose-300 font-mono">
                BINGO TINGO ARENA
              </h1>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span>{isConnected ? "Multiplayer Online" : "Local / Bot Engine"}</span>
                {roomCode && <span className="text-amber-400 font-bold">#{roomCode}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          {/* Audio Toggles */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute Game Audio" : "Unmute Game Audio"}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setVoiceCallerEnabled(!voiceCallerEnabled)}
            title={voiceCallerEnabled ? "Voice Caller Active" : "Enable Voice Caller"}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              voiceCallerEnabled ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "bg-slate-800 text-slate-400"
            }`}
          >
            {voiceCallerEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Player Progression & Badges Trigger */}
          <button
            onClick={() => setShowProgressionModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-xs font-bold text-amber-300 transition-all cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">LVL {profile.level}</span>
          </button>

          {/* Exit Arena */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 hover:text-rose-300 text-slate-400 transition-colors cursor-pointer"
            title="Exit Arena"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating System Notice Toast */}
      {connectionNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl border border-rose-400 animate-bounce">
          {connectionNotice}
        </div>
      )}

      {/* MAIN ARENA CONTENT VIEW */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col justify-start">
        {/* 1. ARENA MENU SCREEN */}
        {arenaView === "menu" && (
          <div className="max-w-xl mx-auto w-full my-auto space-y-6 py-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5" /> 2-PLAYER COMPETITIVE ARENA
              </div>
              <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-rose-300 font-mono">
                BINGO TINGO DUEL
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Challenge a friend with private 6-digit room codes, real-time board sync, tactical power-ups, and ranked progression.
              </p>
            </div>

            {/* Menu Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Host Room */}
              <button
                onClick={handleCreateRoom}
                className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-slate-900 border-2 border-amber-500/60 hover:border-amber-400 hover:scale-[1.02] transition-all text-left space-y-3 cursor-pointer shadow-xl group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-lg font-black text-white">Create Private Room</div>
                  <p className="text-xs text-slate-400 mt-1">
                    Get a 6-digit game code and invite link with customizable match rules.
                  </p>
                </div>
              </button>

              {/* Option 2: Practice vs AI */}
              <button
                onClick={() => {
                  setIsAiMode(true);
                  handleCreateRoom();
                }}
                className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-slate-900 border-2 border-cyan-500/50 hover:border-cyan-400 hover:scale-[1.02] transition-all text-left space-y-3 cursor-pointer shadow-xl group"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-lg font-black text-white">Practice vs AI</div>
                  <p className="text-xs text-slate-400 mt-1">
                    Test your speed against an AI bot with 4 difficulty levels (Easy to Expert).
                  </p>
                </div>
              </button>
            </div>

            {/* Join Room by 6-Digit Code */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
              <div className="text-xs font-mono uppercase text-slate-400 font-bold">
                Join with 6-Digit Code
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={inputJoinCode}
                  onChange={(e) => setInputJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A7K92P"
                  className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl font-mono text-center text-lg font-black uppercase tracking-widest focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => handleJoinRoom()}
                  disabled={!inputJoinCode || inputJoinCode.length < 5}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. LOBBY SCREEN */}
        {arenaView === "lobby" && (
          <LobbyView
            roomCode={roomCode}
            isHost={isHost}
            playerSlot={mySlot}
            player1Name={p1Name}
            player1Avatar={p1Avatar}
            player1Ready={p1Ready}
            player2Name={p2Name}
            player2Avatar={p2Avatar}
            player2Ready={p2Ready}
            gameMode={gameMode}
            gridSize={gridSize}
            timeLimitSec={timeLimitSec}
            targetLines={targetLines}
            powerUpsEnabled={powerUpsEnabled}
            isAiMode={isAiMode}
            aiDifficulty={aiDifficulty}
            onToggleReady={handleToggleReady}
            onStartGame={handleStartGame}
            onUpdateSettings={(settings) => {
              if (settings.gameMode) setGameMode(settings.gameMode);
              if (settings.gridSize) setGridSize(settings.gridSize);
              if (settings.timeLimitSec !== undefined) setTimeLimitSec(settings.timeLimitSec);
              if (settings.targetLines) setTargetLines(settings.targetLines);
              if (settings.powerUpsEnabled !== undefined) setPowerUpsEnabled(settings.powerUpsEnabled);

              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                  JSON.stringify({
                    type: "UPDATE_SETTINGS",
                    ...settings,
                  })
                );
              }
            }}
            onChangeNameAndAvatar={(newName, newAvatar) => {
              updateAvatarAndName(newName, newAvatar);
              if (mySlot === 1) {
                setP1Name(newName);
                setP1Avatar(newAvatar);
              } else {
                setP2Name(newName);
                setP2Avatar(newAvatar);
              }
            }}
            onSelectAiMode={(enabled, diff) => {
              setIsAiMode(enabled);
              if (diff) setAiDifficulty(diff);
              if (enabled) {
                setP2Name(`BingoBot (${diff || "medium"})`);
                setP2Avatar("🤖");
                setP2Ready(true);
              }
            }}
          />
        )}

        {/* 3. ACTIVE PLAYING MATCH ARENA */}
        {arenaView === "playing" && (
          <div className="w-full max-w-6xl mx-auto flex flex-col gap-4">
            {/* Live Scoreboard HUD */}
            <ScoreboardHUD
              p1Name={p1Name}
              p1Avatar={p1Avatar}
              p1Score={p1Stats.score}
              p1Lines={p1Stats.linesCount}
              p1MarkedCount={p1Cards.filter((c) => c.marked || c.isFree).length}
              p1TotalCells={p1Cards.length}
              p1Combo={p1Stats.comboMultiplier}
              p1Shield={p1Stats.hasShield}
              p1Frozen={p1Stats.isFrozen}
              p1DoublePoints={p1Stats.doublePointsActive}
              p2Name={p2Name || (isAiMode ? "BingoBot" : "Player 2")}
              p2Avatar={p2Avatar || (isAiMode ? "🤖" : "🔥")}
              p2Score={p2Stats.score}
              p2Lines={p2Stats.linesCount}
              p2MarkedCount={p2Cards.filter((c) => c.marked || c.isFree).length}
              p2TotalCells={p2Cards.length}
              p2Combo={p2Stats.comboMultiplier}
              p2Shield={p2Stats.hasShield}
              p2Frozen={p2Stats.isFrozen}
              p2DoublePoints={p2Stats.doublePointsActive}
              timeRemainingSec={remainingTimeSec}
              timeLimitSec={timeLimitSec}
              is10sWarning={is10sWarning}
              seriesState={seriesState}
              mySlot={mySlot}
            />

            {/* Ball Caller Sphere Bar */}
            <BallCallerDisplay
              currentBall={currentBall}
              drawnBalls={drawnBalls}
              autoCaller={autoCaller}
              canClaimBingo={(mySlot === 1 ? p1Stats.linesCount : p2Stats.linesCount) >= targetLines}
              onDrawBall={handleDrawBall}
              onClaimBingo={() => handleClaimBingo()}
            />

            {/* Cards Stadium Grid: Dual Split View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* My Card (Priority) */}
              <div>
                <PlayerBingoCard
                  playerName={mySlot === 1 ? p1Name : p2Name || "Player 2"}
                  playerAvatar={mySlot === 1 ? p1Avatar : p2Avatar || "🔥"}
                  gridSize={gridSize}
                  cells={mySlot === 1 ? p1Cards : p2Cards}
                  isMyCard={true}
                  isFrozen={mySlot === 1 ? p1Stats.isFrozen : p2Stats.isFrozen}
                  onCellClick={(idx) => handleCellClick(idx)}
                />
              </div>

              {/* Opponent Card (Live Real-Time View) */}
              <div>
                <PlayerBingoCard
                  playerName={mySlot === 1 ? p2Name || (isAiMode ? "BingoBot" : "Player 2") : p1Name}
                  playerAvatar={mySlot === 1 ? p2Avatar || (isAiMode ? "🤖" : "🔥") : p1Avatar}
                  gridSize={gridSize}
                  cells={mySlot === 1 ? p2Cards : p1Cards}
                  isMyCard={false}
                  isFrozen={mySlot === 1 ? p2Stats.isFrozen : p1Stats.isFrozen}
                />
              </div>
            </div>

            {/* Quick Reactions Bar */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <QuickReactionOverlay
                onSendReaction={handleSendReaction}
                incomingReaction={incomingReaction}
              />
              <span className="text-[11px] font-mono text-slate-400">Room #{roomCode}</span>
            </div>
          </div>
        )}

        {/* 4. LIVE SPECTATOR MODE */}
        {arenaView === "spectating" && (
          <SpectatorView
            roomCode={roomCode}
            gridSize={gridSize}
            p1Name={p1Name}
            p1Avatar={p1Avatar}
            p1Score={p1Stats.score}
            p1Lines={p1Stats.linesCount}
            p1Cards={p1Cards}
            p2Name={p2Name || "Player 2"}
            p2Avatar={p2Avatar || "🔥"}
            p2Score={p2Stats.score}
            p2Lines={p2Stats.linesCount}
            p2Cards={p2Cards}
            currentBall={currentBall}
            drawnBalls={drawnBalls}
            remainingTimeSec={remainingTimeSec}
            timeLimitSec={timeLimitSec}
            is10sWarning={is10sWarning}
            onExitSpectator={() => setArenaView("menu")}
          />
        )}
      </main>

      {/* TACTICAL POWER-UP BOTTOM BAR (When Playing and Powerups Enabled) */}
      {arenaView === "playing" && powerUpsEnabled && (
        <PowerUpBar
          powerUps={mySlot === 1 ? p1Stats.powerUps : p2Stats.powerUps}
          disabled={mySlot === 1 ? p1Stats.isFrozen : p2Stats.isFrozen}
          isFrozen={mySlot === 1 ? p1Stats.isFrozen : p2Stats.isFrozen}
          onUsePowerUp={(type) => handleUsePowerUp(type)}
        />
      )}

      {/* 3-2-1-GO COUNTDOWN OVERLAY */}
      {countdownSec !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-md">
          <div className="text-center">
            <div className="text-9xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-rose-400 animate-ping">
              {countdownSec}
            </div>
            <div className="text-xl font-bold tracking-widest uppercase text-amber-300 mt-4 font-mono">
              GET READY!
            </div>
          </div>
        </div>
      )}

      {/* MATCH RESULTS MODAL */}
      <MatchResultsModal
        isOpen={showResultsModal}
        winnerSlot={winnerSlot || 1}
        p1Name={p1Name}
        p1Avatar={p1Avatar}
        p1Score={p1Stats.score}
        p1Lines={p1Stats.linesCount}
        p1Combo={p1Stats.comboMultiplier}
        p2Name={p2Name || (isAiMode ? "BingoBot" : "Player 2")}
        p2Avatar={p2Avatar || (isAiMode ? "🤖" : "🔥")}
        p2Score={p2Stats.score}
        p2Lines={p2Stats.linesCount}
        p2Combo={p2Stats.comboMultiplier}
        matchTimeSec={lastMatchTime}
        reason={matchEndReason}
        xpEarned={rewardStats.xpGained}
        coinsEarned={rewardStats.coinsGained}
        leveledUp={rewardStats.leveledUp}
        onPlayAgain={() => {
          setShowResultsModal(false);
          setArenaView("lobby");
        }}
        onRematch={handleRematch}
        onExit={() => {
          setShowResultsModal(false);
          setArenaView("menu");
        }}
      />

      {/* PLAYER PROGRESSION & BADGES MODAL */}
      <PlayerProgressionModal
        isOpen={showProgressionModal}
        profile={profile}
        onClose={() => setShowProgressionModal(false)}
      />
    </div>
  );
};
