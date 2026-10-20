import React, { useEffect, useRef } from "react";
import {
  Type,
  RotateCw,
  Palette,
  Shapes,
  Copy,
  Clipboard,
  Trash2,
  Lock,
  Unlock,
  Sparkles,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  hasSelectedItem: boolean;
  isLocked?: boolean;
  onAddText: () => void;
  onAddBingoBox: () => void;
  onRotateItem?: () => void;
  onAddBackground?: () => void;
  onChangeShape?: (shape: "rectangle" | "circle" | "star") => void;
  onCopy?: () => void;
  onPaste: () => void;
  onDelete?: () => void;
  onToggleLock?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  hasSelectedItem,
  isLocked,
  onAddText,
  onAddBingoBox,
  onRotateItem,
  onAddBackground,
  onChangeShape,
  onCopy,
  onPaste,
  onDelete,
  onToggleLock,
  onBringForward,
  onSendBackward,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{ top: `${y}px`, left: `${x}px` }}
      className="fixed z-[9999] min-w-[190px] bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border border-amber-200 py-1.5 text-xs text-gray-800 animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-100"
    >
      {/* Creation tools */}
      <div className="py-1">
        <button
          onClick={() => {
            onAddText();
            onClose();
          }}
          className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Type className="w-3.5 h-3.5 text-amber-600" />
          Add Text Box
        </button>
        <button
          onClick={() => {
            onAddBingoBox();
            onClose();
          }}
          className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Add Bingo Grid
        </button>
        <button
          onClick={() => {
            onPaste();
            onClose();
          }}
          className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Clipboard className="w-3.5 h-3.5 text-amber-600" />
          Paste Element
        </button>
      </div>

      {/* Item-specific controls */}
      {hasSelectedItem && (
        <>
          <div className="py-1">
            <button
              onClick={() => {
                onCopy?.();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-amber-600" />
              Copy
            </button>
            <button
              onClick={() => {
                onRotateItem?.();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-600" />
              Rotate +15°
            </button>
            <button
              onClick={() => {
                onAddBackground?.();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-amber-600" />
              Change Color
            </button>
            <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Shapes className="w-3 h-3" /> Quick Shape
            </div>
            <div className="grid grid-cols-3 gap-1 px-3 pb-1">
              <button
                onClick={() => {
                  onChangeShape?.("rectangle");
                  onClose();
                }}
                className="px-1 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-center text-[10px]"
              >
                Square
              </button>
              <button
                onClick={() => {
                  onChangeShape?.("circle");
                  onClose();
                }}
                className="px-1 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-center text-[10px]"
              >
                Circle
              </button>
              <button
                onClick={() => {
                  onChangeShape?.("star");
                  onClose();
                }}
                className="px-1 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-center text-[10px]"
              >
                Star
              </button>
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                onBringForward?.();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
              Bring to Front
            </button>
            <button
              onClick={() => {
                onSendBackward?.();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
              Send to Back
            </button>
            <button
              onClick={() => {
                onToggleLock?.();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 cursor-pointer transition-colors"
            >
              {isLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-600" /> Unlock Element
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-600" /> Lock Element
                </>
              )}
            </button>
            <button
              onClick={() => {
                onDelete?.();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Element
            </button>
          </div>
        </>
      )}
    </div>
  );
};
