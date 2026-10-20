import React from "react";
import { Trophy, Clock, Share2, RotateCcw, Play, X, Flame, Sparkles, Award } from "lucide-react";

interface MatchResultsModalProps {
  isOpen: boolean;
  winnerSlot: 1 | 2;
  p1Name: string;
  p1Avatar: string;
  p1Score: number;
  p1Lines: number;
  p1Combo: number;

  p2Name: string;
  p2Avatar: string;
  p2Score: number;
  p2Lines: number;
  p2Combo: number;

  matchTimeSec: number;
  reason?: string;
  xpEarned?: number;
  coinsEarned?: number;
  leveledUp?: boolean;
  onPlayAgain: () => void;
  onRematch: () => void;
  onExit: () => void;
}

export const MatchResultsModal: React.FC<MatchResultsModalProps> = ({
  isOpen,
  winnerSlot,
  p1Name,
  p1Avatar,
  p1Score,
  p1Lines,
  p1Combo,
  p2Name,
  p2Avatar,
  p2Score,
  p2Lines,
  p2Combo,
  matchTimeSec,
  reason,
  xpEarned = 150,
  coinsEarned = 50,
  leveledUp = false,
  onPlayAgain,
  onRematch,
  onExit,
}) => {
  if (!isOpen) return null;

  const isP1Winner = winnerSlot === 1;
  const winnerName = isP1Winner ? p1Name : p2Name;
  const winnerAvatar = isP1Winner ? p1Avatar : p2Avatar;
  const winnerScore = isP1Winner ? p1Score : p2Score;
  const winnerLines = isP1Winner ? p1Lines : p2Lines;
  const winnerCombo = isP1Winner ? p1Combo : p2Combo;

  const runnerUpName = isP1Winner ? p2Name : p1Name;
  const runnerUpAvatar = isP1Winner ? p2Avatar : p1Avatar;
  const runnerUpScore = isP1Winner ? p2Score : p1Score;
  const runnerUpLines = isP1Winner ? p2Lines : p1Lines;

  const formatMatchTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleShareResult = () => {
    const text = `🏆 Bingo Tingo Duel Result!\n🥇 ${winnerName}: ${winnerScore.toLocaleString()} pts (${winnerLines} lines)\n🥈 ${runnerUpName}: ${runnerUpScore.toLocaleString()} pts\nMatch Time: ${formatMatchTime(
      matchTimeSec
    )}\nPlay now at Bingo Tingo!`;

    if (navigator.share) {
      navigator.share({ title: "Bingo Tingo Match Result", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert("Match result copied to clipboard!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-6 shadow-2xl shadow-amber-950/60 relative overflow-hidden text-center space-y-5">
        {/* Glow ambient */}
        <div className="absolute -top-16 -left-16 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Title */}
        <div className="space-y-1">
          <div className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
            🏆 MATCH COMPLETE 🏆
          </div>
          <h2 className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-rose-300 font-mono">
            BINGO TINGO
          </h2>
          {reason && <p className="text-xs text-slate-300 italic">{reason}</p>}
        </div>

        {/* Level Up Banner */}
        {leveledUp && (
          <div className="py-1 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-full inline-flex items-center gap-1.5 shadow-md animate-bounce">
            <Sparkles className="w-3.5 h-3.5" /> LEVEL UP! NEW RANK UNLOCKED!
          </div>
        )}

        {/* Matchup Comparison Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-4 font-mono">
          {/* WINNER (1st Place) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/40">
            <div className="flex items-center gap-3 text-left">
              <span className="text-2xl">🥇</span>
              <span className="text-2xl">{winnerAvatar}</span>
              <div>
                <div className="text-base font-black text-white font-sans">{winnerName}</div>
                <div className="text-xs text-amber-300">
                  Lines: {winnerLines} • Combo: ×{winnerCombo.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Score</div>
              <div className="text-xl font-black text-amber-400 font-sans">{winnerScore.toLocaleString()}</div>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">VS</div>

          {/* RUNNER UP (2nd Place) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3 text-left">
              <span className="text-2xl">🥈</span>
              <span className="text-2xl">{runnerUpAvatar}</span>
              <div>
                <div className="text-base font-bold text-slate-300 font-sans">{runnerUpName}</div>
                <div className="text-xs text-slate-400">Lines: {runnerUpLines}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Score</div>
              <div className="text-lg font-bold text-slate-300 font-sans">{runnerUpScore.toLocaleString()}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Match Time: <strong className="text-white">{formatMatchTime(matchTimeSec)}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">+{xpEarned} XP</span>
              <span className="text-yellow-400 font-bold">+{coinsEarned} 🪙</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: [ PLAY AGAIN ] [ REMATCH ] [ SHARE RESULT ] [ EXIT ] */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={onRematch}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md hover:scale-[1.02] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REMATCH</span>
          </button>

          <button
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-amber-500/40 cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={handleShareResult}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>SHARE RESULT</span>
          </button>

          <button
            onClick={onExit}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>EXIT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
