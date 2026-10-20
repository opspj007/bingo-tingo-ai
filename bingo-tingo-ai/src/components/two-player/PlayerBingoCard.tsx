import React from "react";
import { Sparkles, Star, Check } from "lucide-react";
import { TwoPlayerCell } from "./types";

interface PlayerBingoCardProps {
  playerName: string;
  playerAvatar: string;
  gridSize: number;
  cells: TwoPlayerCell[];
  isMyCard: boolean;
  isFrozen: boolean;
  winningLineIndices?: number[];
  highlightedIndices?: number[];
  onCellClick?: (cellIndex: number) => void;
}

export const PlayerBingoCard: React.FC<PlayerBingoCardProps> = ({
  playerName,
  playerAvatar,
  gridSize,
  cells,
  isMyCard,
  isFrozen,
  winningLineIndices = [],
  highlightedIndices = [],
  onCellClick,
}) => {
  const getGridColsClass = () => {
    if (gridSize === 3) return "grid-cols-3";
    if (gridSize === 5) return "grid-cols-5";
    return "grid-cols-4";
  };

  return (
    <div
      className={`relative w-full rounded-2xl p-3 sm:p-4 border-2 transition-all shadow-xl backdrop-blur-md ${
        isMyCard
          ? "bg-slate-900/95 border-amber-500/70 shadow-amber-950/30"
          : "bg-slate-900/80 border-rose-500/50 shadow-rose-950/20"
      } ${isFrozen ? "ring-4 ring-cyan-400/80 animate-pulse" : ""}`}
    >
      {/* Frozen Overlay if blocked by power-up */}
      {isFrozen && (
        <div className="absolute inset-0 z-20 bg-cyan-950/80 rounded-2xl flex flex-col items-center justify-center p-4 backdrop-blur-xs">
          <div className="text-4xl animate-bounce">❄️</div>
          <div className="text-sm font-black text-cyan-200 mt-2 font-mono">FROZEN BY OPPONENT!</div>
          <p className="text-xs text-cyan-300/80 text-center">Your board is temporarily locked in ice</p>
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">{playerAvatar}</span>
          <span className="text-xs sm:text-sm font-black text-white truncate max-w-[150px]">
            {playerName}
          </span>
          {isMyCard && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
              YOUR CARD
            </span>
          )}
        </div>
        <div className="text-[10px] font-mono text-slate-400 font-bold">
          {cells.filter((c) => c.marked || c.isFree).length} / {cells.length} DABS
        </div>
      </div>

      {/* Bingo Grid */}
      <div className={`grid ${getGridColsClass()} gap-1.5 sm:gap-2`}>
        {cells.map((cell, index) => {
          const isWinningCell = winningLineIndices.includes(index);
          const isHighlighted = highlightedIndices.includes(index);
          const isFree = cell.isFree;
          const isMarked = cell.marked || isFree;

          return (
            <button
              key={cell.id || index}
              onClick={() => isMyCard && !isFrozen && onCellClick?.(index)}
              disabled={!isMyCard || isFrozen}
              className={`relative aspect-square rounded-xl p-1 sm:p-2 flex flex-col items-center justify-center text-center transition-all select-none overflow-hidden ${
                isWinningCell
                  ? "bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-400/50 scale-[1.03] z-10 animate-pulse border-2 border-white"
                  : isMarked
                  ? isMyCard
                    ? "bg-gradient-to-br from-amber-600 to-amber-800 border border-amber-400/80 text-white shadow-inner font-bold"
                    : "bg-gradient-to-br from-rose-700 to-rose-900 border border-rose-400/80 text-white shadow-inner font-bold"
                  : isHighlighted
                  ? "bg-cyan-950/80 border-2 border-cyan-400 text-cyan-200 animate-bounce"
                  : "bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-slate-200"
              } ${isMyCard && !isFrozen ? "cursor-pointer hover:scale-[1.02] active:scale-95" : "cursor-default"}`}
            >
              {/* Center Free Space Star Badge */}
              {isFree ? (
                <div className="flex flex-col items-center justify-center">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 fill-current animate-spin-slow" />
                  <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase text-yellow-200 mt-0.5 font-mono">
                    FREE
                  </span>
                </div>
              ) : (
                <>
                  {cell.emoji && <span className="text-sm sm:text-base mb-0.5">{cell.emoji}</span>}
                  <span
                    className={`text-[10px] sm:text-xs leading-tight line-clamp-2 ${
                      isWinningCell
                        ? "text-slate-950 font-black"
                        : isMarked
                        ? "text-white font-bold"
                        : "text-slate-300 font-medium"
                    }`}
                  >
                    {cell.text}
                  </span>
                </>
              )}

              {/* Dab Stamp Badge */}
              {isMarked && !isFree && (
                <div className="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white/25 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
