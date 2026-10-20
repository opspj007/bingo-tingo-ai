import { useEffect, useRef } from "react";
import { AIDifficulty, PowerUpType } from "../../types";
import { TwoPlayerCell, CallBall, PlayerStats } from "./types";

interface UseAIPlayerProps {
  enabled: boolean;
  difficulty: AIDifficulty;
  drawnBalls: CallBall[];
  aiCards: TwoPlayerCell[];
  aiStats: PlayerStats;
  isAiFrozen: boolean;
  gameStatus: string;
  onAiMarkCell: (cellIndex: number) => void;
  onAiUsePowerup: (powerup: PowerUpType) => void;
  onAiClaimBingo: () => void;
}

export function useAIPlayer({
  enabled,
  difficulty,
  drawnBalls,
  aiCards,
  aiStats,
  isAiFrozen,
  gameStatus,
  onAiMarkCell,
  onAiUsePowerup,
  onAiClaimBingo,
}: UseAIPlayerProps) {
  const processedBallsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || gameStatus !== "playing" || isAiFrozen) return;

    if (drawnBalls.length === 0) {
      processedBallsRef.current.clear();
      return;
    }

    const latestBall = drawnBalls[0];
    if (!latestBall || processedBallsRef.current.has(latestBall.id)) return;
    processedBallsRef.current.add(latestBall.id);

    // AI reaction latency based on difficulty
    let delayMs = 2500;
    let missChance = 0;

    switch (difficulty) {
      case "easy":
        delayMs = 3500 + Math.random() * 2000;
        missChance = 0.35; // 35% miss chance
        break;
      case "medium":
        delayMs = 2000 + Math.random() * 1200;
        missChance = 0.12; // 12% miss chance
        break;
      case "hard":
        delayMs = 1000 + Math.random() * 800;
        missChance = 0.02; // 2% miss
        break;
      case "expert":
        delayMs = 450 + Math.random() * 550; // fast 0.5s - 1.0s
        missChance = 0.0;
        break;
    }

    const timer = setTimeout(() => {
      // Find matching unmarked cell
      if (Math.random() < missChance) return; // missed

      const matchIdx = aiCards.findIndex(
        (c) =>
          !c.marked &&
          !c.isFree &&
          (c.text.toLowerCase() === latestBall.label.toLowerCase() ||
            (latestBall.number !== undefined && c.text.includes(String(latestBall.number))))
      );

      if (matchIdx !== -1) {
        onAiMarkCell(matchIdx);

        // Expert & Hard AI tactical power-up deployment
        if ((difficulty === "hard" || difficulty === "expert") && Math.random() < 0.4) {
          if (aiStats.powerUps["block-opponent"] > 0 && Math.random() < 0.35) {
            setTimeout(() => onAiUsePowerup("block-opponent"), 600);
          } else if (aiStats.powerUps["double-points"] > 0 && Math.random() < 0.4) {
            setTimeout(() => onAiUsePowerup("double-points"), 500);
          } else if (aiStats.powerUps["shield"] > 0 && !aiStats.hasShield) {
            setTimeout(() => onAiUsePowerup("shield"), 800);
          }
        }
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [drawnBalls, enabled, gameStatus, isAiFrozen, difficulty, aiCards]);

  // AI Bingo Claim Detection
  useEffect(() => {
    if (!enabled || gameStatus !== "playing") return;
    if (aiStats.linesCount >= 1) {
      // Small human-like reaction to shout BINGO!
      const claimTimer = setTimeout(() => {
        onAiClaimBingo();
      }, difficulty === "expert" ? 300 : 1200);
      return () => clearTimeout(claimTimer);
    }
  }, [aiStats.linesCount, enabled, gameStatus, difficulty]);
}
