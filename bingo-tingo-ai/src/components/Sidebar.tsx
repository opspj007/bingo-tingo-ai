import React, { useState, useRef } from "react";
import {
  TEMPLATE_PRESETS,
  EFFECT_OPTIONS,
  FONT_OPTIONS,
  POPULAR_EMOJIS,
  POPULAR_SYMBOLS,
} from "../constants/presets";
import {
  CanvasBorderConfig,
  CanvasItem,
  EntranceAnimation,
  BingoLayoutTheme,
  MarkStampStyle,
  FreeSpaceStyle,
} from "../types";
import {
  Menu,
  Moon,
  Sun,
  Sparkles,
  Plus,
  Trash2,
  Undo2,
  Redo2,
  Download,
  Maximize2,
  Minimize2,
  Palette,
  Type,
  Smile,
  Shapes,
  Image as ImageIcon,
  Lock,
  Unlock,
  Copy,
  Clipboard,
  Save,
  FolderOpen,
  Shuffle,
  Grid,
  Layers,
  Eye,
  ArrowUp,
  Check,
  Clock,
  FastForward,
  RotateCcw,
  Play,
  Ban,
  Printer,
  FileJson,
  Crown,
  SlidersHorizontal,
  Component,
  Search,
  X,
  ChevronRight,
  Stamp,
  Gamepad2,
} from "lucide-react";

interface SidebarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  width: number;
  height: number;
  onWidthChange: (w: number) => void;
  onHeightChange: (h: number) => void;
  onApplyPreset: (presetId: string) => void;
  onAddTab: () => void;
  onSaveTemplate: () => void;
  onLoadTemplate: () => void;
  onOpenGallery: () => void;
  onOpenTwoPlayer?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDownloadPng: () => void;
  onDownloadPdf: () => void;
  onDownloadJpeg: () => void;
  onOpenDownloadModal?: () => void;
  onPrintCard?: () => void;
  onCopyImageClipboard?: () => void;
  onDownloadJson?: () => void;
  onDownloadDeck?: () => void;
  hasBingoGrid?: boolean;
  canvasBgColor: string;
  onCanvasBgColorChange: (c: string) => void;
  containerBgColor: string;
  onContainerBgColorChange: (c: string) => void;
  textColor: string;
  onTextColorChange: (c: string) => void;
  borderConfig: CanvasBorderConfig;
  onBorderConfigChange: (b: Partial<CanvasBorderConfig>) => void;
  onRandomizeColors: () => void;
  onUploadBgImage: (file: File) => void;
  onRemoveBgImage: () => void;
  onOpenAIGenerator: () => void;
  onAddText: (type?: "title" | "subtitle" | "text") => void;
  onAddBingoBox: () => void;
  onAddShape: (shape: "rectangle" | "circle" | "star" | "heart" | "badge") => void;
  onAddEmoji: (emoji: string) => void;
  onAddSymbol: (symbol: string) => void;
  onAddImageFile: (file: File) => void;
  onAddFrame: () => void;
  onRemoveSelectedItem: () => void;
  onCopySelected: () => void;
  onPasteSelected: () => void;
  onToggleLockSelected: () => void;
  isItemLocked?: boolean;
  hasSelectedItem: boolean;
  selectedEffect: string;
  onSelectEffect: (eff: string) => void;
  selectedFont: string;
  onSelectFont: (font: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  selectedItem?: CanvasItem | null;
  onUpdateSelectedItem?: (updated: Partial<CanvasItem>) => void;
  onReplayAnimation?: (itemId?: string) => void;
  onApplyAnimationToAll?: (anim: EntranceAnimation, duration?: number, delay?: number) => void;
  canvasItems?: CanvasItem[];
  onSelectItemById?: (id: string) => void;
}

type StudioTab = "studio" | "elements" | "motion" | "export";

export const Sidebar: React.FC<SidebarProps> = ({
  isDark,
  onToggleTheme,
  width,
  height,
  onWidthChange,
  onHeightChange,
  onApplyPreset,
  onAddTab,
  onSaveTemplate,
  onLoadTemplate,
  onOpenGallery,
  onOpenTwoPlayer,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDownloadPng,
  onDownloadPdf,
  onDownloadJpeg,
  onOpenDownloadModal,
  onPrintCard,
  onCopyImageClipboard,
  onDownloadJson,
  onDownloadDeck,
  hasBingoGrid = false,
  canvasBgColor,
  onCanvasBgColorChange,
  containerBgColor,
  onContainerBgColorChange,
  textColor,
  onTextColorChange,
  borderConfig,
  onBorderConfigChange,
  onRandomizeColors,
  onUploadBgImage,
  onRemoveBgImage,
  onOpenAIGenerator,
  onAddText,
  onAddBingoBox,
  onAddShape,
  onAddEmoji,
  onAddSymbol,
  onAddImageFile,
  onAddFrame,
  onRemoveSelectedItem,
  onCopySelected,
  onPasteSelected,
  onToggleLockSelected,
  isItemLocked,
  hasSelectedItem,
  selectedEffect,
  onSelectEffect,
  selectedFont,
  onSelectFont,
  isFullscreen,
  onToggleFullscreen,
  selectedItem,
  onUpdateSelectedItem,
  onReplayAnimation,
  onApplyAnimationToAll,
  canvasItems,
  onSelectItemById,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<StudioTab>("studio");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("mahashankh-template");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);

  const activeBingoItem =
    (selectedItem?.type === "bingo"
      ? selectedItem
      : canvasItems?.find((i) => i.type === "bingo")) || null;

  const handleUpdateBingo = (updated: Partial<CanvasItem>) => {
    if (selectedItem?.type === "bingo") {
      onUpdateSelectedItem?.(updated);
    } else if (activeBingoItem) {
      onSelectItemById?.(activeBingoItem.id);
      onUpdateSelectedItem?.(updated);
    }
  };

  const handleShuffleBingo = () => {
    if (!activeBingoItem || !activeBingoItem.bingoCells) return;
    const shuffled = [...activeBingoItem.bingoCells];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    handleUpdateBingo({ bingoCells: shuffled });
  };

  const handleResetBingoStamps = () => {
    if (!activeBingoItem || !activeBingoItem.bingoCells) return;
    const cleared = activeBingoItem.bingoCells.map((c) =>
      c.isFree ? c : { ...c, marked: false }
    );
    handleUpdateBingo({ bingoCells: cleared });
  };

  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const customImageInputRef = useRef<HTMLInputElement>(null);

  const filterMatches = (text: string) => {
    if (!searchTerm.trim()) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const isSearching = searchTerm.trim().length > 0;

  // Tactile luxury button classes
  const secondaryBtnClass =
    "py-2 px-2.5 rounded-lg bg-stone-100/90 dark:bg-stone-800/90 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-medium text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 shadow-2xs";

  const cardPanelClass =
    "p-3 rounded-xl bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 shadow-2xs flex flex-col gap-2.5 transition-all";

  const sectionLabelClass =
    "text-[10px] uppercase font-bold tracking-widest text-stone-500 dark:text-stone-400 flex items-center justify-between";

  return (
    <aside
      className={`h-screen flex flex-col transition-all duration-300 z-50 select-none shadow-xl relative border-r ${
        isDark
          ? "bg-[#12100e] text-stone-100 border-stone-800"
          : "bg-[#faf9f6] text-stone-900 border-stone-200"
      } ${collapsed ? "w-16" : "w-80"}`}
    >
      {/* Atelier Top Brand & Search Bar */}
      <div
        className={`p-3.5 flex flex-col gap-2.5 border-b ${
          isDark ? "border-stone-800 bg-[#161412]" : "border-stone-200/90 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand Studio" : "Collapse Studio"}
              className="p-1.5 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>

            {!collapsed && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-amber-100 shadow-2xs">
                  <Crown className="w-3 h-3" />
                </div>
                <span className="font-extrabold text-xs tracking-wider font-sans text-stone-900 dark:text-stone-100">
                  ATELIER
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80">
                  Pro
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-1.5 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 cursor-pointer transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-700" />}
          </button>
        </div>

        {/* Search tool bar */}
        {!collapsed && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tools & presets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/30 transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* 4 Studio Category Segmented Tabs (when not searching) */}
        {!collapsed && !isSearching && (
          <div className="grid grid-cols-4 p-0.5 bg-stone-100 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 text-[11px] font-medium">
            <button
              onClick={() => setActiveTab("studio")}
              className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === "studio"
                  ? "bg-white dark:bg-stone-800 text-amber-800 dark:text-amber-400 font-bold shadow-2xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Studio</span>
            </button>
            <button
              onClick={() => setActiveTab("elements")}
              className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === "elements"
                  ? "bg-white dark:bg-stone-800 text-amber-800 dark:text-amber-400 font-bold shadow-2xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              <Component className="w-3 h-3" />
              <span>Items</span>
            </button>
            <button
              onClick={() => setActiveTab("motion")}
              className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === "motion"
                  ? "bg-white dark:bg-stone-800 text-amber-800 dark:text-amber-400 font-bold shadow-2xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Motion</span>
            </button>
            <button
              onClick={() => setActiveTab("export")}
              className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === "export"
                  ? "bg-white dark:bg-stone-800 text-amber-800 dark:text-amber-400 font-bold shadow-2xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Controls Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3 text-xs">
        {/* Collapsed view icons only */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-2.5 pt-2">
            <button
              onClick={onOpenAIGenerator}
              title="Bingo Tingo AI Magic"
              className="p-2.5 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 hover:scale-105 transition-transform cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            {onOpenTwoPlayer && (
              <button
                onClick={onOpenTwoPlayer}
                title="2-Player Bingo Duel Arena"
                className="p-2.5 rounded-lg bg-gradient-to-br from-amber-600 to-rose-600 text-white hover:scale-105 transition-transform cursor-pointer shadow-xs"
              >
                <Gamepad2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onOpenGallery}
              title="Community Gallery"
              className="p-2.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:scale-105 transition-transform cursor-pointer"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={onAddBingoBox}
              title="Add Bingo Grid"
              className="p-2.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:scale-105 transition-transform cursor-pointer"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onAddText("text")}
              title="Add Typography"
              className="p-2.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:scale-105 transition-transform cursor-pointer"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setCollapsed(false);
                setActiveTab("motion");
                onReplayAnimation?.();
              }}
              title="Preview Entrance Animations"
              className="p-2.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:scale-105 transition-transform cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={onOpenDownloadModal || onDownloadPng}
              title="Download & Export Card"
              className="p-2.5 rounded-lg gold-metallic-foil text-amber-50 hover:scale-105 transition-transform cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleFullscreen}
              title="Toggle Fullscreen"
              className="p-2.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:scale-105 transition-transform cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* ========================================================= */}
            {/* TAB 1: STUDIO (Canvas, Dimensions, Borders, Palette, State) */}
            {/* ========================================================= */}
            {(isSearching || activeTab === "studio") && (
              <>
                {/* AI Magic Generator Banner */}
                {filterMatches("ai bingo tingo generate gemini magic") && (
                  <button
                    onClick={onOpenAIGenerator}
                    className="gold-metallic-foil w-full py-2.5 px-3 rounded-xl text-amber-50 font-bold text-xs shadow-md shadow-amber-950/20 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border border-amber-400/40"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                      <span className="tracking-wide">AI THEME GENERATOR</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-amber-200" />
                  </button>
                )}

                {/* 2-Player Bingo Duel Arena Launcher */}
                {onOpenTwoPlayer && filterMatches("play game multiplayer duel 2 two players arena room") && (
                  <button
                    onClick={onOpenTwoPlayer}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-amber-950/20 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border border-amber-300/40"
                  >
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-amber-100" />
                      <span className="tracking-wide">2-PLAYER BINGO DUEL</span>
                    </div>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">
                      PLAY
                    </span>
                  </button>
                )}

                {/* Pre-made & Community Gallery */}
                {filterMatches("template gallery community premade designs browse") && (
                  <button
                    onClick={onOpenGallery}
                    className={secondaryBtnClass + " w-full py-2 justify-between"}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      <span className="font-semibold">Curated Gallery & Presets</span>
                    </div>
                    <span className="text-[10px] text-stone-400 uppercase font-mono">10+</span>
                  </button>
                )}

                {/* Dimensions & Standard Presets */}
                {filterMatches("size width height template preset dimensions") && (
                  <div className={cardPanelClass}>
                    <div className={sectionLabelClass}>
                      <span>Canvas Dimensions</span>
                      <span className="font-mono text-[9px] text-stone-400">{width} × {height}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5 font-medium">Width (px)</label>
                        <input
                          type="number"
                          value={width}
                          min={200}
                          step={10}
                          onChange={(e) => onWidthChange(parseInt(e.target.value) || 200)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 font-mono font-medium focus:border-amber-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5 font-medium">Height (px)</label>
                        <input
                          type="number"
                          value={height}
                          min={200}
                          step={10}
                          onChange={(e) => onHeightChange(parseInt(e.target.value) || 200)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 font-mono font-medium focus:border-amber-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <select
                      value={selectedPreset}
                      onChange={(e) => {
                        setSelectedPreset(e.target.value);
                        onApplyPreset(e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 font-medium focus:border-amber-600 focus:outline-none text-stone-800 dark:text-stone-200"
                    >
                      {TEMPLATE_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <button
                        onClick={() => onApplyPreset(selectedPreset)}
                        className="py-1.5 px-2 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-stone-100 dark:text-stone-900 font-semibold text-center cursor-pointer transition-colors text-xs"
                      >
                        Apply Size
                      </button>
                      <button
                        onClick={onAddTab}
                        className="py-1.5 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-semibold text-center cursor-pointer transition-colors flex items-center justify-center gap-1 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> New Board
                      </button>
                    </div>
                  </div>
                )}

                {/* Signature Multi-Sided Border Craftsmanship */}
                {filterMatches("colors background border picker multi side") && (
                  <div className={cardPanelClass}>
                    <div className={sectionLabelClass}>
                      <span>4-Sided Border Craft</span>
                      <button
                        onClick={onRandomizeColors}
                        title="Randomize Palette"
                        className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        <Shuffle className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5 font-medium">Workspace Matting</label>
                        <div className="flex items-center gap-2 p-1 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-950">
                          <input
                            type="color"
                            value={canvasBgColor}
                            onChange={(e) => onCanvasBgColorChange(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                          />
                          <span className="text-[10px] font-mono uppercase truncate text-stone-700 dark:text-stone-300">
                            {canvasBgColor}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5 font-medium">Container Card</label>
                        <div className="flex items-center gap-2 p-1 border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-950">
                          <input
                            type="color"
                            value={containerBgColor}
                            onChange={(e) => onContainerBgColorChange(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                          />
                          <span className="text-[10px] font-mono uppercase truncate text-stone-700 dark:text-stone-300">
                            {containerBgColor}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 4-sided borders customization */}
                    <div>
                      <span className="text-[10px] font-medium text-stone-500 block mb-1">Individual Edge Hues:</span>
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        <div>
                          <span className="text-[9px] font-mono text-stone-400 uppercase">Top</span>
                          <input
                            type="color"
                            value={borderConfig.topColor}
                            onChange={(e) => onBorderConfigChange({ topColor: e.target.value })}
                            className="w-full h-6 rounded cursor-pointer p-0 border border-stone-200 dark:border-stone-700"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-stone-400 uppercase">Right</span>
                          <input
                            type="color"
                            value={borderConfig.rightColor}
                            onChange={(e) => onBorderConfigChange({ rightColor: e.target.value })}
                            className="w-full h-6 rounded cursor-pointer p-0 border border-stone-200 dark:border-stone-700"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-stone-400 uppercase">Bottom</span>
                          <input
                            type="color"
                            value={borderConfig.bottomColor}
                            onChange={(e) => onBorderConfigChange({ bottomColor: e.target.value })}
                            className="w-full h-6 rounded cursor-pointer p-0 border border-stone-200 dark:border-stone-700"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-stone-400 uppercase">Left</span>
                          <input
                            type="color"
                            value={borderConfig.leftColor}
                            onChange={(e) => onBorderConfigChange({ leftColor: e.target.value })}
                            className="w-full h-6 rounded cursor-pointer p-0 border border-stone-200 dark:border-stone-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Radius Slider */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-stone-500 mb-0.5">
                        <span className="font-medium">Corner Radius</span>
                        <span className="font-mono">{borderConfig.borderRadius}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="32"
                        value={borderConfig.borderRadius}
                        onChange={(e) => onBorderConfigChange({ borderRadius: parseInt(e.target.value) || 0 })}
                        className="w-full accent-amber-700 h-1.5 bg-stone-200 dark:bg-stone-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Undo / Redo & Template Storage */}
                {filterMatches("save load undo redo template") && (
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={onUndo}
                      disabled={!canUndo}
                      title="Undo (Ctrl+Z)"
                      className={secondaryBtnClass + " disabled:opacity-30"}
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Undo
                    </button>
                    <button
                      onClick={onRedo}
                      disabled={!canRedo}
                      title="Redo (Ctrl+Y)"
                      className={secondaryBtnClass + " disabled:opacity-30"}
                    >
                      <Redo2 className="w-3.5 h-3.5" /> Redo
                    </button>
                    <button
                      onClick={onSaveTemplate}
                      title="Save Template to Storage"
                      className={secondaryBtnClass}
                    >
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                    <button
                      onClick={onLoadTemplate}
                      title="Load Saved Template"
                      className={secondaryBtnClass}
                    >
                      <FolderOpen className="w-3.5 h-3.5" /> Load
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ========================================================= */}
            {/* TAB 2: ELEMENTS (Bingo Grid, Typography, Shapes, Media)   */}
            {/* ========================================================= */}
            {(isSearching || activeTab === "elements") && (
              <>
                {/* Element Creator Suite */}
                {filterMatches("add text bingo shape emoji symbol image frame item") && (
                  <div className={cardPanelClass}>
                    <div className={sectionLabelClass}>
                      <span>Add Atelier Elements</span>
                    </div>

                    {/* Primary Bingo Grid Trigger */}
                    <button
                      onClick={onAddBingoBox}
                      className="w-full py-2 px-3 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-stone-100 dark:text-stone-900 font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                    >
                      <Grid className="w-4 h-4 text-amber-500" />
                      <span>Insert Bingo Grid Card</span>
                    </button>

                    {/* Typography buttons */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => onAddText("title")}
                        className={secondaryBtnClass}
                      >
                        <Type className="w-3.5 h-3.5 text-amber-700" /> Headline
                      </button>
                      <button
                        onClick={() => onAddText("subtitle")}
                        className={secondaryBtnClass}
                      >
                        <Type className="w-3.5 h-3.5 text-amber-700" /> Subtitle
                      </button>
                      <button
                        onClick={() => onAddText("text")}
                        className={secondaryBtnClass}
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-700" /> Body Text
                      </button>
                    </div>

                    {/* Shapes and Badges */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setShowShapePicker(!showShapePicker)}
                        className={secondaryBtnClass}
                      >
                        <Shapes className="w-3.5 h-3.5 text-amber-700" /> Shape
                      </button>
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={secondaryBtnClass}
                      >
                        <Smile className="w-3.5 h-3.5 text-amber-700" /> Emoji
                      </button>
                      <button
                        onClick={() => setShowSymbolPicker(!showSymbolPicker)}
                        className={secondaryBtnClass}
                      >
                        ★ Symbol
                      </button>
                    </div>

                    {/* Shape Picker Submenu */}
                    {showShapePicker && (
                      <div className="grid grid-cols-4 gap-1 p-1.5 bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800 text-[11px] font-medium">
                        <button
                          onClick={() => {
                            onAddShape("rectangle");
                            setShowShapePicker(false);
                          }}
                          className="p-1 rounded bg-white dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700"
                        >
                          Box
                        </button>
                        <button
                          onClick={() => {
                            onAddShape("circle");
                            setShowShapePicker(false);
                          }}
                          className="p-1 rounded bg-white dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700"
                        >
                          Circle
                        </button>
                        <button
                          onClick={() => {
                            onAddShape("star");
                            setShowShapePicker(false);
                          }}
                          className="p-1 rounded bg-white dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700"
                        >
                          Star
                        </button>
                        <button
                          onClick={() => {
                            onAddShape("badge");
                            setShowShapePicker(false);
                          }}
                          className="p-1 rounded bg-white dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700"
                        >
                          Badge
                        </button>
                      </div>
                    )}

                    {/* Emoji Picker Submenu */}
                    {showEmojiPicker && (
                      <div className="flex flex-wrap gap-1 p-2 bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800 text-base">
                        {POPULAR_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              onAddEmoji(emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Symbol Picker Submenu */}
                    {showSymbolPicker && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800 text-xs font-bold">
                        {POPULAR_SYMBOLS.map((sym) => (
                          <button
                            key={sym}
                            onClick={() => {
                              onAddSymbol(sym);
                              setShowSymbolPicker(false);
                            }}
                            className="px-2 py-0.5 rounded bg-white dark:bg-stone-800 hover:bg-amber-100 text-stone-800 dark:text-stone-200 cursor-pointer border border-stone-200 dark:border-stone-700"
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Custom Image Upload & Frame */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-stone-100 dark:border-stone-800">
                      <button
                        onClick={() => customImageInputRef.current?.click()}
                        className={secondaryBtnClass}
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-700" /> Insert Image
                      </button>
                      <button
                        onClick={onAddFrame}
                        className={secondaryBtnClass}
                      >
                        Add Frame
                      </button>
                    </div>

                    {/* Hidden input for image element */}
                    <input
                      type="file"
                      ref={customImageInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onAddImageFile(file);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />

                    {/* Wallpaper Background upload */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => bgImageInputRef.current?.click()}
                        className="py-1 px-1.5 bg-stone-50 hover:bg-stone-100 dark:bg-stone-950 text-stone-600 dark:text-stone-400 rounded-lg text-[10px] text-center cursor-pointer transition-colors border border-stone-200 dark:border-stone-800 truncate"
                      >
                        Wallpaper Upload
                      </button>
                      <button
                        onClick={onRemoveBgImage}
                        className="py-1 px-1.5 bg-stone-50 hover:bg-stone-100 dark:bg-stone-950 text-stone-600 dark:text-stone-400 rounded-lg text-[10px] text-center cursor-pointer transition-colors border border-stone-200 dark:border-stone-800 truncate"
                      >
                        Remove Wallpaper
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={bgImageInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUploadBgImage(file);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Selected Item Controls */}
                {hasSelectedItem && (
                  <div className={cardPanelClass}>
                    <div className={sectionLabelClass}>
                      <span>Selected Element Inspector</span>
                      <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold uppercase">Active</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={onCopySelected}
                        title="Copy Element"
                        className={secondaryBtnClass}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={onPasteSelected}
                        title="Paste Element"
                        className={secondaryBtnClass}
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={onToggleLockSelected}
                        title={isItemLocked ? "Unlock Element" : "Lock Element"}
                        className={secondaryBtnClass}
                      >
                        {isItemLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={onRemoveSelectedItem}
                        title="Delete Element"
                        className="py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Advanced Bingo Card Layout & Architecture */}
                {activeBingoItem && filterMatches("card layout architecture theme vegas atelier arcade stamp dabber header footer serial") && (
                  <div className={cardPanelClass}>
                    <div className={sectionLabelClass}>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Card Architecture & Layout</span>
                      </div>
                      <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full uppercase border border-amber-300 dark:border-amber-800">
                        {activeBingoItem.bingoLayoutTheme || "atelier"}
                      </span>
                    </div>

                    {/* Layout Themes */}
                    <div>
                      <label className="block text-[10px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Layout Theme Archetype
                      </label>
                      <div className="grid grid-cols-2 gap-1 text-[10px] font-medium">
                        {[
                          { id: "atelier", label: "Atelier Gold", desc: "Gold foil & ivory" },
                          { id: "vegas", label: "Vegas Classic", desc: "5-color columns" },
                          { id: "editorial", label: "Editorial", desc: "Swiss typography" },
                          { id: "arcade", label: "Cyber Arcade", desc: "Neon cyan grid" },
                          { id: "parchment", label: "Vintage Parchment", desc: "Aged sepia paper" },
                        ].map((th) => {
                          const isSel = (activeBingoItem.bingoLayoutTheme || "atelier") === th.id;
                          return (
                            <button
                              key={th.id}
                              onClick={() =>
                                handleUpdateBingo({
                                  bingoLayoutTheme: th.id as BingoLayoutTheme,
                                })
                              }
                              className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                                isSel
                                  ? "bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs"
                                  : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                              }`}
                            >
                              <div className="font-bold">{th.label}</div>
                              <div className="text-[8.5px] opacity-70 truncate">{th.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Header Banner & Title */}
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-stone-600 dark:text-stone-400">
                          Column Letter Banner
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateBingo({
                              showBingoHeader: !(activeBingoItem.showBingoHeader ?? true),
                            })
                          }
                          className={`text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                            activeBingoItem.showBingoHeader ?? true
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                              : "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                          }`}
                        >
                          {activeBingoItem.showBingoHeader ?? true ? "ON" : "OFF"}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="block text-[9px] text-stone-500 mb-0.5">Banner Letters</label>
                          <input
                            type="text"
                            placeholder={activeBingoItem.bingoGridSize === 5 ? "BINGO" : "PLAY"}
                            value={activeBingoItem.bingoHeaderTitle || ""}
                            onChange={(e) =>
                              handleUpdateBingo({ bingoHeaderTitle: e.target.value.toUpperCase() })
                            }
                            maxLength={8}
                            className="w-full px-2 py-1 text-xs font-mono font-bold uppercase rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] text-stone-500 mb-0.5">Free Space Text</label>
                          <input
                            type="text"
                            placeholder="FREE SPACE"
                            value={activeBingoItem.freeSpaceText || ""}
                            onChange={(e) =>
                              handleUpdateBingo({ freeSpaceText: e.target.value })
                            }
                            className="w-full px-2 py-1 text-xs font-medium rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stamp Marker & Ink Dabber Style */}
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1">
                          <Stamp className="w-3 h-3 text-amber-600" />
                          Stamp Marker & Dabber
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { id: "dabber", label: "Dabber" },
                          { id: "star", label: "Star" },
                          { id: "heart", label: "Heart" },
                          { id: "ring", label: "Target" },
                          { id: "check", label: "Check" },
                        ].map((st) => {
                          const isSel = (activeBingoItem.markStampStyle || "dabber") === st.id;
                          return (
                            <button
                              key={st.id}
                              onClick={() =>
                                handleUpdateBingo({
                                  markStampStyle: st.id as MarkStampStyle,
                                })
                              }
                              className={`py-1 px-0.5 rounded border text-[9.5px] font-bold text-center cursor-pointer transition-colors ${
                                isSel
                                  ? "bg-amber-600 text-white border-amber-700 shadow-2xs"
                                  : "bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
                              }`}
                            >
                              {st.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="block text-[9px] text-stone-500 mb-0.5">Dabber Ink Color</label>
                          <input
                            type="color"
                            value={activeBingoItem.dabberColor || "#b91c1c"}
                            onChange={(e) => handleUpdateBingo({ dabberColor: e.target.value })}
                            className="w-full h-7 rounded cursor-pointer p-0 border border-stone-200 dark:border-stone-700"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] text-stone-500 mb-0.5">Free Space Emblem</label>
                          <select
                            value={activeBingoItem.freeSpaceStyle || "crown"}
                            onChange={(e) =>
                              handleUpdateBingo({
                                freeSpaceStyle: e.target.value as FreeSpaceStyle,
                              })
                            }
                            className="w-full h-7 px-1.5 text-xs rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 cursor-pointer"
                          >
                            <option value="crown">Royal Crown</option>
                            <option value="star">Golden Star</option>
                            <option value="gem">Diamond Gem</option>
                            <option value="heart">Sweet Heart</option>
                            <option value="text-only">Text Only</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Spacing & Corner Sliders */}
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-stone-500 mb-0.5">
                          <span className="font-medium">Cell Gap</span>
                          <span className="font-mono">{activeBingoItem.cellGap ?? 6}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="16"
                          value={activeBingoItem.cellGap ?? 6}
                          onChange={(e) =>
                            handleUpdateBingo({ cellGap: parseInt(e.target.value) || 0 })
                          }
                          className="w-full accent-amber-700 h-1.5 bg-stone-200 dark:bg-stone-800 rounded cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px] text-stone-500 mb-0.5">
                          <span className="font-medium">Cell Corner Radius</span>
                          <span className="font-mono">{activeBingoItem.cellBorderRadius ?? 8}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={activeBingoItem.cellBorderRadius ?? 8}
                          onChange={(e) =>
                            handleUpdateBingo({ cellBorderRadius: parseInt(e.target.value) || 0 })
                          }
                          className="w-full accent-amber-700 h-1.5 bg-stone-200 dark:bg-stone-800 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Cell Call Numbers & Security Footer */}
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[9px] text-stone-500 mb-0.5">Cell Indexing</label>
                        <select
                          value={
                            !(activeBingoItem.showCellNumbers ?? true)
                              ? "none"
                              : activeBingoItem.cellNumberType || "index"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "none") {
                              handleUpdateBingo({ showCellNumbers: false });
                            } else {
                              handleUpdateBingo({
                                showCellNumbers: true,
                                cellNumberType: val as "index" | "call-number",
                              });
                            }
                          }}
                          className="w-full py-1 px-1.5 text-[10px] rounded border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                        >
                          <option value="index">Index (#1..N)</option>
                          <option value="call-number">75-Ball (B-1..O-75)</option>
                          <option value="none">Hidden</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] text-stone-500 mb-0.5">Card Footer</label>
                        <button
                          onClick={() =>
                            handleUpdateBingo({
                              showCardFooter: !(activeBingoItem.showCardFooter ?? true),
                            })
                          }
                          className={`w-full py-1 px-1.5 text-[10px] font-medium rounded border cursor-pointer ${
                            activeBingoItem.showCardFooter ?? true
                              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border-amber-300"
                              : "bg-stone-100 dark:bg-stone-800 text-stone-500 border-stone-200"
                          }`}
                        >
                          {activeBingoItem.showCardFooter ?? true ? "✓ Serial On" : "Footer Off"}
                        </button>
                      </div>
                    </div>

                    {/* Quick Tile Actions: Shuffle & Reset Marks */}
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 gap-1.5">
                      <button
                        onClick={handleShuffleBingo}
                        title="Shuffle Bingo Tiles"
                        className={secondaryBtnClass}
                      >
                        <Shuffle className="w-3.5 h-3.5 text-amber-600" />
                        Shuffle Tiles
                      </button>

                      <button
                        onClick={handleResetBingoStamps}
                        title="Reset Stamps and Marks"
                        className={secondaryBtnClass}
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                        Clear Stamps
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ========================================================= */}
            {/* TAB 3: MOTION & ANIMATION CHOREOGRAPHY                    */}
            {/* ========================================================= */}
            {(isSearching || activeTab === "motion") && (
              <>
                <div id="sidebar-animations-section" className={cardPanelClass}>
                  <div className={sectionLabelClass}>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Entrance Choreography</span>
                    </div>
                    {hasSelectedItem && selectedItem?.animation && selectedItem.animation !== "none" ? (
                      <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full uppercase border border-amber-300 dark:border-amber-800">
                        {selectedItem.animation}
                      </span>
                    ) : (
                      <span className="text-[9px] text-stone-400 font-medium">
                        {hasSelectedItem ? "Static" : "Select item"}
                      </span>
                    )}
                  </div>

                  {hasSelectedItem && selectedItem ? (
                    <>
                      {/* Active Element Pill */}
                      <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 uppercase px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 rounded">
                            {selectedItem.type}
                          </span>
                          <span className="text-xs text-stone-800 dark:text-stone-200 truncate font-medium max-w-[140px]">
                            {selectedItem.text || (selectedItem.type === "bingo" ? "Bingo Grid" : selectedItem.shapeType || "Element")}
                          </span>
                        </div>
                        {onReplayAnimation && (
                          <button
                            onClick={() => onReplayAnimation(selectedItem.id)}
                            title="Preview entrance animation"
                            className="px-2.5 py-1 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Play</span>
                          </button>
                        )}
                      </div>

                      {/* Animation Choice Grid */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {/* Fade In */}
                        <button
                          onClick={() => {
                            onUpdateSelectedItem?.({ animation: "fade-in" });
                            onReplayAnimation?.(selectedItem.id);
                          }}
                          className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                            selectedItem.animation === "fade-in"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-600 shadow-2xs"
                              : "bg-stone-50 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] flex items-center gap-1">
                              <Eye className="w-3 h-3" /> Fade In
                            </span>
                            {selectedItem.animation === "fade-in" && <Check className="w-3 h-3 text-amber-600" />}
                          </div>
                          <span className="text-[9px] text-stone-400">Smooth opacity reveal</span>
                        </button>

                        {/* Slide Up */}
                        <button
                          onClick={() => {
                            onUpdateSelectedItem?.({ animation: "slide-up" });
                            onReplayAnimation?.(selectedItem.id);
                          }}
                          className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                            selectedItem.animation === "slide-up"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-600 shadow-2xs"
                              : "bg-stone-50 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] flex items-center gap-1">
                              <ArrowUp className="w-3 h-3" /> Slide Up
                            </span>
                            {selectedItem.animation === "slide-up" && <Check className="w-3 h-3 text-amber-600" />}
                          </div>
                          <span className="text-[9px] text-stone-400">Rises from bottom</span>
                        </button>

                        {/* Bounce */}
                        <button
                          onClick={() => {
                            onUpdateSelectedItem?.({ animation: "bounce" });
                            onReplayAnimation?.(selectedItem.id);
                          }}
                          className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                            selectedItem.animation === "bounce"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-600 shadow-2xs"
                              : "bg-stone-50 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Bounce
                            </span>
                            {selectedItem.animation === "bounce" && <Check className="w-3 h-3 text-amber-600" />}
                          </div>
                          <span className="text-[9px] text-stone-400">Springy overshoot</span>
                        </button>

                        {/* Zoom In */}
                        <button
                          onClick={() => {
                            onUpdateSelectedItem?.({ animation: "zoom-in" });
                            onReplayAnimation?.(selectedItem.id);
                          }}
                          className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                            selectedItem.animation === "zoom-in"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-600 shadow-2xs"
                              : "bg-stone-50 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] flex items-center gap-1">
                              <Maximize2 className="w-3 h-3" /> Zoom In
                            </span>
                            {selectedItem.animation === "zoom-in" && <Check className="w-3 h-3 text-amber-600" />}
                          </div>
                          <span className="text-[9px] text-stone-400">Scale pop</span>
                        </button>

                        {/* Static */}
                        <button
                          onClick={() => {
                            onUpdateSelectedItem?.({ animation: "none" });
                          }}
                          className={`col-span-2 p-1.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                            !selectedItem.animation || selectedItem.animation === "none"
                              ? "bg-stone-200 dark:bg-stone-800 border-stone-400 font-bold text-stone-900 dark:text-white"
                              : "bg-stone-50 dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200 dark:border-stone-800 text-stone-500"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Ban className="w-3 h-3" />
                            <span className="text-xs">None (Static element)</span>
                          </div>
                          {(!selectedItem.animation || selectedItem.animation === "none") && (
                            <Check className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Speed & Stagger timeline */}
                      {selectedItem.animation && selectedItem.animation !== "none" && (
                        <div className="flex flex-col gap-2 p-2 bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800">
                          <div>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="font-medium text-stone-600 dark:text-stone-300 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Duration
                              </span>
                              <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                                {selectedItem.animationDuration ?? 0.8}s
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.2"
                              max="2.0"
                              step="0.1"
                              value={selectedItem.animationDuration ?? 0.8}
                              onChange={(e) => {
                                onUpdateSelectedItem?.({ animationDuration: parseFloat(e.target.value) });
                              }}
                              className="w-full accent-amber-600 h-1.5 bg-stone-200 dark:bg-stone-800 rounded cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="font-medium text-stone-600 dark:text-stone-300 flex items-center gap-1">
                                <FastForward className="w-3 h-3" /> Stagger Delay
                              </span>
                              <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                                {selectedItem.animationDelay ?? 0}s
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1.5"
                              step="0.1"
                              value={selectedItem.animationDelay ?? 0}
                              onChange={(e) => {
                                onUpdateSelectedItem?.({ animationDelay: parseFloat(e.target.value) });
                              }}
                              className="w-full accent-amber-600 h-1.5 bg-stone-200 dark:bg-stone-800 rounded cursor-pointer"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <button
                              onClick={() => onReplayAnimation?.(selectedItem.id)}
                              className="py-1.5 px-2 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <RotateCcw className="w-3 h-3" /> Replay Item
                            </button>
                            <button
                              onClick={() =>
                                onApplyAnimationToAll?.(
                                  selectedItem.animation || "fade-in",
                                  selectedItem.animationDuration || 0.8,
                                  0.2
                                )
                              }
                              title="Apply this animation to all canvas items with staggered delay"
                              className={secondaryBtnClass + " py-1.5 text-[10px]"}
                            >
                              Apply to All
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Default state */
                    <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-center flex flex-col gap-2">
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                        Select any element on the artboard to choreograph luxury entrance animations.
                      </p>

                      {onReplayAnimation && (
                        <button
                          onClick={() => onReplayAnimation()}
                          className="w-full py-1.5 px-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-stone-200 dark:border-stone-700"
                        >
                          <Play className="w-3 h-3 fill-current text-amber-700" />
                          <span>Preview Full Board Motion</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Typography & Visual Effects */}
                {filterMatches("font effects neon holographic glitch zoom rotate") && (
                  <div className={cardPanelClass}>
                    <div className={sectionLabelClass}>
                      <span>Typography & Filters</span>
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-500 block mb-0.5 font-medium">Font Family</label>
                      <select
                        value={selectedFont}
                        onChange={(e) => onSelectFont(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:border-amber-600"
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-500 block mb-0.5 font-medium">
                        Visual Effect Filter
                      </label>
                      <select
                        value={selectedEffect}
                        onChange={(e) => onSelectEffect(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:border-amber-600"
                      >
                        {EFFECT_OPTIONS.map((eff) => (
                          <option key={eff.value} value={eff.value}>
                            {eff.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ========================================================= */}
            {/* TAB 4: PRODUCTION EXPORT (HD PNG, PDF, JPEG, Deck, Print) */}
            {/* ========================================================= */}
            {(isSearching || activeTab === "export") && (
              <>
                <div className={cardPanelClass}>
                  <div className={sectionLabelClass}>
                    <span>Production Export Suite</span>
                    <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                      300 DPI
                    </span>
                  </div>

                  {/* Prominent Export Modal Launcher */}
                  <button
                    onClick={onOpenDownloadModal || onDownloadPng}
                    className="gold-metallic-foil w-full py-2.5 px-3 rounded-xl text-amber-50 font-bold text-xs shadow-md shadow-amber-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border border-amber-400/40"
                  >
                    <Download className="w-4 h-4" />
                    <span className="tracking-wide">Open Export Suite</span>
                  </button>

                  {/* 1-Click Formats */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={onDownloadPng}
                      title="Download 3x Lossless PNG"
                      className="py-1.5 px-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold text-[11px] text-center cursor-pointer transition-colors shadow-2xs"
                    >
                      PNG (HD)
                    </button>
                    <button
                      onClick={onDownloadPdf}
                      title="Download PDF Document with Cut Guides"
                      className="py-1.5 px-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold text-[11px] text-center cursor-pointer transition-colors shadow-2xs"
                    >
                      PDF Guide
                    </button>
                    <button
                      onClick={onDownloadJpeg}
                      title="Download JPEG Image"
                      className="py-1.5 px-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold text-[11px] text-center cursor-pointer transition-colors shadow-2xs"
                    >
                      JPEG Web
                    </button>
                  </div>

                  {/* Utilities */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={onCopyImageClipboard}
                      title="Copy Card to Clipboard"
                      className={secondaryBtnClass + " py-1 px-1 text-[10px]"}
                    >
                      <Copy className="w-3 h-3 text-amber-600" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={onPrintCard}
                      title="Print Card"
                      className={secondaryBtnClass + " py-1 px-1 text-[10px]"}
                    >
                      <Printer className="w-3 h-3 text-amber-600" />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={onDownloadJson}
                      title="Export JSON Blueprint"
                      className={secondaryBtnClass + " py-1 px-1 text-[10px]"}
                    >
                      <FileJson className="w-3 h-3 text-amber-600" />
                      <span>Blueprint</span>
                    </button>
                  </div>

                  {/* Game Deck generator */}
                  {hasBingoGrid && (
                    <button
                      onClick={onDownloadDeck || onOpenDownloadModal}
                      title="Generate unique shuffled cards for game night"
                      className="w-full py-2 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors mt-0.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Generate Game Night Deck</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Fullscreen view trigger */}
            <button
              onClick={onToggleFullscreen}
              className={secondaryBtnClass + " w-full py-2 justify-center mt-auto"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" /> Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" /> Fullscreen Workspace
                </>
              )}
            </button>
          </>
        )}
      </div>
    </aside>
  );
};
