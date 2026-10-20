export type ElementType = "title" | "subtitle" | "text" | "bingo" | "shape" | "emoji" | "symbol" | "image" | "frame" | "grid-item";

export type EntranceAnimation = "none" | "fade-in" | "slide-up" | "bounce" | "zoom-in";

export type BingoLayoutTheme = "atelier" | "vegas" | "editorial" | "arcade" | "parchment";
export type MarkStampStyle = "dabber" | "star" | "check" | "heart" | "ring";
export type FreeSpaceStyle = "crown" | "star" | "gem" | "heart" | "text-only";

export interface BingoCell {
  id: string;
  text: string;
  emoji?: string;
  isFree?: boolean;
  marked?: boolean;
  callNumber?: number; // e.g. 1-75 bingo call ball number
}

export interface CanvasItem {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  locked?: boolean;
  zIndex?: number;

  // Text / Content properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
  fontStyle?: "normal" | "italic";
  fontWeight?: "normal" | "bold";
  textDecoration?: "none" | "underline";
  letterSpacing?: number;

  // Box / Border properties
  borderRadius?: number; // in px
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: "solid" | "dashed" | "dotted" | "double";
  effect?: string; // e.g. "neon-glow", "glitch", etc.

  // Shape properties
  shapeType?: "rectangle" | "circle" | "star" | "triangle" | "heart" | "badge";
  
  // Image properties
  imageUrl?: string;
  imageEffect?: "none" | "grayscale" | "sepia" | "blur";

  // Bingo card specific properties
  bingoGridSize?: number; // 3, 4, or 5
  bingoCells?: BingoCell[];
  cellBg?: string;
  cellTextColor?: string;

  // Advanced Bingo Card Layout & Styling
  bingoLayoutTheme?: BingoLayoutTheme;
  showBingoHeader?: boolean;
  bingoHeaderTitle?: string; // e.g. "BINGO", "PLAY", "GOALS", etc.
  bingoHeaderBg?: string;
  bingoHeaderTextColor?: string;
  showCellNumbers?: boolean;
  cellNumberType?: "index" | "call-number";
  cellGap?: number; // gap in px (default 6)
  cellBorderRadius?: number; // cell corner radius
  cellBorderColor?: string;
  cellBorderWidth?: number;
  markStampStyle?: MarkStampStyle;
  dabberColor?: string;
  showCardFooter?: boolean;
  cardSerialText?: string;
  cardRulesText?: string;
  showOrnamentalFrame?: boolean;
  freeSpaceStyle?: FreeSpaceStyle;
  freeSpaceText?: string;
  freeSpaceBg?: string;
  freeSpaceTextColor?: string;

  // Entrance animation properties
  animation?: EntranceAnimation;
  animationDuration?: number; // in seconds, default e.g. 0.8
  animationDelay?: number; // in seconds, default 0
}

export interface TemplatePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  category: "bingo" | "social" | "marketing" | "profile";
}

export interface CanvasBorderConfig {
  topColor: string;
  rightColor: string;
  bottomColor: string;
  leftColor: string;
  borderWidth: number;
  borderRightWidth: number;
  borderBottomWidth: number;
  borderLeftWidth: number;
  borderRadius: number;
}

export interface TabData {
  id: string;
  title: string;
  width: number;
  height: number;
  canvasBgColor: string;
  containerBgColor: string;
  bgImageUrl?: string;
  borderConfig: CanvasBorderConfig;
  items: CanvasItem[];
}

export interface GalleryTemplate {
  id: string;
  title: string;
  category: "all" | "bingo" | "social" | "games" | "work" | "community";
  author: string;
  tags: string[];
  description: string;
  likes: number;
  width: number;
  height: number;
  canvasBgColor: string;
  containerBgColor: string;
  bgImageUrl?: string;
  borderConfig: CanvasBorderConfig;
  items: CanvasItem[];
  isCommunity?: boolean;
  createdAt?: string;
}

export type ExportFormat = "png" | "jpeg" | "pdf" | "json" | "deck";
export type PdfPageSize = "fit" | "letter" | "a4" | "photo";

export interface DownloadCardConfig {
  format: ExportFormat;
  resolution: number; // 1 to 4
  filename: string;
  transparentBg: boolean;
  jpegQuality: number; // 0.7 - 1.0
  pdfPageSize: PdfPageSize;
  pdfOrientation: "auto" | "portrait" | "landscape";
  addCutGuides: boolean;
  deckCount: number;
  deckFormat: "pdf" | "zip";
  includeWatermark: boolean;
  customWatermarkText?: string;
}

// ==========================================
// 2-PLAYER BINGO TINGO COMPETITIVE SYSTEM
// ==========================================

export type GameMode =
  | "classic"      // First to complete target pattern/lines wins
  | "race"         // First to complete 1, 2, or 3 lines
  | "battle"       // Compete for high score in time limit
  | "time-attack"  // Complete target before clock expires
  | "series-bo3"   // Best of 3 matches
  | "series-bo5"   // Best of 5 matches
  | "sudden-death"; // Next line wins or sudden tie breaker

export type AIDifficulty = "easy" | "medium" | "hard" | "expert";

export type PowerUpType =
  | "double-points"    // ⚡ 2x score on lines & marks
  | "reveal-number"    // 🔍 Highlights matching active numbers
  | "shield"           // 🛡️ Blocks opponent freeze / attack
  | "swap-card"        // 🔄 Reshuffles unmarked tiles
  | "block-opponent"   // ❌ Freezes opponent for 5 seconds
  | "lucky-mark"       // 🎯 Free instant mark on any eligible tile
  | "time-boost"       // ⏱️ Adds +15s to match timer
  | "combo-multiplier"; // 🔥 Boosts combo meter

export interface PlayerPowerUpInventory {
  type: PowerUpType;
  count: number;
}

export interface PlayerProfile {
  name: string;
  avatar: string; // Emoji or avatar badge
  level: number;
  xp: number;
  xpNextLevel: number;
  coins: number;
  winStreak: number;
  totalWins: number;
  totalGames: number;
  achievements: {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedAt?: string;
  }[];
}

export interface MatchScoreboard {
  p1Name: string;
  p1Avatar: string;
  p1Score: number;
  p1Lines: number;
  p1Progress: number; // 0 - 100%
  p1Combo: number;

  p2Name: string;
  p2Avatar: string;
  p2Score: number;
  p2Lines: number;
  p2Progress: number; // 0 - 100%
  p2Combo: number;
}


