import React, { useState } from "react";
import {
  Users,
  Copy,
  Check,
  Share2,
  Sparkles,
  Crown,
  Flame,
  Zap,
  Clock,
  Target,
  Swords,
  Bot,
  QrCode,
  Eye,
  Settings2,
  Play,
} from "lucide-react";
import { GameMode, AIDifficulty } from "../../types";

interface LobbyViewProps {
  roomCode: string;
  isHost: boolean;
  playerSlot: 1 | 2;
  player1Name: string;
  player1Avatar: string;
  player1Ready: boolean;
  player2Name: string | null;
  player2Avatar: string | null;
  player2Ready: boolean;
  gameMode: GameMode;
  gridSize: number;
  timeLimitSec: number;
  targetLines: number;
  powerUpsEnabled: boolean;
  isAiMode?: boolean;
  aiDifficulty?: AIDifficulty;
  onToggleReady: () => void;
  onStartGame: () => void;
  onUpdateSettings?: (settings: {
    gameMode?: GameMode;
    gridSize?: number;
    timeLimitSec?: number;
    targetLines?: number;
    powerUpsEnabled?: boolean;
  }) => void;
  onChangeNameAndAvatar: (name: string, avatar: string) => void;
  onSelectAiMode?: (enabled: boolean, diff?: AIDifficulty) => void;
}

const AVATAR_OPTIONS = ["⚡", "🔥", "👑", "🎯", "🦊", "🐯", "🐼", "🦁", "🤖", "🚀", "💎", "⭐"];

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomCode,
  isHost,
  playerSlot,
  player1Name,
  player1Avatar,
  player1Ready,
  player2Name,
  player2Avatar,
  player2Ready,
  gameMode,
  gridSize,
  timeLimitSec,
  targetLines,
  powerUpsEnabled,
  isAiMode = false,
  aiDifficulty = "medium",
  onToggleReady,
  onStartGame,
  onUpdateSettings,
  onChangeNameAndAvatar,
  onSelectAiMode,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerSlot === 1 ? player1Name : player2Name || "Player 2");
  const [selectedAvatar, setSelectedAvatar] = useState(playerSlot === 1 ? player1Avatar : player2Avatar || "🔥");

  const myReady = playerSlot === 1 ? player1Ready : player2Ready;
  const bothReady = Boolean(player1Ready && player2Ready);
  const canStart = bothReady || isAiMode;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInviteLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopySpectatorLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?spectate=${roomCode}`;
    navigator.clipboard.writeText(url);
    alert("Spectator link copied to clipboard! Anyone can open this link to watch live.");
  };

  const handleSaveProfile = () => {
    onChangeNameAndAvatar(nameInput.trim() || `Player ${playerSlot}`, selectedAvatar);
    setEditingName(false);
  };

  const formatTimeLimit = (sec: number) => {
    if (sec === 0) return "No Timer";
    if (sec === 90) return "90s (Blitz)";
    return `${Math.floor(sec / 60)} Minutes`;
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      {/* ASCII-Framed Header Banner */}
      <div className="bg-slate-900/90 border-2 border-amber-500/60 rounded-2xl p-5 shadow-2xl shadow-amber-950/40 relative overflow-hidden backdrop-blur-md">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-1 mb-4">
          <div className="text-xs font-mono tracking-widest text-amber-400/80 uppercase font-semibold">
            ═══ BINGO TINGO DUEL ROOM ═══
          </div>
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-rose-300 font-mono">
              #{roomCode}
            </h2>
            <button
              onClick={handleCopyCode}
              title="Copy 6-Digit Code"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors border border-amber-500/30 cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-400">Share this 6-digit code or invite link with your opponent</p>
        </div>

        {/* Action Share Strip */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleCopyInviteLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Invite Link Copied!" : "Copy Invite Link"}</span>
          </button>

          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Show QR Code</span>
          </button>

          <button
            onClick={handleCopySpectatorLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Spectator Mode Link</span>
          </button>
        </div>
      </div>

      {/* Players Matchup Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player 1 Card (Host) */}
        <div
          className={`p-4 rounded-xl border-2 transition-all backdrop-blur-md ${
            playerSlot === 1
              ? "bg-slate-900/90 border-amber-500 shadow-lg shadow-amber-950/30"
              : "bg-slate-900/70 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> HOST • PLAYER 1
            </span>
            <div
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 ${
                player1Ready
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${player1Ready ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              {player1Ready ? "READY" : "WAITING"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner">
              {player1Avatar}
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-white flex items-center gap-2">
                {player1Name}
                {playerSlot === 1 && (
                  <button
                    onClick={() => setEditingName(!editingName)}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    [edit]
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400">Team Gold Atelier</p>
            </div>
          </div>
        </div>

        {/* Player 2 Card (Opponent or AI) */}
        <div
          className={`p-4 rounded-xl border-2 transition-all backdrop-blur-md ${
            playerSlot === 2
              ? "bg-slate-900/90 border-rose-500 shadow-lg shadow-rose-950/30"
              : "bg-slate-900/70 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1">
              {isAiMode ? <Bot className="w-3.5 h-3.5 text-cyan-400" /> : <Swords className="w-3.5 h-3.5 text-rose-400" />}
              {isAiMode ? `AI BOT (${aiDifficulty.toUpperCase()})` : "CHALLENGER • PLAYER 2"}
            </span>

            <div
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 ${
                isAiMode || player2Ready
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAiMode || player2Ready ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              {isAiMode || player2Ready ? "READY" : player2Name ? "WAITING" : "EMPTY"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-3xl shadow-inner">
              {isAiMode ? "🤖" : player2Avatar || "❓"}
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-white flex items-center gap-2">
                {isAiMode ? `BingoBot (${aiDifficulty})` : player2Name || "Waiting for player..."}
                {playerSlot === 2 && (
                  <button
                    onClick={() => setEditingName(!editingName)}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  >
                    [edit]
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isAiMode
                  ? "Automated Neural Bingo Challenger"
                  : player2Name
                  ? "Team Ruby Velvet"
                  : "Share code # " + roomCode}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Customize Section (Expandable) */}
      {editingName && (
        <div className="p-4 bg-slate-900 border border-amber-500/40 rounded-xl space-y-3">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Customize Your Gamer Tag & Avatar</div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={15}
              placeholder="Enter name"
              className="bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-slate-700 text-sm font-semibold focus:outline-none focus:border-amber-400"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer ${
                    selectedAvatar === av
                      ? "bg-amber-500 text-white scale-110 shadow-md"
                      : "bg-slate-800 hover:bg-slate-700"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
            <button
              onClick={handleSaveProfile}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Host Match Settings Panel */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Settings2 className="w-4 h-4 text-amber-400" />
            <span>Game Arena Settings</span>
          </div>
          {!isHost && <span className="text-[11px] text-slate-400">Controlled by Host</span>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Game Mode */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Game Mode</label>
            {isHost && onUpdateSettings ? (
              <select
                value={gameMode}
                onChange={(e) => onUpdateSettings({ gameMode: e.target.value as GameMode })}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2 font-medium focus:outline-none focus:border-amber-400"
              >
                <option value="classic">Classic Bingo</option>
                <option value="race">Race Mode</option>
                <option value="battle">Tingo Battle</option>
                <option value="time-attack">Time Attack</option>
                <option value="series-bo3">Best of 3</option>
                <option value="series-bo5">Best of 5</option>
                <option value="sudden-death">Sudden Death</option>
              </select>
            ) : (
              <div className="text-xs font-bold text-amber-300 capitalize">{gameMode.replace("-", " ")}</div>
            )}
          </div>

          {/* Grid Size */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Card Size</label>
            {isHost && onUpdateSettings ? (
              <select
                value={gridSize}
                onChange={(e) => onUpdateSettings({ gridSize: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2 font-medium focus:outline-none focus:border-amber-400"
              >
                <option value={3}>3x3 (Fast)</option>
                <option value={4}>4x4 (Classic)</option>
                <option value={5}>5x5 (Pro Free Space)</option>
              </select>
            ) : (
              <div className="text-xs font-bold text-amber-300">{gridSize}x{gridSize}</div>
            )}
          </div>

          {/* Match Time */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Time Limit</label>
            {isHost && onUpdateSettings ? (
              <select
                value={timeLimitSec}
                onChange={(e) => onUpdateSettings({ timeLimitSec: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2 font-medium focus:outline-none focus:border-amber-400"
              >
                <option value={90}>90s (Blitz)</option>
                <option value={180}>3 Minutes</option>
                <option value={300}>5 Minutes</option>
                <option value={600}>10 Minutes</option>
                <option value={0}>No Timer</option>
              </select>
            ) : (
              <div className="text-xs font-bold text-amber-300">{formatTimeLimit(timeLimitSec)}</div>
            )}
          </div>

          {/* Target Lines */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Target</label>
            {isHost && onUpdateSettings ? (
              <select
                value={targetLines}
                onChange={(e) => onUpdateSettings({ targetLines: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2 font-medium focus:outline-none focus:border-amber-400"
              >
                <option value={1}>1 Line</option>
                <option value={2}>2 Lines</option>
                <option value={3}>3 Lines</option>
                <option value={5}>Full House (Blackout)</option>
              </select>
            ) : (
              <div className="text-xs font-bold text-amber-300">{targetLines} Lines</div>
            )}
          </div>
        </div>

        {/* Tactical Power-ups & AI Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={powerUpsEnabled}
              disabled={!isHost}
              onChange={(e) => onUpdateSettings?.({ powerUpsEnabled: e.target.checked })}
              className="accent-amber-500 rounded cursor-pointer"
            />
            <span className="font-semibold">Enable Tactical Power-ups (Shield, Freeze, Double Points)</span>
          </label>

          {onSelectAiMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectAiMode(!isAiMode, aiDifficulty)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  isAiMode
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>{isAiMode ? "AI Mode Active" : "Practice vs AI"}</span>
              </button>

              {isAiMode && (
                <select
                  value={aiDifficulty}
                  onChange={(e) => onSelectAiMode(true, e.target.value as AIDifficulty)}
                  className="bg-slate-800 text-cyan-300 text-xs font-bold px-2 py-1 rounded border border-cyan-500/40"
                >
                  <option value="easy">🟢 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🔴 Hard</option>
                  <option value="expert">👑 Expert</option>
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ready / Start Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {bothReady && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-mono font-bold">
            <Check className="w-3.5 h-3.5" />
            <span>● BOTH READY</span>
          </div>
        )}

        <button
          onClick={onToggleReady}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm transition-all cursor-pointer shadow-lg ${
            myReady
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40"
              : "bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30"
          }`}
        >
          {myReady ? <Check className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
          <span>{myReady ? "YOU ARE READY" : "SET TO READY"}</span>
        </button>

        {isHost && (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm tracking-wider uppercase transition-all shadow-xl ${
              canStart
                ? "bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:scale-105 active:scale-95 text-white shadow-amber-950/50 cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60"
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{canStart ? "START GAME" : "WAITING FOR PLAYERS"}</span>
          </button>
        )}
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/50 p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="text-lg font-bold text-white">Scan to Join Duel</div>
            <div className="p-4 bg-white rounded-xl mx-auto w-48 h-48 flex items-center justify-center shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `${window.location.origin}${window.location.pathname}?room=${roomCode}`
                )}`}
                alt="Room QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs font-mono text-amber-300 font-bold">Room Code: #{roomCode}</div>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
