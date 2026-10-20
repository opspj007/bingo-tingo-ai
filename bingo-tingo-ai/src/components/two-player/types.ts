import { GameMode, AIDifficulty, PowerUpType, PlayerProfile } from "../../types";

export interface TwoPlayerCell {
  id: string;
  text: string;
  emoji?: string;
  isFree?: boolean;
  marked: boolean;
  markedAt?: number;
}

export interface CallBall {
  id: string;
  label: string;
  letter?: string;
  number?: number;
  color?: string;
}

export interface PlayerStats {
  score: number;
  linesCount: number;
  completedLines: number[][];
  comboMultiplier: number;
  hasShield: boolean;
  isFrozen: boolean;
  doublePointsActive: boolean;
  powerUps: Record<PowerUpType, number>;
}

export interface SeriesState {
  enabled: boolean;
  targetWins: number; // 2 for Bo3, 3 for Bo5
  p1Wins: number;
  p2Wins: number;
  currentMatch: number;
}
