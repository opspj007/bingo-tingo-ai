import React, { useState, useRef } from "react";
import { CanvasItem } from "../types";
import { BingoCardView } from "./BingoCardView";
import { QuickEditPopover } from "./QuickEditPopover";
import { Lock, Edit2, RotateCw, Sparkles } from "lucide-react";

interface CanvasItemViewProps {
  item: CanvasItem;
  isSelected: boolean;
  scale: number;
  animationTrigger?: number;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updated: Partial<CanvasItem>) => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onApplyToAll: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const CanvasItemView: React.FC<CanvasItemViewProps> = ({
  item,
  isSelected,
  scale,
  animationTrigger,
  onSelect,
  onUpdate,
  onDuplicate,
  onCopy,
  onDelete,
  onApplyToAll,
  onContextMenu,
}) => {
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineText, setInlineText] = useState(item.text || "");
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number }>({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const resizeStartRef = useRef<{ startX: number; startY: number; origW: number; origH: number }>({
    startX: 0,
    startY: 0,
    origW: 0,
    origH: 0,
  });

  // Drag handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (item.locked || isEditingInline) return;
    if ((e.target as HTMLElement).closest(".quick-edit-popover, .resizer-handle, .no-drag")) return;

    e.stopPropagation();
    onSelect(e);

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: item.x,
      origY: item.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - dragStartRef.current.startX) / scale;
      const dy = (moveEvent.clientY - dragStartRef.current.startY) / scale;
      onUpdate({
        x: Math.round(dragStartRef.current.origX + dx),
        y: Math.round(dragStartRef.current.origY + dy),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Resize handler
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (item.locked) return;
    e.stopPropagation();
    setIsResizing(true);

    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: item.width,
      origH: item.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dw = (moveEvent.clientX - resizeStartRef.current.startX) / scale;
      const dh = (moveEvent.clientY - resizeStartRef.current.startY) / scale;
      onUpdate({
        width: Math.max(60, Math.round(resizeStartRef.current.origW + dw)),
        height: Math.max(30, Math.round(resizeStartRef.current.origH + dh)),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Double click inline edit
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (item.type === "bingo" || item.locked) return;
    e.stopPropagation();
    setIsEditingInline(true);
    setInlineText(item.text || "");
  };

  const handleInlineBlur = () => {
    setIsEditingInline(false);
    onUpdate({ text: inlineText });
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleInlineBlur();
    } else if (e.key === "Escape") {
      setIsEditingInline(false);
    }
  };

  // Shape renderer
  const renderShape = () => {
    const shapeType = item.shapeType || "rectangle";
    const bg = item.backgroundColor || "#f59e0b";
    const border = item.borderColor ? `${item.borderWidth || 2}px solid ${item.borderColor}` : "none";

    switch (shapeType) {
      case "circle":
        return <div className="w-full h-full rounded-full shadow-md" style={{ backgroundColor: bg, border }} />;
      case "star":
        return (
          <div
            className="w-full h-full flex items-center justify-center filter drop-shadow-md"
            style={{
              backgroundColor: bg,
              clipPath:
                "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
            }}
          />
        );
      case "heart":
        return (
          <div
            className="w-full h-full flex items-center justify-center filter drop-shadow-md"
            style={{
              backgroundColor: bg,
              clipPath:
                "polygon(50% 80%, 20% 50%, 20% 20%, 35% 10%, 50% 25%, 65% 10%, 80% 20%, 80% 50%)",
            }}
          />
        );
      case "badge":
        return (
          <div
            className="w-full h-full flex items-center justify-center text-white font-bold p-2 text-center"
            style={{
              backgroundColor: bg,
              borderRadius: "16px",
              border,
            }}
          >
            {item.text || "★ SPECIAL ★"}
          </div>
        );
      default:
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: bg,
              borderRadius: `${item.borderRadius ?? 8}px`,
              border,
            }}
          />
        );
    }
  };

  // Apply visual effect class
  const effectClass = item.effect || "";

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onContextMenu}
      className={`absolute group select-none transition-shadow ${
        isSelected ? "ring-2 ring-amber-500 ring-offset-1 z-30" : "hover:ring-1 hover:ring-amber-300 z-10"
      } ${item.locked ? "cursor-not-allowed opacity-90" : "cursor-move"}`}
      style={{
        left: `${item.x}px`,
        top: `${item.y}px`,
        width: `${item.width}px`,
        height: `${item.height}px`,
        transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
        zIndex: item.zIndex || 10,
      }}
    >
      {/* Edit Quick Button on Hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowQuickEdit(!showQuickEdit);
        }}
        title="Quick Edit Properties"
        className={`export-hide absolute -top-3.5 right-1 z-40 bg-amber-800 text-white rounded px-1.5 py-0.5 text-[10px] font-bold shadow-md cursor-pointer transition-opacity flex items-center gap-1 ${
          isSelected || showQuickEdit ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <Edit2 className="w-2.5 h-2.5" />
        Edit
      </button>

      {/* Lock icon if locked */}
      {item.locked && (
        <div className="export-hide absolute top-1 left-1 bg-black/60 text-white rounded p-1 text-[10px] z-20">
          <Lock className="w-3 h-3" />
        </div>
      )}

      {/* Quick Edit Popover */}
      {showQuickEdit && (
        <div className="quick-edit-popover">
          <QuickEditPopover
            item={item}
            onUpdateItem={onUpdate}
            onApplyToAll={onApplyToAll}
            onDuplicate={onDuplicate}
            onCopy={onCopy}
            onDelete={onDelete}
            onClose={() => setShowQuickEdit(false)}
          />
        </div>
      )}

      {/* Entrance Animation Wrapper */}
      <div
        key={
          item.animation && item.animation !== "none"
            ? `${item.animation}-${animationTrigger || 0}-${item.animationDuration || 0.8}-${item.animationDelay || 0}`
            : undefined
        }
        className={`w-full h-full ${
          item.animation && item.animation !== "none" ? `entrance-anim-${item.animation}` : ""
        }`}
        style={{
          animationDuration: `${item.animationDuration ?? 0.8}s`,
          animationDelay: `${item.animationDelay ?? 0}s`,
          animationFillMode: "both",
        }}
      >
        {/* Item Body based on Type */}
        <div
          className={`w-full h-full flex flex-col justify-center overflow-hidden relative ${effectClass}`}
          style={{
            fontFamily: item.fontFamily || "inherit",
            fontSize: `${item.fontSize || 18}px`,
            color: item.color || "#1f2937",
            backgroundColor: item.backgroundColor || "transparent",
            textAlign: item.textAlign || "center",
            fontStyle: item.fontStyle || "normal",
            fontWeight: item.fontWeight || "normal",
            textDecoration: item.textDecoration || "none",
            letterSpacing: item.letterSpacing ? `${item.letterSpacing}px` : undefined,
            borderRadius: `${item.borderRadius ?? (item.type === "bingo" ? 12 : 0)}px`,
            border: item.borderColor ? `${item.borderWidth || 2}px solid ${item.borderColor}` : undefined,
          }}
        >
          {item.type === "bingo" && (
            <BingoCardView
              gridSize={item.bingoGridSize || 4}
              cells={item.bingoCells || []}
              cellBg={item.cellBg || "#fffdf9"}
              cellTextColor={item.cellTextColor || "#1c1917"}
              fontFamily={item.fontFamily}
              layoutTheme={item.bingoLayoutTheme || "atelier"}
              showBingoHeader={item.showBingoHeader ?? true}
              bingoHeaderTitle={item.bingoHeaderTitle}
              bingoHeaderBg={item.bingoHeaderBg}
              bingoHeaderTextColor={item.bingoHeaderTextColor}
              showCellNumbers={item.showCellNumbers ?? true}
              cellNumberType={item.cellNumberType || "index"}
              cellGap={item.cellGap ?? 6}
              cellBorderRadius={item.cellBorderRadius ?? 8}
              cellBorderColor={item.cellBorderColor}
              cellBorderWidth={item.cellBorderWidth ?? 1}
              markStampStyle={item.markStampStyle || "dabber"}
              dabberColor={item.dabberColor || "#b91c1c"}
              showCardFooter={item.showCardFooter ?? true}
              cardSerialText={item.cardSerialText || "№ 04829 • ATELIER CERTIFIED"}
              cardRulesText={item.cardRulesText || "5 IN A ROW WINS • CALL BINGO!"}
              showOrnamentalFrame={item.showOrnamentalFrame ?? true}
              freeSpaceStyle={item.freeSpaceStyle || "crown"}
              freeSpaceText={item.freeSpaceText}
              freeSpaceBg={item.freeSpaceBg}
              freeSpaceTextColor={item.freeSpaceTextColor}
              onUpdateCell={(cellId, newText, emoji) => {
                const updatedCells = (item.bingoCells || []).map((c) =>
                  c.id === cellId ? { ...c, text: newText, emoji: emoji ?? c.emoji } : c
                );
                onUpdate({ bingoCells: updatedCells });
              }}
              onToggleMarkCell={(cellId) => {
                const updatedCells = (item.bingoCells || []).map((c) =>
                  c.id === cellId ? { ...c, marked: !c.marked } : c
                );
                onUpdate({ bingoCells: updatedCells });
              }}
              onShuffleCells={() => {
                const cells = [...(item.bingoCells || [])];
                // Keep center free space in place if odd
                for (let i = cells.length - 1; i > 0; i--) {
                  if (cells[i].isFree) continue;
                  const j = Math.floor(Math.random() * (i + 1));
                  if (cells[j].isFree) continue;
                  [cells[i], cells[j]] = [cells[j], cells[i]];
                }
                onUpdate({ bingoCells: cells });
              }}
              onResetMarks={() => {
                const updatedCells = (item.bingoCells || []).map((c) =>
                  c.isFree ? c : { ...c, marked: false }
                );
                onUpdate({ bingoCells: updatedCells });
              }}
              onUpdateCardLayout={(updated) => {
                onUpdate(updated);
              }}
            />
          )}

          {item.type === "shape" && renderShape()}

          {item.type === "frame" && (
            <div
              className="w-full h-full border-4 border-dashed border-amber-600 rounded-xl bg-amber-50/20 p-2 flex items-center justify-center text-xs text-amber-800 font-bold"
            >
              {item.text || "Decorative Frame"}
            </div>
          )}

          {item.type === "image" && (
            <div className="w-full h-full overflow-hidden flex items-center justify-center">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt="Element"
                  className="w-full h-full object-cover"
                  style={{
                    filter:
                      item.imageEffect === "grayscale"
                        ? "grayscale(100%)"
                        : item.imageEffect === "sepia"
                        ? "sepia(100%)"
                        : item.imageEffect === "blur"
                        ? "blur(4px)"
                        : undefined,
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                  No Image Selected
                </div>
              )}
            </div>
          )}

          {(item.type === "text" || item.type === "title" || item.type === "subtitle" || item.type === "emoji" || item.type === "symbol") && (
            <div className="w-full h-full p-1 flex items-center justify-center leading-tight">
              {isEditingInline ? (
                <textarea
                  value={inlineText}
                  onChange={(e) => setInlineText(e.target.value)}
                  onBlur={handleInlineBlur}
                  onKeyDown={handleInlineKeyDown}
                  autoFocus
                  className="w-full h-full bg-white/90 text-black border border-amber-500 rounded p-1 resize-none text-center focus:outline-none"
                  style={{ fontSize: "inherit", fontFamily: "inherit" }}
                />
              ) : (
                <span className="break-words max-w-full">{item.text}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Animation Badge when item has entrance animation and is selected */}
      {item.animation && item.animation !== "none" && isSelected && (
        <div
          title={`Entrance: ${item.animation} (${item.animationDuration || 0.8}s)`}
          className="export-hide absolute -bottom-5 left-0 z-30 bg-gradient-to-r from-amber-700 to-orange-600 text-white rounded px-1.5 py-0.5 text-[9px] font-bold shadow-md flex items-center gap-1 uppercase tracking-wider select-none pointer-events-none"
        >
          <Sparkles className="w-2.5 h-2.5 text-amber-200" />
          <span>{item.animation}</span>
        </div>
      )}

      {/* Resizer Handle (Bottom Right) */}
      {isSelected && !item.locked && (
        <div
          onMouseDown={handleResizeMouseDown}
          title="Drag to resize"
          className="export-hide resizer-handle absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-amber-800 hover:bg-amber-900 border-2 border-white rounded-full cursor-se-resize z-50 shadow-md transition-transform hover:scale-125"
        />
      )}
    </div>
  );
};
