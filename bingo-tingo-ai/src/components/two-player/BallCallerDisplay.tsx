import React from "react";
import { Sparkles, Volume2, VolumeX, Play, Pause, ChevronRight } from "lucide-react";
import { CallBall } from "./types";

interface BallCallerDisplayProps {
  currentBall: CallBall | null;
  drawnBalls: CallBall[];
  autoCaller: boolean;
  canClaimBingo: boolean;
  onDrawBall: () => void;
  onClaimBingo: () => void;
}

export const BallCallerDisplay: React.FC<BallCallerDisplayProps> = ({
  currentBall,
  drawnBalls,
  autoCaller,
  canClaimBingo,
  onDrawBall,
  onClaimBingo,
}) => {
  const getBallLetterColor = (letter?: string) => {
    switch (letter) {
      case "B":
        return "from-blue-500 to-indigo-700 text-blue-100 border-blue-400";
      case "I":
        return "from-rose-500 to-red-700 text-rose-100 border-rose-400";
      case "N":
        return "from-amber-500 to-yellow-600 text-amber-100 border-amber-400";
      case "G":
        return "from-emerald-500 to-teal-700 text-emerald-100 border-emerald-400";
      case "O":
        return "from-purple-500 to-violet-700 text-purple-100 border-purple-400";
      default:
        return "from-amber-600 to-rose-700 text-white border-amber-400";
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 backdrop-blur-md shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
      {/* Current Ball Showcase */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative">
          {currentBall ? (
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-br ${getBallLetterColor(
                currentBall.letter
              )} border-2 flex flex-col items-center justify-center shadow-lg shadow-black/50 transform hover:scale-105 transition-transform`}
            >
              {currentBall.letter && (
                <span className="text-[11px] font-black tracking-widest opacity-80 leading-tight font-mono">
                  {currentBall.letter}
                </span>
              )}
              <span className="text-lg font-black leading-tight text-center truncate px-1 max-w-[60px]">
                {currentBall.number !== undefined ? currentBall.number : currentBall.label.slice(0, 5)}
              </span>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex flex-col items-center justify-center text-slate-500">
              <span className="text-[10px] font-mono">READY</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-[130px]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Current Call</div>
          <div className="text-sm font-black text-white truncate max-w-[160px]">
            {currentBall ? currentBall.label : "Waiting for draw..."}
          </div>
          <div className="text-[10px] text-amber-400 font-mono">
            Balls Called: {drawnBalls.length}
          </div>
        </div>
      </div>

      {/* Recent Balls Strip */}
      <div className="flex-1 w-full flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none justify-start md:justify-center">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mr-1 hidden lg:inline">
          History:
        </span>
        {drawnBalls.slice(1, 8).map((b, idx) => (
          <div
            key={`${b.id}-${idx}`}
            className="w-8 h-8 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center justify-center text-[10px] font-black shrink-0 font-mono shadow-xs hover:border-amber-400 transition-colors"
            title={b.label}
          >
            {b.letter ? `${b.letter}${b.number || ""}` : b.label.slice(0, 3)}
          </div>
        ))}
      </div>

      {/* Claim BINGO & Call Ball Controls */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        {!autoCaller && (
          <button
            onClick={onDrawBall}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1 transition-all"
          >
            <span>Draw Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* CLAIM BINGO BUTTON */}
        <button
          onClick={onClaimBingo}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
            canClaimBingo
              ? "bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white animate-pulse scale-105 shadow-amber-950/60"
              : "bg-slate-800 text-amber-400 hover:bg-slate-700 border border-amber-500/40"
          }`}
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>BINGO!</span>
        </button>
      </div>
    </div>
  );
};
