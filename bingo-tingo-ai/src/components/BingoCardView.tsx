import React, { useState, useMemo } from "react";
import {
  BingoCell,
  BingoLayoutTheme,
  MarkStampStyle,
  FreeSpaceStyle,
  CanvasItem,
} from "../types";
import {
  Sparkles,
  Shuffle,
  RotateCcw,
  CheckCircle,
  Edit3,
  Crown,
  Star,
  Heart,
  Target,
  Trophy,
  Award,
  Flame,
  Check,
} from "lucide-react";

interface BingoCardViewProps {
  gridSize?: number;
  cells: BingoCell[];
  cellBg?: string;
  cellTextColor?: string;
  fontFamily?: string;

  // Advanced Card Layout Props
  layoutTheme?: BingoLayoutTheme;
  showBingoHeader?: boolean;
  bingoHeaderTitle?: string;
  bingoHeaderBg?: string;
  bingoHeaderTextColor?: string;
  showCellNumbers?: boolean;
  cellNumberType?: "index" | "call-number";
  cellGap?: number;
  cellBorderRadius?: number;
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

  onUpdateCell: (cellId: string, newText: string, emoji?: string) => void;
  onToggleMarkCell: (cellId: string) => void;
  onShuffleCells: () => void;
  onResetMarks?: () => void;
  onUpdateCardLayout?: (updated: Partial<CanvasItem>) => void;
}

// Vegas column color scheme
const VEGAS_COL_COLORS = [
  { bg: "#dc2626", text: "#ffffff", border: "#991b1b" }, // Red
  { bg: "#2563eb", text: "#ffffff", border: "#1e40af" }, // Blue
  { bg: "#d97706", text: "#ffffff", border: "#b45309" }, // Amber
  { bg: "#16a34a", text: "#ffffff", border: "#15803d" }, // Green
  { bg: "#9333ea", text: "#ffffff", border: "#7e22ce" }, // Purple
];

// Call number ranges for 75-ball bingo
const CALL_NUMBER_RANGES = [
  { prefix: "B", min: 1, max: 15 },
  { prefix: "I", min: 16, max: 30 },
  { prefix: "N", min: 31, max: 45 },
  { prefix: "G", min: 46, max: 60 },
  { prefix: "O", min: 61, max: 75 },
];

export const BingoCardView: React.FC<BingoCardViewProps> = ({
  gridSize = 4,
  cells,
  cellBg = "#fffdf9",
  cellTextColor = "#1c1917",
  fontFamily = "inherit",

  // Advanced Layout
  layoutTheme = "atelier",
  showBingoHeader = true,
  bingoHeaderTitle,
  bingoHeaderBg,
  bingoHeaderTextColor,
  showCellNumbers = true,
  cellNumberType = "index",
  cellGap = 6,
  cellBorderRadius = 8,
  cellBorderColor,
  cellBorderWidth = 1,
  markStampStyle = "dabber",
  dabberColor = "#b91c1c", // Classic red ink dabber
  showCardFooter = true,
  cardSerialText = "№ 04829 • ATELIER CERTIFIED",
  cardRulesText = "5 IN A ROW WINS • CALL BINGO!",
  showOrnamentalFrame = true,
  freeSpaceStyle = "crown",
  freeSpaceText,
  freeSpaceBg,
  freeSpaceTextColor,

  onUpdateCell,
  onToggleMarkCell,
  onShuffleCells,
  onResetMarks,
  onUpdateCardLayout,
}) => {
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editEmoji, setEditEmoji] = useState("");

  // Determine header letters based on grid size and title
  const headerLetters = useMemo(() => {
    let base = bingoHeaderTitle?.trim();
    if (!base) {
      if (gridSize === 5) base = "BINGO";
      else if (gridSize === 4) base = "PLAY";
      else if (gridSize === 3) base = "WIN";
      else base = "BINGO";
    }
    const letters = base.split("");
    while (letters.length < gridSize) {
      letters.push("★");
    }
    return letters.slice(0, gridSize);
  }, [gridSize, bingoHeaderTitle]);

  // Check for Bingo Win Lines (Row, Col, Diagonal)
  const winningIndices = useMemo(() => {
    const wins = new Set<number>();
    if (cells.length !== gridSize * gridSize) return wins;

    const isMarked = (idx: number) => cells[idx]?.marked || cells[idx]?.isFree;

    // Check Rows
    for (let r = 0; r < gridSize; r++) {
      let rowWin = true;
      for (let c = 0; c < gridSize; c++) {
        if (!isMarked(r * gridSize + c)) {
          rowWin = false;
          break;
        }
      }
      if (rowWin) {
        for (let c = 0; c < gridSize; c++) wins.add(r * gridSize + c);
      }
    }

    // Check Columns
    for (let c = 0; c < gridSize; c++) {
      let colWin = true;
      for (let r = 0; r < gridSize; r++) {
        if (!isMarked(r * gridSize + c)) {
          colWin = false;
          break;
        }
      }
      if (colWin) {
        for (let r = 0; r < gridSize; r++) wins.add(r * gridSize + c);
      }
    }

    // Check Diagonal 1 (top-left to bottom-right)
    let diag1Win = true;
    for (let i = 0; i < gridSize; i++) {
      if (!isMarked(i * gridSize + i)) {
        diag1Win = false;
        break;
      }
    }
    if (diag1Win) {
      for (let i = 0; i < gridSize; i++) wins.add(i * gridSize + i);
    }

    // Check Diagonal 2 (top-right to bottom-left)
    let diag2Win = true;
    for (let i = 0; i < gridSize; i++) {
      if (!isMarked(i * gridSize + (gridSize - 1 - i))) {
        diag2Win = false;
        break;
      }
    }
    if (diag2Win) {
      for (let i = 0; i < gridSize; i++) wins.add(i * gridSize + (gridSize - 1 - i));
    }

    return wins;
  }, [cells, gridSize]);

  const hasBingo = winningIndices.size > 0;

  // Cell editing handlers
  const handleStartEdit = (cell: BingoCell, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCellId(cell.id);
    setEditText(cell.text);
    setEditEmoji(cell.emoji || "");
  };

  const handleSaveEdit = (cellId: string) => {
    if (editText.trim()) {
      onUpdateCell(cellId, editText.trim(), editEmoji.trim() || undefined);
    }
    setEditingCellId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, cellId: string) => {
    if (e.key === "Enter") {
      handleSaveEdit(cellId);
    } else if (e.key === "Escape") {
      setEditingCellId(null);
    }
  };

  // Get cell call number or index badge
  const getCellBadge = (index: number) => {
    if (!showCellNumbers) return null;
    if (cellNumberType === "call-number" && gridSize === 5) {
      const col = index % 5;
      const row = Math.floor(index / 5);
      const range = CALL_NUMBER_RANGES[col];
      const val = range.min + row * 3;
      return `${range.prefix}-${val}`;
    }
    return `#${index + 1}`;
  };

  // Theme-specific styles
  const isAtelier = layoutTheme === "atelier";
  const isVegas = layoutTheme === "vegas";
  const isArcade = layoutTheme === "arcade";
  const isParchment = layoutTheme === "parchment";
  const isEditorial = layoutTheme === "editorial";

  // Grid columns style
  const gridColsStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
    gap: `${cellGap}px`,
  };

  // Render Mark / Stamp Graphic
  const renderStamp = (cell: BingoCell, index: number) => {
    if (!cell.marked) return null;

    // Pseudo-random angle per cell
    const rot = ((index * 23 + 11) % 40) - 20;

    switch (markStampStyle) {
      case "dabber":
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mix-blend-multiply opacity-80 flex items-center justify-center shadow-inner animate-scale-in"
              style={{
                background: `radial-gradient(circle, ${dabberColor}dd 20%, ${dabberColor}88 65%, transparent 95%)`,
                transform: `rotate(${rot}deg) scale(1.05)`,
                border: `2px dashed ${dabberColor}66`,
              }}
            >
              <div className="text-white font-black text-xs opacity-90 drop-shadow-sm select-none">
                ✓
              </div>
            </div>
          </div>
        );

      case "star":
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div
              className="p-1 rounded-full text-amber-500 drop-shadow-md animate-scale-in"
              style={{ transform: `rotate(${rot}deg)` }}
            >
              <Star className="w-8 h-8 fill-amber-400 stroke-amber-700" />
            </div>
          </div>
        );

      case "heart":
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div
              className="p-1 rounded-full text-rose-500 drop-shadow-md animate-scale-in"
              style={{ transform: `rotate(${rot}deg)` }}
            >
              <Heart className="w-8 h-8 fill-rose-500 stroke-rose-800" />
            </div>
          </div>
        );

      case "ring":
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div
              className="w-9 h-9 rounded-full border-3 border-amber-600 border-dashed animate-spin-slow flex items-center justify-center shadow-sm"
              style={{ transform: `rotate(${rot}deg)` }}
            >
              <Target className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        );

      case "check":
      default:
        return (
          <div className="absolute top-1.5 right-1.5 z-20 bg-emerald-600 text-white rounded-full p-0.5 shadow-md animate-scale-in">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        );
    }
  };

  // Render Free space emblem
  const renderFreeEmblem = () => {
    switch (freeSpaceStyle) {
      case "star":
        return <Star className="w-4 h-4 fill-amber-300 stroke-amber-900" />;
      case "gem":
        return <Award className="w-4 h-4 text-amber-200" />;
      case "heart":
        return <Heart className="w-4 h-4 fill-rose-300 stroke-rose-900" />;
      case "crown":
      default:
        return <Crown className="w-4 h-4 text-amber-200 fill-amber-300" />;
    }
  };

  return (
    <div
      className={`w-full h-full flex flex-col select-none relative transition-all ${
        isAtelier
          ? "bg-[#faf8f5] text-[#1c1917]"
          : isVegas
          ? "bg-[#18181b] text-white"
          : isArcade
          ? "bg-[#09090b] text-[#38bdf8]"
          : isParchment
          ? "bg-[#fefce8] text-[#713f12]"
          : "bg-white text-stone-900"
      }`}
      style={{
        fontFamily,
        padding: "10px",
        borderRadius: "inherit",
      }}
    >
      {/* Optional Ornamental Double Frame */}
      {showOrnamentalFrame && (
        <div
          className="absolute inset-1.5 pointer-events-none rounded-[inherit] border border-amber-500/40 z-0"
          style={{
            borderStyle: isAtelier ? "solid" : isVegas ? "double" : "solid",
            borderWidth: isVegas ? "3px" : "1px",
            borderColor: isAtelier
              ? "#c59b27"
              : isVegas
              ? "#eab308"
              : isArcade
              ? "#38bdf8"
              : "#ca8a04",
          }}
        >
          {/* Corner Flourish Brackets */}
          <span className="absolute -top-1 -left-1 text-[10px] text-amber-600 font-serif leading-none">
            ⌜
          </span>
          <span className="absolute -top-1 -right-1 text-[10px] text-amber-600 font-serif leading-none">
            ⌝
          </span>
          <span className="absolute -bottom-1 -left-1 text-[10px] text-amber-600 font-serif leading-none">
            ⌞
          </span>
          <span className="absolute -bottom-1 -right-1 text-[10px] text-amber-600 font-serif leading-none">
            ⌟
          </span>
        </div>
      )}

      {/* Top Interactive Studio Control Bar (Hidden on Image Export) */}
      <div className="export-hide relative z-20 flex items-center justify-between pb-2 mb-1 border-b border-stone-200/80 dark:border-stone-800 text-[11px] font-semibold">
        <div className="flex items-center gap-1.5">
          <div className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>
              {gridSize}x{gridSize} {layoutTheme.toUpperCase()} CARD
            </span>
          </div>

          {/* Winning Banner indicator */}
          {hasBingo && (
            <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-[10px] flex items-center gap-1 shadow-xs animate-bounce">
              <Trophy className="w-3 h-3" />
              <span>BINGO COMPLETE!</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme Quick Toggle */}
          <select
            value={layoutTheme}
            onChange={(e) =>
              onUpdateCardLayout?.({
                bingoLayoutTheme: e.target.value as BingoLayoutTheme,
              })
            }
            className="px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 text-[10px] font-medium cursor-pointer"
          >
            <option value="atelier">Atelier Gold</option>
            <option value="vegas">Vegas Classic</option>
            <option value="editorial">Editorial Minimal</option>
            <option value="arcade">Cyber Arcade</option>
            <option value="parchment">Vintage Parchment</option>
          </select>

          {/* Shuffle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShuffleCells();
            }}
            title="Shuffle Tiles Randomly"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-medium transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
          >
            <Shuffle className="w-2.5 h-2.5" />
            Shuffle
          </button>

          {/* Clear / Reset Marks */}
          {onResetMarks && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResetMarks();
              }}
              title="Reset All Stamps"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-400 text-[10px] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* COLUMN LETTERS HEADER BANNER (B - I - N - G - O)          */}
      {/* ========================================================= */}
      {showBingoHeader && (
        <div
          className="relative z-10 grid mb-1.5 w-full select-none"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gap: `${cellGap}px`,
          }}
        >
          {headerLetters.map((letter, idx) => {
            const vegasCol = VEGAS_COL_COLORS[idx % VEGAS_COL_COLORS.length];

            return (
              <div
                key={`header-${idx}`}
                className={`py-1 sm:py-1.5 rounded-lg flex items-center justify-center font-black tracking-wider text-sm sm:text-base md:text-lg transition-transform ${
                  isAtelier
                    ? "bg-gradient-to-b from-[#dfb755] via-[#c59b27] to-[#926c15] text-amber-50 shadow-xs border border-amber-300/40"
                    : isVegas
                    ? "shadow-md border font-sans"
                    : isArcade
                    ? "bg-stone-900 border-2 border-cyan-500 text-cyan-400 font-mono shadow-[0_0_8px_rgba(56,189,248,0.3)]"
                    : isParchment
                    ? "bg-[#ebd5b3] text-[#542d0a] border border-[#a16207] font-serif shadow-xs"
                    : "bg-stone-900 text-white font-sans"
                }`}
                style={{
                  backgroundColor:
                    bingoHeaderBg ||
                    (isVegas ? vegasCol.bg : undefined),
                  color:
                    bingoHeaderTextColor ||
                    (isVegas ? vegasCol.text : undefined),
                  borderColor: isVegas ? vegasCol.border : undefined,
                  borderRadius: `${cellBorderRadius}px`,
                }}
              >
                <span className="drop-shadow-xs">{letter}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN BINGO GRID CARDS                                      */}
      {/* ========================================================= */}
      <div className="relative z-10 flex-1 w-full h-full" style={gridColsStyle}>
        {cells.map((cell, index) => {
          const isEditing = editingCellId === cell.id;
          const isMarked = cell.marked;
          const isFree = cell.isFree;
          const isWinningCell = winningIndices.has(index);
          const cellBadge = getCellBadge(index);

          return (
            <div
              key={cell.id}
              data-bingo-cell-id={cell.id}
              onClick={(e) => {
                e.stopPropagation();
                if (!isEditing) {
                  onToggleMarkCell(cell.id);
                }
              }}
              onDoubleClick={(e) => handleStartEdit(cell, e)}
              className={`relative p-1.5 sm:p-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer overflow-hidden group ${
                isFree
                  ? "font-extrabold shadow-sm ring-2 ring-amber-400"
                  : isWinningCell
                  ? "ring-2 ring-amber-500 shadow-md animate-pulse"
                  : isMarked
                  ? "shadow-2xs"
                  : "shadow-2xs hover:shadow-xs hover:scale-[1.01]"
              }`}
              style={{
                backgroundColor: isFree
                  ? freeSpaceBg ||
                    (isArcade
                      ? "#1e1b4b"
                      : "linear-gradient(135deg, #f59e0b, #d97706)")
                  : cellBg,
                color: isFree
                  ? freeSpaceTextColor || "#ffffff"
                  : cellTextColor,
                borderRadius: `${cellBorderRadius}px`,
                borderWidth: `${cellBorderWidth}px`,
                borderStyle: "solid",
                borderColor:
                  cellBorderColor ||
                  (isFree
                    ? "#b45309"
                    : isWinningCell
                    ? "#eab308"
                    : isAtelier
                    ? "#e7dfcf"
                    : isVegas
                    ? "#3f3f46"
                    : isArcade
                    ? "#0284c7"
                    : isParchment
                    ? "#d4b996"
                    : "#e5e7eb"),
                background:
                  isFree && !freeSpaceBg
                    ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    : undefined,
              }}
            >
              {/* Corner Cell Number / Call Index */}
              {cellBadge && !isFree && (
                <span
                  className="absolute top-1 left-1.5 text-[8px] sm:text-[9px] font-mono font-bold opacity-50 select-none pointer-events-none"
                  style={{
                    color: isArcade ? "#38bdf8" : undefined,
                  }}
                >
                  {cellBadge}
                </span>
              )}

              {/* Free Space Star/Crown Accent in Corner */}
              {isFree && (
                <div className="absolute top-1 left-1.5 text-amber-200">
                  {renderFreeEmblem()}
                </div>
              )}

              {/* Mark Stamp Graphic Layer */}
              {renderStamp(cell, index)}

              {/* Inline Edit Icon on Hover */}
              <button
                onClick={(e) => handleStartEdit(cell, e)}
                title="Edit Cell Text"
                className="export-hide absolute bottom-1 right-1 p-0.5 rounded bg-black/10 hover:bg-black/20 text-current opacity-0 group-hover:opacity-100 transition-opacity z-30"
              >
                <Edit3 className="w-2.5 h-2.5" />
              </button>

              {/* Cell Emoji or Free Space Icon */}
              {isFree ? (
                <div className="mb-0.5 drop-shadow-sm animate-pulse text-amber-100">
                  {renderFreeEmblem()}
                </div>
              ) : cell.emoji ? (
                <span className="text-sm sm:text-base leading-none mb-0.5 filter drop-shadow-xs select-none">
                  {cell.emoji}
                </span>
              ) : null}

              {/* Cell Content Text or Editing Input */}
              {isEditing ? (
                <div
                  className="w-full flex flex-col gap-1 z-30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => handleSaveEdit(cell.id)}
                    onKeyDown={(e) => handleKeyDown(e, cell.id)}
                    autoFocus
                    placeholder="Tile text"
                    className="w-full text-center bg-white text-gray-900 border border-amber-600 rounded px-1 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
                  />
                  <input
                    type="text"
                    value={editEmoji}
                    onChange={(e) => setEditEmoji(e.target.value)}
                    onBlur={() => handleSaveEdit(cell.id)}
                    onKeyDown={(e) => handleKeyDown(e, cell.id)}
                    placeholder="Emoji (optional)"
                    className="w-full text-center bg-white text-gray-900 border border-stone-300 rounded px-1 py-0.5 text-[10px]"
                  />
                </div>
              ) : (
                <span
                  className={`bingo-cell-text text-[10px] sm:text-[11px] leading-snug font-medium break-words max-h-full overflow-hidden select-none ${
                    isFree
                      ? "tracking-wider uppercase font-black text-xs text-amber-50 drop-shadow-xs"
                      : ""
                  } ${
                    isMarked && markStampStyle === "check"
                      ? "line-through opacity-80"
                      : ""
                  }`}
                >
                  {isFree ? freeSpaceText || cell.text : cell.text}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* CARD FOOTER & SERIAL AUTHENTICATION BAR                   */}
      {/* ========================================================= */}
      {showCardFooter && (
        <div
          className="relative z-10 mt-2 pt-1.5 border-t flex items-center justify-between text-[9px] sm:text-[10px] font-mono tracking-wider opacity-70 select-none"
          style={{
            borderColor: isAtelier
              ? "#e5d5be"
              : isVegas
              ? "#3f3f46"
              : isArcade
              ? "#0284c7"
              : "#e2e8f0",
          }}
        >
          {/* Rules info */}
          <span className="truncate font-sans font-semibold">
            {cardRulesText}
          </span>

          {/* Serial Number & Security Tag */}
          <div className="flex items-center gap-1.5">
            <span className="truncate uppercase font-bold text-amber-700 dark:text-amber-400">
              {cardSerialText}
            </span>
            <div className="hidden sm:flex gap-0.5 items-center opacity-40">
              <span className="w-0.5 h-3 bg-current"></span>
              <span className="w-1 h-3 bg-current"></span>
              <span className="w-0.5 h-3 bg-current"></span>
              <span className="w-1.5 h-3 bg-current"></span>
              <span className="w-0.5 h-3 bg-current"></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
