import { useState, useEffect } from "react";
import { PlayerProfile } from "../../types";

const INITIAL_PROFILE: PlayerProfile = {
  name: "Player 1",
  avatar: "⚡",
  level: 5,
  xp: 420,
  xpNextLevel: 600,
  coins: 250,
  winStreak: 3,
  totalWins: 14,
  totalGames: 22,
  achievements: [
    {
      id: "first_bingo",
      title: "First Bingo",
      description: "Call your very first Bingo victory",
      icon: "🏆",
      unlocked: true,
      unlockedAt: "2026-09-18",
    },
    {
      id: "speed_player",
      title: "Speed Player",
      description: "Mark a called ball in under 1 second",
      icon: "⚡",
      unlocked: true,
      unlockedAt: "2026-09-19",
    },
    {
      id: "win_streak_5",
      title: "5 Win Streak",
      description: "Win 5 matches consecutively in duel arena",
      icon: "🔥",
      unlocked: false,
    },
    {
      id: "tingo_master",
      title: "Tingo Master",
      description: "Complete 5 lines in a single match (Full House)",
      icon: "👑",
      unlocked: false,
    },
    {
      id: "games_100",
      title: "100 Games Played",
      description: "Play 100 competitive Bingo Tingo matches",
      icon: "💯",
      unlocked: false,
    },
    {
      id: "unbreakable_shield",
      title: "Unbreakable Shield",
      description: "Block an opponent's freeze attack with Shield",
      icon: "🛡️",
      unlocked: false,
    },
    {
      id: "sniper_mark",
      title: "Sniper Mark",
      description: "Earn a 3.0x combo multiplier streak",
      icon: "🎯",
      unlocked: true,
      unlockedAt: "2026-09-20",
    },
  ],
};

const STORAGE_KEY = "bingo_tingo_player_profile_v2";

export function usePlayerProfile() {
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    if (typeof window === "undefined") return INITIAL_PROFILE;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to load player profile:", e);
    }
    return INITIAL_PROFILE;
  });

  const saveProfile = (updated: PlayerProfile) => {
    setProfile(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save player profile:", e);
    }
  };

  const addMatchResult = (won: boolean, score: number, lines: number) => {
    const xpGained = won ? 150 + Math.floor(score / 10) : 50 + Math.floor(score / 20);
    const coinsGained = won ? 50 : 15;

    let newXp = profile.xp + xpGained;
    let newLevel = profile.level;
    let newXpNext = profile.xpNextLevel;

    while (newXp >= newXpNext) {
      newXp -= newXpNext;
      newLevel += 1;
      newXpNext = Math.round(newXpNext * 1.25);
    }

    const newStreak = won ? profile.winStreak + 1 : 0;
    const newTotalWins = won ? profile.totalWins + 1 : profile.totalWins;
    const newTotalGames = profile.totalGames + 1;

    // Check achievement unlocks
    const updatedAchievements = profile.achievements.map((ach) => {
      if (ach.id === "first_bingo" && won && !ach.unlocked) {
        return { ...ach, unlocked: true, unlockedAt: new Date().toISOString().slice(0, 10) };
      }
      if (ach.id === "win_streak_5" && newStreak >= 5 && !ach.unlocked) {
        return { ...ach, unlocked: true, unlockedAt: new Date().toISOString().slice(0, 10) };
      }
      if (ach.id === "tingo_master" && lines >= 5 && !ach.unlocked) {
        return { ...ach, unlocked: true, unlockedAt: new Date().toISOString().slice(0, 10) };
      }
      if (ach.id === "games_100" && newTotalGames >= 100 && !ach.unlocked) {
        return { ...ach, unlocked: true, unlockedAt: new Date().toISOString().slice(0, 10) };
      }
      return ach;
    });

    const updatedProfile: PlayerProfile = {
      ...profile,
      level: newLevel,
      xp: newXp,
      xpNextLevel: newXpNext,
      coins: profile.coins + coinsGained,
      winStreak: newStreak,
      totalWins: newTotalWins,
      totalGames: newTotalGames,
      achievements: updatedAchievements,
    };

    saveProfile(updatedProfile);
    return { xpGained, coinsGained, leveledUp: newLevel > profile.level };
  };

  const updateAvatarAndName = (name: string, avatar: string) => {
    saveProfile({ ...profile, name, avatar });
  };

  return {
    profile,
    addMatchResult,
    updateAvatarAndName,
  };
}
