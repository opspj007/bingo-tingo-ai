import React, { forwardRef } from "react";
import { CanvasItem, CanvasBorderConfig, TabData } from "../types";
import { CanvasItemView } from "./CanvasItemView";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Plus,
  X,
  Download,
  Sparkles,
  Crown,
  Play,
  Eye,
  Swords,
  Gamepad2,
  Users,
  Bell,
  User,
  KeyRound,
  Flame,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface CanvasAreaProps {
  tabs: TabData[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onCloseTab: (tabId: string) => void;
  width: number;
  height: number;
  canvasBgColor: string;
  containerBgColor: string;
  bgImageUrl?: string;
  borderConfig: CanvasBorderConfig;
  items: CanvasItem[];
  selectedItemId: string | null;
  scale: number;
  animationTrigger?: number;
  onScaleChange: (newScale: number) => void;
  onSelectItem: (id: string | null, e?: React.MouseEvent) => void;
  onUpdateItem: (id: string, updated: Partial<CanvasItem>) => void;
  onDuplicateItem: (id: string) => void;
  onCopyItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onApplyToAll: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, itemId?: string) => void;
  onOpenDownloadModal?: () => void;
  onOpenTwoPlayer?: () => void;
  onOpenAuth?: () => void;
  onOpenProfile?: () => void;
  onOpenFriends?: () => void;
  onOpenNotifications?: () => void;
  onOpenCreatePair?: () => void;
  onOpenJoinPair?: () => void;
  onAcceptInvite?: (pairCode: string) => void;
}

export const CanvasArea = forwardRef<HTMLDivElement, CanvasAreaProps>(
  (
    {
      tabs,
      activeTabId,
      onSelectTab,
      onAddTab,
      onCloseTab,
      width,
      height,
      canvasBgColor,
      containerBgColor,
      bgImageUrl,
      borderConfig,
      items,
      selectedItemId,
      scale,
      animationTrigger,
      onScaleChange,
      onSelectItem,
      onUpdateItem,
      onDuplicateItem,
      onCopyItem,
      onDeleteItem,
      onApplyToAll,
      onContextMenu,
      onOpenDownloadModal,
      onOpenTwoPlayer,
      onOpenAuth,
      onOpenProfile,
      onOpenFriends,
      onOpenNotifications,
      onOpenCreatePair,
      onOpenJoinPair,
      onAcceptInvite,
    },
    ref
  ) => {
    const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
    const { currentUser, friends, notifications, activeInvite, dismissActiveInvite } = useAuth();

    const onlineFriendsCount = friends.filter((f) => f.isOnline).length;
    const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

    return (
      <div
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest(".canvas-element, .quick-edit-popover")) {
            onSelectItem(null);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e);
        }}
        style={{ backgroundColor: canvasBgColor }}
        className="flex-1 h-screen flex flex-col overflow-hidden relative transition-colors studio-canvas-pattern select-none"
      >
        {/* Luxury Atelier Top Studio Bar */}
        <div className="h-14 border-b border-stone-200/80 dark:border-stone-800/80 bg-white/85 dark:bg-stone-900/85 backdrop-blur-md px-5 flex items-center justify-between z-40 shadow-xs">
          {/* Left: Atelier Brand & Artboard Swatches */}
          <div className="flex items-center gap-3 overflow-x-auto py-1 max-w-[55%]">
            {/* Studio Badge */}
            <div className="hidden lg:flex items-center gap-2 pr-3 border-r border-stone-200 dark:border-stone-800 shrink-0">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-amber-100 shadow-xs">
                <Crown className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-[11px] tracking-wider text-stone-900 dark:text-stone-100 leading-none">
                  ATELIER
                </span>
                <span className="text-[8px] font-bold tracking-widest text-amber-700 dark:text-amber-400 uppercase">
                  Studio Pro
                </span>
              </div>
            </div>

            {/* Artboard Swatch Tabs */}
            <div className="flex items-center gap-1.5">
              {tabs.map((tab, idx) => {
                const isActive = tab.id === activeTabId;
                return (
                  <div
                    key={tab.id}
                    onClick={() => onSelectTab(tab.id)}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                      isActive
                        ? "bg-stone-900 text-stone-100 border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100 shadow-sm"
                        : "bg-white/80 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400 hover:bg-amber-50/40"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="truncate max-w-[130px] font-medium tracking-tight">
                      {tab.title || `Board ${idx + 1}`}
                    </span>
                    {tabs.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCloseTab(tab.id);
                        }}
                        className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/20 text-current opacity-40 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                onClick={onAddTab}
                title="Create New Board"
                className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:border-amber-500 text-stone-600 dark:text-stone-400 hover:text-amber-600 text-xs font-semibold cursor-pointer transition-all bg-white/50 dark:bg-stone-800/50"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center: Live Board Specifications Indicator */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700/80 text-[11px] text-stone-600 dark:text-stone-300 font-mono shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{width} × {height} px</span>
            <span className="text-stone-400 dark:text-stone-600">•</span>
            <span className="text-amber-700 dark:text-amber-400 font-sans font-medium text-[10px] tracking-wider uppercase">
              300 DPI Ready
            </span>
          </div>

          {/* Right Action Group: Precision Zoom Dock & Gold Export Button */}
          <div className="flex items-center gap-2.5">
            {/* Precision Zoom Dock */}
            <div className="flex items-center gap-1 bg-stone-100/90 dark:bg-stone-800/90 px-1.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300 shadow-2xs">
              <button
                onClick={() => onScaleChange(Math.max(0.2, scale - 0.1))}
                title="Zoom Out"
                className="p-1 hover:bg-white dark:hover:bg-stone-700 rounded cursor-pointer transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-11 text-center font-mono text-[11px] font-semibold">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => onScaleChange(Math.min(2.5, scale + 0.1))}
                title="Zoom In"
                className="p-1 hover:bg-white dark:hover:bg-stone-700 rounded cursor-pointer transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="w-[1px] h-3.5 bg-stone-300 dark:bg-stone-700 mx-0.5" />
              <button
                onClick={() => onScaleChange(1.0)}
                title="Actual 100% Size"
                className="px-1.5 py-0.5 text-[10px] font-mono rounded hover:bg-white dark:hover:bg-stone-700 cursor-pointer transition-colors"
              >
                1:1
              </button>
            </div>

            {/* Platform Multiplayer Lobby Buttons */}
            <div className="flex items-center gap-1.5">
              {onOpenJoinPair && (
                <button
                  onClick={onOpenJoinPair}
                  title="Join Match with Pair Code"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold border border-stone-300 dark:border-stone-700 transition-all cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Join Code</span>
                </button>
              )}

              {onOpenCreatePair && (
                <button
                  onClick={onOpenCreatePair}
                  title="Create Pair & Invite Friend"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold shadow-xs cursor-pointer transition-all border border-amber-400/60"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Play Duel</span>
                </button>
              )}

              {/* 2-Player Game Arena Launcher */}
              {onOpenTwoPlayer && (
                <button
                  onClick={onOpenTwoPlayer}
                  title="Play 2-Player Bingo Duel (Local Pass & Play or AI Match)"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white bg-stone-800 hover:bg-stone-700 text-xs font-semibold shadow-xs cursor-pointer transition-all border border-stone-700"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden md:inline">Arena</span>
                </button>
              )}
            </div>

            <div className="w-[1px] h-5 bg-stone-200 dark:bg-stone-800 mx-0.5" />

            {/* Social Group: Friends & Notifications */}
            <div className="flex items-center gap-1">
              {onOpenFriends && (
                <button
                  onClick={onOpenFriends}
                  title="Friends & Social Chat"
                  className="relative p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer border border-transparent hover:border-stone-300 dark:hover:border-stone-700"
                >
                  <Users className="w-4 h-4" />
                  {onlineFriendsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                      {onlineFriendsCount}
                    </span>
                  )}
                </button>
              )}

              {onOpenNotifications && (
                <button
                  onClick={onOpenNotifications}
                  title="Notifications & Game Invites"
                  className="relative p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer border border-transparent hover:border-stone-300 dark:hover:border-stone-700"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center animate-pulse">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* User Profile / Auth State */}
            {currentUser ? (
              <button
                onClick={onOpenProfile}
                title="View Profile, Points & Match History"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800/90 hover:bg-amber-500/10 hover:border-amber-500/50 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 transition-all cursor-pointer shadow-2xs"
              >
                <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-500 font-bold flex items-center justify-center text-sm">
                  {currentUser.avatar || "⚡"}
                </span>
                <div className="text-left hidden lg:block">
                  <div className="text-[11px] font-bold leading-none font-mono">
                    {currentUser.username}
                  </div>
                  <div className="text-[9px] text-amber-600 dark:text-amber-400 font-mono">
                    Lv.{currentUser.level || 1} • {currentUser.score || 0} pts
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                title="Sign in or create unique player account"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}

            {/* Exclusive Download & Export Card Button */}
            {onOpenDownloadModal && (
              <button
                onClick={onOpenDownloadModal}
                title="Open Card Export Suite (PNG, PDF, Deck, Print)"
                className="gold-metallic-foil hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-amber-50 text-xs font-bold shadow-xs cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-400/40"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="tracking-wide">Download</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-Time Live Game Invitation Toast */}
        {activeInvite && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-stone-900/95 border-2 border-amber-500 rounded-2xl shadow-2xl backdrop-blur-md text-white animate-in slide-in-from-top duration-200">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xl shadow-inner shrink-0">
              🎮
            </div>
            <div className="text-left">
              <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                {activeInvite.title || "Game Invitation"}
              </div>
              <div className="text-xs text-stone-200 font-medium">
                {activeInvite.message}
                {activeInvite.data?.pairCode && (
                  <span className="ml-1.5 font-mono text-amber-300 font-bold">
                    [Code: {activeInvite.data.pairCode}]
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={() => {
                  if (activeInvite.data?.pairCode && onAcceptInvite) {
                    onAcceptInvite(activeInvite.data.pairCode);
                  }
                  dismissActiveInvite();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs font-mono tracking-wider shadow cursor-pointer transition-all"
              >
                ACCEPT
              </button>
              <button
                onClick={dismissActiveInvite}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Center Canvas Viewport */}
        <div className="flex-1 overflow-auto p-12 flex items-center justify-center relative">
          {/* Zoom transform scale container */}
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease-out",
            }}
            className="relative"
          >
            {/* Atelier Corner Crop & Bleed Registration Marks */}
            <div className="absolute -top-3.5 -left-3.5 w-3 h-3 border-t-2 border-l-2 border-stone-400/60 dark:border-stone-600 pointer-events-none export-hide" />
            <div className="absolute -top-3.5 -right-3.5 w-3 h-3 border-t-2 border-r-2 border-stone-400/60 dark:border-stone-600 pointer-events-none export-hide" />
            <div className="absolute -bottom-3.5 -left-3.5 w-3 h-3 border-b-2 border-l-2 border-stone-400/60 dark:border-stone-600 pointer-events-none export-hide" />
            <div className="absolute -bottom-3.5 -right-3.5 w-3 h-3 border-b-2 border-r-2 border-stone-400/60 dark:border-stone-600 pointer-events-none export-hide" />

            {/* The signature Mahashankh / Bingo Tingo Template Container */}
            <div
              ref={ref}
              id="template-container"
              className="container relative luxury-card-shadow transition-all"
              style={{
                width: `${width}px`,
                height: `${height}px`,
                backgroundColor: containerBgColor,
                backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderTop: `${borderConfig.borderWidth}px solid ${borderConfig.topColor}`,
                borderRight: `${borderConfig.borderRightWidth}px solid ${borderConfig.rightColor}`,
                borderBottom: `${borderConfig.borderBottomWidth}px solid ${borderConfig.bottomColor}`,
                borderLeft: `${borderConfig.borderLeftWidth}px solid ${borderConfig.leftColor}`,
                borderRadius: `${borderConfig.borderRadius}px`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Elements on this template */}
              {items.map((item) => (
                <div key={item.id} className="canvas-element">
                  <CanvasItemView
                    item={item}
                    isSelected={selectedItemId === item.id}
                    scale={scale}
                    animationTrigger={animationTrigger}
                    onSelect={(e) => {
                      onSelectItem(item.id, e);
                    }}
                    onUpdate={(updated) => onUpdateItem(item.id, updated)}
                    onDuplicate={() => onDuplicateItem(item.id)}
                    onCopy={() => onCopyItem(item.id)}
                    onDelete={() => onDeleteItem(item.id)}
                    onApplyToAll={() => onApplyToAll(item.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onContextMenu(e, item.id);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Studio Status Bar at bottom right */}
        <div className="absolute bottom-3 right-4 z-40 bg-stone-900/80 dark:bg-stone-950/80 backdrop-blur-md text-stone-300 border border-stone-700/60 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider shadow-md pointer-events-none flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>{width} × {height} px</span>
          <span className="text-stone-500">•</span>
          <span>SCALE {Math.round(scale * 100)}%</span>
        </div>
      </div>
    );
  }
);

CanvasArea.displayName = "CanvasArea";
