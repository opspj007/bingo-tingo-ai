import React from "react";
import { CanvasItem, BingoLayoutTheme, MarkStampStyle, FreeSpaceStyle } from "../types";
import { EFFECT_OPTIONS, FONT_OPTIONS } from "../constants/presets";
import { X, Copy, Trash2, Layers, Check, Sparkles, Stamp, Crown } from "lucide-react";

interface QuickEditPopoverProps {
  item: CanvasItem;
  onUpdateItem: (updated: Partial<CanvasItem>) => void;
  onApplyToAll: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const QuickEditPopover: React.FC<QuickEditPopoverProps> = ({
  item,
  onUpdateItem,
  onApplyToAll,
  onDuplicate,
  onCopy,
  onDelete,
  onClose,
}) => {
  const isBingo = item.type === "bingo";

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-8 left-0 z-50 w-80 max-w-[90vw] bg-white/95 backdrop-blur-md rounded-xl p-3.5 shadow-2xl border-2 border-amber-800 text-gray-800 text-xs flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150"
      style={{ maxHeight: "440px", overflowY: "auto" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-amber-200">
        <span className="font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
          {isBingo ? "Bingo Card Architecture" : `Edit Element (${item.type})`}
        </span>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ========================================================= */}
      {/* BINGO SPECIFIC ARCHITECTURE CONTROLS                      */}
      {/* ========================================================= */}
      {isBingo && (
        <div className="flex flex-col gap-2 pb-2 border-b border-amber-200">
          {/* Card Layout Theme */}
          <div>
            <label className="block text-[10px] font-bold text-amber-900 mb-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Card Layout Theme
            </label>
            <select
              value={item.bingoLayoutTheme || "atelier"}
              onChange={(e) =>
                onUpdateItem({
                  bingoLayoutTheme: e.target.value as BingoLayoutTheme,
                })
              }
              className="w-full px-2 py-1 border border-amber-400 rounded bg-amber-50 text-xs font-semibold text-amber-950 cursor-pointer"
            >
              <option value="atelier">Atelier Gold (Luxury Foil & Ivory)</option>
              <option value="vegas">Vegas Classic (Iconic B-I-N-G-O Columns)</option>
              <option value="editorial">Editorial Minimal (Swiss Typography)</option>
              <option value="arcade">Cyber Arcade (Neon Cyan Grid)</option>
              <option value="parchment">Vintage Parchment (Aged Antique)</option>
            </select>
          </div>

          {/* Stamp / Dabber Style & Color */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5 flex items-center gap-1">
                <Stamp className="w-3 h-3 text-amber-600" />
                Stamp Marker
              </label>
              <select
                value={item.markStampStyle || "dabber"}
                onChange={(e) =>
                  onUpdateItem({
                    markStampStyle: e.target.value as MarkStampStyle,
                  })
                }
                className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs"
              >
                <option value="dabber">Ink Dabber (Authentic)</option>
                <option value="star">Gold Star</option>
                <option value="heart">Crimson Heart</option>
                <option value="ring">Target Ring</option>
                <option value="check">Checkmark</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                Dabber Ink Color
              </label>
              <div className="flex items-center gap-1 border border-gray-300 rounded p-1 bg-white">
                <input
                  type="color"
                  value={item.dabberColor || "#b91c1c"}
                  onChange={(e) => onUpdateItem({ dabberColor: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                />
                <span className="text-[10px] font-mono text-gray-600 uppercase truncate">
                  {item.dabberColor || "#b91c1c"}
                </span>
              </div>
            </div>
          </div>

          {/* Header Banner Settings */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                Header Banner
              </label>
              <button
                onClick={() =>
                  onUpdateItem({
                    showBingoHeader: !(item.showBingoHeader ?? true),
                  })
                }
                className={`w-full py-1 px-2 rounded border text-xs font-medium cursor-pointer transition-colors ${
                  item.showBingoHeader ?? true
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-gray-100 text-gray-500 border-gray-300"
                }`}
              >
                {item.showBingoHeader ?? true ? "✓ Header Enabled" : "Hidden"}
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                Header Title (Letters)
              </label>
              <input
                type="text"
                placeholder={item.bingoGridSize === 5 ? "BINGO" : "PLAY"}
                value={item.bingoHeaderTitle || ""}
                onChange={(e) =>
                  onUpdateItem({ bingoHeaderTitle: e.target.value.toUpperCase() })
                }
                maxLength={8}
                className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs font-mono font-bold uppercase tracking-wider"
              />
            </div>
          </div>

          {/* Cell Gap & Corner Radius */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                <span>Cell Gap</span>
                <span className="font-mono">{item.cellGap ?? 6}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                value={item.cellGap ?? 6}
                onChange={(e) =>
                  onUpdateItem({ cellGap: parseInt(e.target.value) || 0 })
                }
                className="w-full accent-amber-700 h-1.5 bg-gray-200 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                <span>Cell Radius</span>
                <span className="font-mono">{item.cellBorderRadius ?? 8}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={item.cellBorderRadius ?? 8}
                onChange={(e) =>
                  onUpdateItem({ cellBorderRadius: parseInt(e.target.value) || 0 })
                }
                className="w-full accent-amber-700 h-1.5 bg-gray-200 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Call Number Indexing & Centerpiece */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                Cell Numbers
              </label>
              <select
                value={
                  !(item.showCellNumbers ?? true)
                    ? "none"
                    : item.cellNumberType || "index"
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "none") {
                    onUpdateItem({ showCellNumbers: false });
                  } else {
                    onUpdateItem({
                      showCellNumbers: true,
                      cellNumberType: val as "index" | "call-number",
                    });
                  }
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs"
              >
                <option value="index">Index (#1..N)</option>
                <option value="call-number">75-Ball Call (B-1..O-75)</option>
                <option value="none">Hidden</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-600" />
                Free Centerpiece
              </label>
              <select
                value={item.freeSpaceStyle || "crown"}
                onChange={(e) =>
                  onUpdateItem({
                    freeSpaceStyle: e.target.value as FreeSpaceStyle,
                  })
                }
                className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs"
              >
                <option value="crown">Royal Crown</option>
                <option value="star">Golden Star</option>
                <option value="gem">Diamond Gem</option>
                <option value="heart">Sweet Heart</option>
                <option value="text-only">Text Only</option>
              </select>
            </div>
          </div>

          {/* Security Footer & Double Frame */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                onUpdateItem({
                  showCardFooter: !(item.showCardFooter ?? true),
                })
              }
              className={`py-1 px-2 rounded border text-xs font-medium cursor-pointer transition-colors ${
                item.showCardFooter ?? true
                  ? "bg-amber-50 text-amber-900 border-amber-300"
                  : "bg-gray-100 text-gray-500 border-gray-300"
              }`}
            >
              {item.showCardFooter ?? true ? "✓ Serial Footer On" : "Footer Off"}
            </button>

            <button
              onClick={() =>
                onUpdateItem({
                  showOrnamentalFrame: !(item.showOrnamentalFrame ?? true),
                })
              }
              className={`py-1 px-2 rounded border text-xs font-medium cursor-pointer transition-colors ${
                item.showOrnamentalFrame ?? true
                  ? "bg-amber-50 text-amber-900 border-amber-300"
                  : "bg-gray-100 text-gray-500 border-gray-300"
              }`}
            >
              {item.showOrnamentalFrame ?? true
                ? "✓ Double Frame On"
                : "Frame Off"}
            </button>
          </div>
        </div>
      )}

      {/* Colors */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
            {isBingo ? "Tile Text" : "Text Color"}
          </label>
          <div className="flex items-center gap-1 border border-gray-300 rounded p-1 bg-white">
            <input
              type="color"
              value={isBingo ? item.cellTextColor || "#1c1917" : item.color || "#1f2937"}
              onChange={(e) =>
                isBingo
                  ? onUpdateItem({ cellTextColor: e.target.value })
                  : onUpdateItem({ color: e.target.value })
              }
              className="w-5 h-5 rounded cursor-pointer border-0 p-0"
            />
            <span className="text-[10px] font-mono text-gray-500 uppercase truncate">
              {isBingo ? item.cellTextColor || "#1c1917" : item.color || "#1f2937"}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
            {isBingo ? "Tile Bg" : "Bg Color"}
          </label>
          <div className="flex items-center gap-1 border border-gray-300 rounded p-1 bg-white">
            <input
              type="color"
              value={isBingo ? item.cellBg || "#fffdf9" : item.backgroundColor || "#ffffff"}
              onChange={(e) =>
                isBingo
                  ? onUpdateItem({ cellBg: e.target.value })
                  : onUpdateItem({ backgroundColor: e.target.value })
              }
              className="w-5 h-5 rounded cursor-pointer border-0 p-0"
            />
            <span className="text-[10px] font-mono text-gray-500 uppercase truncate">
              {isBingo ? item.cellBg || "#fffdf9" : item.backgroundColor || "none"}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
            Border Color
          </label>
          <div className="flex items-center gap-1 border border-gray-300 rounded p-1 bg-white">
            <input
              type="color"
              value={item.borderColor || "#c59b27"}
              onChange={(e) =>
                onUpdateItem({
                  borderColor: e.target.value,
                  borderWidth: item.borderWidth || 1.5,
                })
              }
              className="w-5 h-5 rounded cursor-pointer border-0 p-0"
            />
            <span className="text-[10px] font-mono text-gray-500 uppercase truncate">
              {item.borderColor || "#c59b27"}
            </span>
          </div>
        </div>
      </div>

      {/* Non-bingo controls */}
      {!isBingo && (
        <>
          {/* Text Size & Angle */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                Text Size (px)
              </label>
              <input
                type="number"
                min="8"
                max="120"
                value={item.fontSize || 18}
                onChange={(e) =>
                  onUpdateItem({ fontSize: parseInt(e.target.value) || 16 })
                }
                className="w-full px-2 py-1 border border-gray-300 rounded bg-amber-50/50 font-medium focus:outline-amber-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                Rotation Angle (°)
              </label>
              <input
                type="number"
                min="-360"
                max="360"
                value={item.rotation || 0}
                onChange={(e) =>
                  onUpdateItem({ rotation: parseInt(e.target.value) || 0 })
                }
                className="w-full px-2 py-1 border border-gray-300 rounded bg-amber-50/50 font-medium focus:outline-amber-600"
              />
            </div>
          </div>

          {/* Typography and Alignment */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                Alignment
              </label>
              <select
                value={item.textAlign || "center"}
                onChange={(e) =>
                  onUpdateItem({ textAlign: e.target.value as any })
                }
                className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
                Font Style
              </label>
              <select
                value={
                  item.fontWeight === "bold"
                    ? "bold"
                    : item.fontStyle === "italic"
                    ? "italic"
                    : item.textDecoration === "underline"
                    ? "underline"
                    : "normal"
                }
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateItem({
                    fontWeight: val === "bold" ? "bold" : "normal",
                    fontStyle: val === "italic" ? "italic" : "normal",
                    textDecoration: val === "underline" ? "underline" : "none",
                  });
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="italic">Italic</option>
                <option value="underline">Underline</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Font Family & Shape */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
            Font Family
          </label>
          <select
            value={item.fontFamily || "Outfit"}
            onChange={(e) => onUpdateItem({ fontFamily: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
            Corner Shape
          </label>
          <select
            value={
              item.borderRadius === 0
                ? "0"
                : item.borderRadius === 8
                ? "8"
                : item.borderRadius === 12
                ? "12"
                : item.borderRadius === 24
                ? "24"
                : item.borderRadius === 999
                ? "circle"
                : "custom"
            }
            onChange={(e) => {
              const val = e.target.value;
              const radius =
                val === "0"
                  ? 0
                  : val === "8"
                  ? 8
                  : val === "12"
                  ? 12
                  : val === "24"
                  ? 24
                  : 999;
              onUpdateItem({ borderRadius: radius });
            }}
            className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs"
          >
            <option value="12">Medium Curve (12px)</option>
            <option value="8">Rounded (8px)</option>
            <option value="0">Square (0px)</option>
            <option value="24">Pill (24px)</option>
            <option value="circle">Circle (50%)</option>
          </select>
        </div>
      </div>

      {/* Visual Effects & Entrance Animation */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
            Special Effect
          </label>
          <select
            value={item.effect || ""}
            onChange={(e) => onUpdateItem({ effect: e.target.value })}
            className="w-full px-2 py-1 border border-amber-300 rounded bg-amber-50 text-xs font-semibold text-amber-900"
          >
            {EFFECT_OPTIONS.map((eff) => (
              <option key={eff.value} value={eff.value}>
                {eff.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">
            Animation
          </label>
          <select
            value={item.animation || "none"}
            onChange={(e) => onUpdateItem({ animation: e.target.value as any })}
            className="w-full px-2 py-1 border border-amber-300 rounded bg-amber-50 text-xs font-semibold text-amber-900"
          >
            <option value="none">None</option>
            <option value="fade-in">Fade In</option>
            <option value="slide-up">Slide Up</option>
            <option value="bounce">Bounce</option>
            <option value="zoom-in">Zoom In</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-gray-200 flex flex-col gap-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onClose}
            className="px-2 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Done
          </button>
          <button
            onClick={onApplyToAll}
            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Apply All
          </button>
        </div>

        <div className="flex items-center justify-between gap-1 text-[11px] pt-1">
          <button
            onClick={onDuplicate}
            className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-center cursor-pointer"
          >
            Duplicate
          </button>
          <button
            onClick={onCopy}
            className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-center cursor-pointer flex items-center justify-center gap-1"
          >
            <Copy className="w-3 h-3" /> Copy
          </button>
          <button
            onClick={onDelete}
            className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded cursor-pointer"
            title="Delete element"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
