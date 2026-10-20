import React from "react";
import { Eye, Trophy, Clock, Users, ArrowLeft } from "lucide-react";
import { TwoPlayerCell, CallBall } from "./types";
import { ScoreboardHUD } from "./ScoreboardHUD";
import { PlayerBingoCard } from "./PlayerBingoCard";

interface SpectatorViewProps {
  roomCode: string;
  gridSize: number;
  p1Name: string;
  p1Avatar: string;
  p1Score: number;
  p1Lines: number;
  p1Cards: TwoPlayerCell[];

  p2Name: string;
  p2Avatar: string;
  p2Score: number;
  p2Lines: number;
  p2Cards: TwoPlayerCell[];

  currentBall: CallBall | null;
  drawnBalls: CallBall[];
  remainingTimeSec: number;
  timeLimitSec: number;
  is10sWarning: boolean;
  onExitSpectator: () => void;
}

export const SpectatorView: React.FC<SpectatorViewProps> = ({
  roomCode,
  gridSize,
  p1Name,
  p1Avatar,
  p1Score,
  p1Lines,
  p1Cards,
  p2Name,
  p2Avatar,
  p2Score,
  p2Lines,
  p2Cards,
  currentBall,
  drawnBalls,
  remainingTimeSec,
  timeLimitSec,
  is10sWarning,
  onExitSpectator,
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Spectator Top Bar */}
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Eye className="w-4 h-4 animate-pulse" />
          </span>
          <div>
            <div className="text-xs font-mono font-bold text-indigo-300 uppercase">
              LIVE BROADCAST • ROOM #{roomCode}
            </div>
            <div className="text-[11px] text-slate-400">Viewing synchronized server game state</div>
          </div>
        </div>

        <button
          onClick={onExitSpectator}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Spectator</span>
        </button>
      </div>

      {/* Synchronized Scoreboard */}
      <ScoreboardHUD
        p1Name={p1Name}
        p1Avatar={p1Avatar}
        p1Score={p1Score}
        p1Lines={p1Lines}
        p1MarkedCount={p1Cards.filter((c) => c.marked || c.isFree).length}
        p1TotalCells={p1Cards.length}
        p1Combo={1}
        p1Shield={false}
        p1Frozen={false}
        p1DoublePoints={false}
        p2Name={p2Name}
        p2Avatar={p2Avatar}
        p2Score={p2Score}
        p2Lines={p2Lines}
        p2MarkedCount={p2Cards.filter((c) => c.marked || c.isFree).length}
        p2TotalCells={p2Cards.length}
        p2Combo={1}
        p2Shield={false}
        p2Frozen={false}
        p2DoublePoints={false}
        timeRemainingSec={remainingTimeSec}
        timeLimitSec={timeLimitSec}
        is10sWarning={is10sWarning}
        currentTurnText="Live Match Broadcast"
      />

      {/* Dual Cards Stadium View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-mono font-bold text-amber-400 mb-2 flex items-center gap-1">
            <span>{p1Avatar}</span>
            <span>{p1Name} (Player 1)</span>
          </div>
          <PlayerBingoCard
            playerName={p1Name}
            playerAvatar={p1Avatar}
            gridSize={gridSize}
            cells={p1Cards}
            isMyCard={false}
            isFrozen={false}
          />
        </div>

        <div>
          <div className="text-xs font-mono font-bold text-rose-400 mb-2 flex items-center gap-1">
            <span>{p2Avatar}</span>
            <span>{p2Name} (Player 2)</span>
          </div>
          <PlayerBingoCard
            playerName={p2Name}
            playerAvatar={p2Avatar}
            gridSize={gridSize}
            cells={p2Cards}
            isMyCard={false}
            isFrozen={false}
          />
        </div>
      </div>
    </div>
  );
};
