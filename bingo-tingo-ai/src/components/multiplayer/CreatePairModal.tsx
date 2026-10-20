import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { X, Copy, Check, Share2, Gamepad2, Users, Sparkles, ArrowRight, Shield } from "lucide-react";
import { playSoundEffect } from "../../utils/audioEffects";

interface CreatePairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPairCreated: (pairCode: string, isHost: boolean) => void;
  customCards?: any[];
}

export const CreatePairModal: React.FC<CreatePairModalProps> = ({
  isOpen,
  onClose,
  onPairCreated,
  customCards = [],
}) => {
  const { currentUser, token, friends, inviteFriendToGame } = useAuth();
  const [gridSize, setGridSize] = useState<number>(5);
  const [gameMode, setGameMode] = useState<string>("battle");
  const [cardDifficulty, setCardDifficulty] = useState<string>("numbers");
  const [targetLines, setTargetLines] = useState<number>(3);
  const [timeLimitSec, setTimeLimitSec] = useState<number>(300);

  const [isCreating, setIsCreating] = useState(false);
  const [generatedPairCode, setGeneratedPairCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [invitedFriendId, setInvitedFriendId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreatePair = async () => {
    setIsCreating(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/multiplayer/create-pair", {
        method: "POST",
        headers,
        body: JSON.stringify({
          hostName: currentUser?.username || "Player 1",
          hostAvatar: currentUser?.avatar || "⚡",
          gridSize,
          gameMode,
          cardDifficulty,
          targetLines,
          timeLimitSec,
          powerUpsEnabled: true,
          cards: customCards,
        }),
      });

      const data = await res.json();
      if (res.ok && data.pairCode) {
        setGeneratedPairCode(data.pairCode);
        playSoundEffect("celebration");
      }
    } catch (e) {
      console.error("Failed to create pair", e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = () => {
    if (!generatedPairCode) return;
    navigator.clipboard.writeText(generatedPairCode);
    setCopied(true);
    playSoundEffect("click");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyInviteLink = () => {
    if (!generatedPairCode) return;
    const link = `${window.location.origin}?pair=${generatedPairCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    playSoundEffect("click");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteFriend = async (friendId: string) => {
    setInvitedFriendId(friendId);
    const res = await inviteFriendToGame(friendId, gridSize, gameMode);
    if (res.success && res.pairCode) {
      setGeneratedPairCode(res.pairCode);
    }
  };

  const handleEnterArena = () => {
    if (generatedPairCode) {
      onPairCreated(generatedPairCode, true);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-stone-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden text-stone-100 p-6 md:p-8">
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
            Create Match Pair
          </h2>
          <p className="text-xs text-stone-400 font-mono mt-1">
            2 Players • Synchronized Deck • Server Authoritative
          </p>
        </div>

        {!generatedPairCode ? (
          <div className="space-y-4">
            {/* Game Mode Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider font-mono mb-2">
                Game Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "battle", label: "Tingo Battle", desc: "Power-ups & combos" },
                  { id: "classic", label: "Classic Bingo", desc: "Pure number race" },
                  { id: "series-bo3", label: "Best of 3", desc: "Championship series" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setGameMode(m.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      gameMode === m.id
                        ? "bg-amber-500/15 border-amber-500 text-amber-300"
                        : "bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700"
                    }`}
                  >
                    <div className="font-bold text-xs font-mono">{m.label}</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Size Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider font-mono mb-2">
                Card Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { size: 5, label: "5 × 5 (Classic)", target: 3 },
                  { size: 4, label: "4 × 4 (Speed)", target: 2 },
                  { size: 3, label: "3 × 3 (Blitz)", target: 1 },
                ].map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => {
                      setGridSize(s.size);
                      setTargetLines(s.target);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-mono transition-all ${
                      gridSize === s.size
                        ? "bg-amber-500 text-stone-950 font-black border-amber-400 shadow"
                        : "bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700"
                    }`}
                  >
                    <div className="text-xs font-bold">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Win Condition Target */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider font-mono mb-1.5">
                  Winning Target
                </label>
                <select
                  value={targetLines}
                  onChange={(e) => setTargetLines(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>1 Line (Quick)</option>
                  <option value={2}>2 Lines</option>
                  <option value={3}>3 Lines (Standard)</option>
                  <option value={5}>5 Lines (Full Bingo)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider font-mono mb-1.5">
                  Time Limit
                </label>
                <select
                  value={timeLimitSec}
                  onChange={(e) => setTimeLimitSec(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value={120}>2 Minutes (Blitz)</option>
                  <option value={180}>3 Minutes</option>
                  <option value={300}>5 Minutes (Normal)</option>
                  <option value={0}>Unlimited Time</option>
                </select>
              </div>
            </div>

            {/* Create Action Button */}
            <button
              type="button"
              onClick={handleCreatePair}
              disabled={isCreating}
              className="w-full py-3.5 px-4 mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer font-mono"
            >
              {isCreating ? "Generating Pair..." : "CREATE PAIR"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Pair Code Generated Screen */
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="text-center p-6 bg-stone-950 rounded-2xl border-2 border-dashed border-amber-500/50">
              <span className="text-xs uppercase font-mono tracking-widest text-stone-400">
                Your Shared Pair Code
              </span>
              <div className="text-4xl font-black font-mono tracking-widest text-amber-400 my-2">
                {generatedPairCode}
              </div>
              <p className="text-[11px] text-stone-500 font-mono">
                Give this code to Player 2 to join your arena match!
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono rounded-xl border border-stone-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "COPIED!" : "COPY CODE"}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono rounded-xl border border-stone-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>COPY LINK</span>
              </button>
            </div>

            {/* Online Friends Quick Invite */}
            {friends.length > 0 && (
              <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl space-y-2">
                <div className="text-[11px] font-mono text-stone-400 flex items-center justify-between">
                  <span>Invite from Friends list:</span>
                  <span className="text-emerald-400 font-bold">
                    {friends.filter((f) => f.isOnline).length} Online
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {friends.map((f) => (
                    <button
                      key={f.friendId}
                      type="button"
                      onClick={() => handleInviteFriend(f.friendId)}
                      disabled={invitedFriendId === f.friendId}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-xs font-mono border border-stone-700 text-stone-300 transition-colors flex items-center gap-1"
                    >
                      <span>{f.avatar}</span>
                      <span>{f.username}</span>
                      {invitedFriendId === f.friendId && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Enter Arena Button */}
            <button
              type="button"
              onClick={handleEnterArena}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
            >
              <span>ENTER ARENA LOBBY</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
