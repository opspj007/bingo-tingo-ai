import React from "react";
import { Trophy, Clock, AlertTriangle, Shield, Snowflake, Zap, Flame, Crown } from "lucide-react";
import { SeriesState } from "./types";

interface ScoreboardHUDProps {
  p1Name: string;
  p1Avatar: string;
  p1Score: number;
  p1Lines: number;
  p1MarkedCount: number;
  p1TotalCells: number;
  p1Combo: number;
  p1Shield: boolean;
  p1Frozen: boolean;
  p1DoublePoints: boolean;

  p2Name: string;
  p2Avatar: string;
  p2Score: number;
  p2Lines: number;
  p2MarkedCount: number;
  p2TotalCells: number;
  p2Combo: number;
  p2Shield: boolean;
  p2Frozen: boolean;
  p2DoublePoints: boolean;

  timeRemainingSec: number;
  timeLimitSec: number;
  is10sWarning: boolean;
  seriesState?: SeriesState;
  mySlot?: 1 | 2;
  currentTurnText?: string;
}

export const ScoreboardHUD: React.FC<ScoreboardHUDProps> = ({
  p1Name,
  p1Avatar,
  p1Score,
  p1Lines,
  p1MarkedCount,
  p1TotalCells,
  p1Combo,
  p1Shield,
  p1Frozen,
  p1DoublePoints,

  p2Name,
  p2Avatar,
  p2Score,
  p2Lines,
  p2MarkedCount,
  p2TotalCells,
  p2Combo,
  p2Shield,
  p2Frozen,
  p2DoublePoints,

  timeRemainingSec,
  timeLimitSec,
  is10sWarning,
  seriesState,
  mySlot = 1,
  currentTurnText,
}) => {
  const p1Progress = Math.min(100, Math.round((p1MarkedCount / Math.max(1, p1TotalCells)) * 100));
  const p2Progress = Math.min(100, Math.round((p2MarkedCount / Math.max(1, p2TotalCells)) * 100));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-slate-900/95 border-b border-amber-500/40 p-3 shadow-xl backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* PLAYER 1 HUD */}
        <div
          className={`flex-1 w-full p-2.5 rounded-xl border transition-all ${
            mySlot === 1
              ? "bg-amber-950/30 border-amber-500/60 shadow-md shadow-amber-950/20"
              : "bg-slate-800/60 border-slate-700/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{p1Avatar}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold tracking-wider text-amber-400">PLAYER 1</span>
                  {mySlot === 1 && (
                    <span className="text-[9px] bg-amber-500/30 text-amber-300 font-bold px-1.5 py-0.2 rounded">
                      YOU
                    </span>
                  )}
                </div>
                <div className="text-sm font-black text-white truncate max-w-[130px]">{p1Name}</div>
              </div>
            </div>

            {/* Active Status Badges */}
            <div className="flex items-center gap-1">
              {p1Frozen && (
                <span className="p-1 rounded bg-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-0.5 animate-pulse">
                  <Snowflake className="w-3 h-3" /> FROZEN
                </span>
              )}
              {p1Shield && (
                <span className="p-1 rounded bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-0.5">
                  <Shield className="w-3 h-3" /> SHIELD
                </span>
              )}
              {p1DoublePoints && (
                <span className="p-1 rounded bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-0.5">
                  <Zap className="w-3 h-3" /> 2X
                </span>
              )}
              {p1Combo > 1 && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 text-[10px] font-mono font-bold flex items-center gap-0.5 animate-bounce">
                  <Flame className="w-3 h-3 text-rose-400" /> x{p1Combo.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300">
              Score: <strong className="text-amber-300 text-sm font-sans">{p1Score.toLocaleString()}</strong>
            </span>
            <span className="text-slate-300">
              Lines: <strong className="text-amber-400 text-sm font-sans">{p1Lines}</strong>
            </span>
          </div>

          {/* ASCII-Style Progress Bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
                style={{ width: `${p1Progress}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-amber-300 font-bold w-9 text-right">{p1Progress}%</span>
          </div>
        </div>

        {/* CENTER MATCH TIMER & TURN HUD */}
        <div className="flex flex-col items-center justify-center px-3 min-w-[170px]">
          {timeLimitSec > 0 ? (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-sm font-black transition-all ${
                is10sWarning
                  ? "bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-900/50 scale-105"
                  : "bg-slate-800 text-amber-300 border border-amber-500/30"
              }`}
            >
              {is10sWarning ? (
                <AlertTriangle className="w-4 h-4 text-white" />
              ) : (
                <Clock className="w-4 h-4 text-amber-400" />
              )}
              <span>{formatTime(timeRemainingSec)}</span>
            </div>
          ) : (
            <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Match in progress</div>
          )}

          {/* Turn / Caller indicator */}
          <div className="text-[11px] font-bold text-amber-200/90 mt-1 text-center truncate max-w-[200px]">
            {currentTurnText || "⚡ Match In Progress"}
          </div>

          {/* Series Star Badges */}
          {seriesState && seriesState.enabled && (
            <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
              <span className="text-amber-400">
                P1: {"⭐".repeat(seriesState.p1Wins)}
                {"☆".repeat(Math.max(0, seriesState.targetWins - seriesState.p1Wins))}
              </span>
              <span>vs</span>
              <span className="text-rose-400">
                P2: {"⭐".repeat(seriesState.p2Wins)}
                {"☆".repeat(Math.max(0, seriesState.targetWins - seriesState.p2Wins))}
              </span>
            </div>
          )}
        </div>

        {/* PLAYER 2 HUD */}
        <div
          className={`flex-1 w-full p-2.5 rounded-xl border transition-all ${
            mySlot === 2
              ? "bg-rose-950/30 border-rose-500/60 shadow-md shadow-rose-950/20"
              : "bg-slate-800/60 border-slate-700/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{p2Avatar}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold tracking-wider text-rose-400">PLAYER 2</span>
                  {mySlot === 2 && (
                    <span className="text-[9px] bg-rose-500/30 text-rose-300 font-bold px-1.5 py-0.2 rounded">
                      YOU
                    </span>
                  )}
                </div>
                <div className="text-sm font-black text-white truncate max-w-[130px]">{p2Name}</div>
              </div>
            </div>

            {/* Active Status Badges */}
            <div className="flex items-center gap-1">
              {p2Frozen && (
                <span className="p-1 rounded bg-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-0.5 animate-pulse">
                  <Snowflake className="w-3 h-3" /> FROZEN
                </span>
              )}
              {p2Shield && (
                <span className="p-1 rounded bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-0.5">
                  <Shield className="w-3 h-3" /> SHIELD
                </span>
              )}
              {p2DoublePoints && (
                <span className="p-1 rounded bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-0.5">
                  <Zap className="w-3 h-3" /> 2X
                </span>
              )}
              {p2Combo > 1 && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 text-[10px] font-mono font-bold flex items-center gap-0.5 animate-bounce">
                  <Flame className="w-3 h-3 text-rose-400" /> x{p2Combo.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300">
              Score: <strong className="text-rose-300 text-sm font-sans">{p2Score.toLocaleString()}</strong>
            </span>
            <span className="text-slate-300">
              Lines: <strong className="text-rose-400 text-sm font-sans">{p2Lines}</strong>
            </span>
          </div>

          {/* ASCII-Style Progress Bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${p2Progress}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-rose-300 font-bold w-9 text-right">{p2Progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
