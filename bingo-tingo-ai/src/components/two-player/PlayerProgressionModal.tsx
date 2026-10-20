import React from "react";
import { Award, Flame, Zap, Trophy, Coins, X, CheckCircle, Lock } from "lucide-react";
import { PlayerProfile } from "../../types";

interface PlayerProgressionModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onClose: () => void;
}

export const PlayerProgressionModal: React.FC<PlayerProgressionModalProps> = ({
  isOpen,
  profile,
  onClose,
}) => {
  if (!isOpen) return null;

  const xpPercent = Math.min(100, Math.round((profile.xp / Math.max(1, profile.xpNextLevel)) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full bg-slate-900 border border-amber-500/50 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black text-white">Player Progression & Badges</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-800 to-rose-500/20 border border-amber-500/30 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-4xl shadow-md">
            {profile.avatar}
          </div>
          <div className="flex-1">
            <div className="text-lg font-black text-white">{profile.name}</div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
              <span className="bg-amber-500/30 px-2 py-0.5 rounded font-bold">LEVEL {profile.level}</span>
              <span className="flex items-center gap-0.5 text-yellow-400 font-bold">
                <Coins className="w-3.5 h-3.5" /> {profile.coins}
              </span>
            </div>
            {/* XP Bar */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                <span>XP Progress</span>
                <span>
                  {profile.xp} / {profile.xpNextLevel} XP
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full transition-all"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="text-rose-400 font-black text-lg flex items-center justify-center gap-1">
              <Flame className="w-4 h-4" /> {profile.winStreak}
            </div>
            <div className="text-[10px] font-mono uppercase text-slate-400">Win Streak</div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="text-amber-400 font-black text-lg flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4" /> {profile.totalWins}
            </div>
            <div className="text-[10px] font-mono uppercase text-slate-400">Total Wins</div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="text-indigo-400 font-black text-lg flex items-center justify-center gap-1">
              <Zap className="w-4 h-4" /> {profile.totalGames}
            </div>
            <div className="text-[10px] font-mono uppercase text-slate-400">Matches</div>
          </div>
        </div>

        {/* Trophy Case / Achievements */}
        <div className="space-y-2">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Achievements & Badges
          </div>
          <div className="space-y-2">
            {profile.achievements.map((ach) => (
              <div
                key={ach.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  ach.unlocked
                    ? "bg-slate-950/80 border-amber-500/40"
                    : "bg-slate-950/40 border-slate-800/80 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ach.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      {ach.title}
                      {ach.unlocked ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-500" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{ach.description}</div>
                  </div>
                </div>
                {ach.unlockedAt && (
                  <span className="text-[10px] font-mono text-amber-400/80">{ach.unlockedAt}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
