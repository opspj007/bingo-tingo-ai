import React from "react";
import { Zap, Search, Shield, RefreshCw, Snowflake, Target, Clock, Flame } from "lucide-react";
import { PowerUpType } from "../../types";

interface PowerUpBarProps {
  powerUps: Record<PowerUpType, number>;
  disabled: boolean;
  isFrozen: boolean;
  onUsePowerUp: (type: PowerUpType) => void;
}

interface PowerUpMeta {
  type: PowerUpType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
}

const POWERUP_METAS: PowerUpMeta[] = [
  {
    type: "double-points",
    label: "Double Pts",
    desc: "2x Score on next lines",
    icon: <Zap className="w-4 h-4 text-amber-300" />,
    color: "border-amber-400/50 text-amber-300",
    bgGradient: "hover:from-amber-600/30 hover:to-amber-800/30",
  },
  {
    type: "reveal-number",
    label: "Reveal",
    desc: "Highlight match numbers",
    icon: <Search className="w-4 h-4 text-cyan-300" />,
    color: "border-cyan-400/50 text-cyan-300",
    bgGradient: "hover:from-cyan-600/30 hover:to-cyan-800/30",
  },
  {
    type: "shield",
    label: "Shield",
    desc: "Block opponent attack",
    icon: <Shield className="w-4 h-4 text-emerald-300" />,
    color: "border-emerald-400/50 text-emerald-300",
    bgGradient: "hover:from-emerald-600/30 hover:to-emerald-800/30",
  },
  {
    type: "block-opponent",
    label: "Freeze",
    desc: "Freeze opponent for 5s",
    icon: <Snowflake className="w-4 h-4 text-blue-300" />,
    color: "border-blue-400/50 text-blue-300",
    bgGradient: "hover:from-blue-600/30 hover:to-blue-800/30",
  },
  {
    type: "lucky-mark",
    label: "Lucky Mark",
    desc: "Instant free mark on any tile",
    icon: <Target className="w-4 h-4 text-rose-300" />,
    color: "border-rose-400/50 text-rose-300",
    bgGradient: "hover:from-rose-600/30 hover:to-rose-800/30",
  },
  {
    type: "swap-card",
    label: "Swap Tiles",
    desc: "Reroll unmarked tiles",
    icon: <RefreshCw className="w-4 h-4 text-purple-300" />,
    color: "border-purple-400/50 text-purple-300",
    bgGradient: "hover:from-purple-600/30 hover:to-purple-800/30",
  },
  {
    type: "time-boost",
    label: "+15s Time",
    desc: "Extend match timer",
    icon: <Clock className="w-4 h-4 text-orange-300" />,
    color: "border-orange-400/50 text-orange-300",
    bgGradient: "hover:from-orange-600/30 hover:to-orange-800/30",
  },
  {
    type: "combo-multiplier",
    label: "Combo Boost",
    desc: "Increase combo multiplier",
    icon: <Flame className="w-4 h-4 text-red-300" />,
    color: "border-red-400/50 text-red-300",
    bgGradient: "hover:from-red-600/30 hover:to-red-800/30",
  },
];

export const PowerUpBar: React.FC<PowerUpBarProps> = ({
  powerUps,
  disabled,
  isFrozen,
  onUsePowerUp,
}) => {
  return (
    <div className="w-full bg-slate-900/90 border-t border-slate-800 p-2.5 backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 overflow-x-auto py-1 scrollbar-none">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap hidden sm:block">
          TACTICAL POWER-UPS:
        </div>

        <div className="flex items-center gap-1.5 flex-1 justify-center sm:justify-start overflow-x-auto">
          {POWERUP_METAS.map((p) => {
            const count = powerUps[p.type] || 0;
            const canUse = count > 0 && !disabled && !isFrozen;

            return (
              <button
                key={p.type}
                onClick={() => canUse && onUsePowerUp(p.type)}
                disabled={!canUse}
                title={`${p.label}: ${p.desc} (${count} remaining)`}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all whitespace-nowrap cursor-pointer select-none ${
                  canUse
                    ? `bg-slate-800/90 ${p.color} ${p.bgGradient} hover:scale-105 active:scale-95 shadow-xs`
                    : "bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                }`}
              >
                {p.icon}
                <span className="text-[11px] font-medium hidden md:inline">{p.label}</span>
                <span
                  className={`text-[10px] font-mono font-black px-1 rounded ${
                    count > 0 ? "bg-white/20 text-white" : "text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
