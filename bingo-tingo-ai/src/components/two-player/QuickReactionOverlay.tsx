import React, { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";

interface QuickReactionOverlayProps {
  onSendReaction: (emoji: string) => void;
  incomingReaction?: { emoji: string; slot: 1 | 2; id: number } | null;
}

const REACTIONS = ["👏", "🔥", "😂", "😱", "😎", "GG", "❤️", "⚡"];

export const QuickReactionOverlay: React.FC<QuickReactionOverlayProps> = ({
  onSendReaction,
  incomingReaction,
}) => {
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: number; emoji: string; left: number; slot: 1 | 2 }[]
  >([]);

  useEffect(() => {
    if (!incomingReaction) return;

    const newId = incomingReaction.id || Date.now();
    const newEmoji = {
      id: newId,
      emoji: incomingReaction.emoji,
      left: 20 + Math.random() * 60,
      slot: incomingReaction.slot,
    };

    setFloatingEmojis((prev) => [...prev, newEmoji]);

    const timer = setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== newId));
    }, 2400);

    return () => clearTimeout(timer);
  }, [incomingReaction]);

  return (
    <>
      {/* Floating Animated Emojis */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-20 text-4xl animate-float-up"
            style={{ left: `${item.left}%` }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Reaction Buttons Drawer */}
      <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 p-1.5 rounded-full backdrop-blur-md shadow-md">
        <span className="text-[10px] font-mono text-slate-400 pl-2 pr-1 hidden sm:inline">React:</span>
        {REACTIONS.map((r) => (
          <button
            key={r}
            onClick={() => onSendReaction(r)}
            className="w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 hover:scale-125 active:scale-95 text-sm flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            {r}
          </button>
        ))}
      </div>
    </>
  );
};
