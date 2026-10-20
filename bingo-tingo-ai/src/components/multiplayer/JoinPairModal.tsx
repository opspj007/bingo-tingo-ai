import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { X, Gamepad2, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { playSoundEffect } from "../../utils/audioEffects";

interface JoinPairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess: (pairCode: string, isHost: boolean) => void;
  initialCode?: string;
}

export const JoinPairModal: React.FC<JoinPairModalProps> = ({
  isOpen,
  onClose,
  onJoinSuccess,
  initialCode = "",
}) => {
  const { currentUser, token } = useAuth();
  const [pairCode, setPairCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = pairCode.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter a Pair Code.");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/multiplayer/join-pair", {
        method: "POST",
        headers,
        body: JSON.stringify({
          pairCode: cleanCode,
          playerName: currentUser?.username || "Player 2",
          playerAvatar: currentUser?.avatar || "🔥",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to join match. Please check the code.");
        playSoundEffect("error");
      } else {
        playSoundEffect("celebration");
        onJoinSuccess(data.pairCode || cleanCode, false);
        onClose();
      }
    } catch (e: any) {
      setError(e.message || "Network error while connecting.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-stone-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden text-stone-100 p-6 md:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold mb-2">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black tracking-wider text-amber-400 font-mono uppercase">
            Join Match Pair
          </h2>
          <p className="text-xs text-stone-400 font-mono mt-1">
            Enter the 6-character code shared by your friend
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider font-mono mb-2 text-center">
              Shared Pair Code
            </label>
            <input
              type="text"
              value={pairCode}
              onChange={(e) => setPairCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7K9P-X2"
              maxLength={12}
              className="w-full px-4 py-3 bg-stone-950 border-2 border-stone-800 focus:border-amber-500 rounded-xl text-stone-100 text-center text-xl font-black tracking-widest uppercase font-mono focus:outline-none transition-all placeholder:text-stone-700"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isJoining || !pairCode.trim()}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer font-mono"
          >
            {isJoining ? "Connecting..." : "JOIN GAME"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
