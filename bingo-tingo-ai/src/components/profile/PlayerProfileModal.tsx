import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { MatchHistoryItem } from "../../types/multiplayer";
import { X, Trophy, Flame, Star, Users, Gamepad2, LogOut, Clock, Award, Shield } from "lucide-react";

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATARS = ["⚡", "🔥", "👑", "⭐", "🎯", "💎", "🦁", "🚀", "🦊", "🐉"];

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, token, logout, updateAvatar } = useAuth();
  const [activeTab, setActiveTab] = useState<"stats" | "history">("stats");
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && token && activeTab === "history") {
      setLoadingHistory(true);
      fetch("/api/history", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setHistory(data.history || []);
        })
        .catch((e) => console.error("Failed to load match history", e))
        .finally(() => setLoadingHistory(false));
    }
  }, [isOpen, token, activeTab]);

  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-stone-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden text-stone-100 p-6 md:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header matching wireframe */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-stone-800">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20 border-2 border-amber-300">
              {currentUser.avatar || "👤"}
            </div>
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-stone-950 border border-amber-400 text-[10px] font-black font-mono text-amber-400">
              Lv. {currentUser.level}
            </div>
          </div>

          <h2 className="text-2xl font-black tracking-widest text-amber-300 font-mono uppercase">
            {currentUser.username}
          </h2>
          <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent my-2" />
          <div className="flex items-center gap-3 text-sm font-semibold text-stone-300">
            <span className="text-amber-400 font-bold">Level {currentUser.level}</span>
            <span className="text-stone-600">•</span>
            <span className="flex items-center gap-1 text-amber-300 font-mono font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {currentUser.score.toLocaleString()} Points
            </span>
          </div>

          {/* Quick Avatar selector */}
          <div className="flex items-center gap-1.5 mt-4 p-1.5 bg-stone-950 rounded-xl border border-stone-800">
            {AVATARS.slice(0, 6).map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => updateAvatar(av)}
                className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                  currentUser.avatar === av
                    ? "bg-amber-500 text-stone-950 scale-110 shadow"
                    : "hover:bg-stone-800 text-stone-400"
                }`}
                title="Change Avatar"
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-stone-950 rounded-xl border border-stone-800 my-4">
          <button
            type="button"
            onClick={() => setActiveTab("stats")}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "stats"
                ? "bg-amber-500 text-stone-950 shadow-md"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Player Stats
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "history"
                ? "bg-amber-500 text-stone-950 shadow-md"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Match History
          </button>
        </div>

        {/* Stats View matching wireframe */}
        {activeTab === "stats" ? (
          <div className="space-y-3 bg-stone-950/70 p-4 rounded-xl border border-stone-800 font-mono text-sm">
            <div className="flex justify-between items-center py-2 border-b border-stone-800/80">
              <span className="text-stone-400 flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-stone-500" />
                Games Played
              </span>
              <span className="font-bold text-stone-100 text-base">{currentUser.gamesPlayed}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-stone-800/80">
              <span className="text-stone-400 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Games Won
              </span>
              <span className="font-bold text-emerald-400 text-base">{currentUser.wins}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-stone-800/80">
              <span className="text-stone-400 flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                Win Rate
              </span>
              <span className="font-bold text-amber-400 text-base">{currentUser.winRate}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-stone-800/80">
              <span className="text-stone-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Current Streak
              </span>
              <span className="font-bold text-orange-400 text-base flex items-center gap-1">
                {currentUser.streak}
                {currentUser.streak > 2 && "🔥"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-stone-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Friends
              </span>
              <span className="font-bold text-stone-100 text-base">{currentUser.friendsCount}</span>
            </div>
          </div>
        ) : (
          /* Match History View */
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {loadingHistory ? (
              <div className="py-8 text-center text-stone-500 text-xs font-mono">
                Loading match records...
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-stone-500 text-xs font-mono bg-stone-950/60 rounded-xl border border-stone-800">
                No online matches recorded yet. Play a match to build your history!
              </div>
            ) : (
              history.map((m) => {
                const isWinner = m.winnerId === currentUser.id;
                const opponentName = isWinner ? m.loserName : m.winnerName;
                const scoreDiff = isWinner ? `+${m.winnerScore}` : `+${Math.floor(m.loserScore / 2)}`;

                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                      isWinner
                        ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                        : "bg-rose-950/30 border-rose-500/40 text-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isWinner ? "bg-emerald-500 text-stone-950" : "bg-rose-500 text-stone-950"
                        }`}
                      >
                        {isWinner ? "W" : "L"}
                      </div>
                      <div>
                        <div className="font-bold text-stone-200">
                          vs {opponentName}
                        </div>
                        <div className="text-[10px] text-stone-400 flex items-center gap-2">
                          <span className="uppercase">{m.gameMode}</span>
                          <span>•</span>
                          <span>{new Date(m.completedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-black ${isWinner ? "text-emerald-400" : "text-amber-400"}`}>
                        {scoreDiff} pts
                      </div>
                      <div className="text-[10px] text-stone-500 uppercase">
                        Pair: {m.pairCode || "Live"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Logout Action */}
        <div className="mt-6 pt-4 border-t border-stone-800 flex justify-between items-center">
          <span className="text-[11px] text-stone-500 font-mono">
            ID: {currentUser.id.slice(0, 12)}
          </span>
          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            className="px-4 py-2 bg-stone-800 hover:bg-red-950/80 hover:text-red-300 hover:border-red-500/40 text-stone-300 text-xs font-bold rounded-xl border border-stone-700 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
