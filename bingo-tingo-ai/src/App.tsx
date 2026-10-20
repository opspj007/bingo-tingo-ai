import React, { useState, useRef, useEffect, useCallback } from "react";
import { CanvasItem, CanvasBorderConfig, TabData, GalleryTemplate, EntranceAnimation } from "./types";
import { TEMPLATE_PRESETS } from "./constants/presets";
import { Sidebar } from "./components/Sidebar";
import { CanvasArea } from "./components/CanvasArea";
import { ContextMenu } from "./components/ContextMenu";
import { AIBingoModal } from "./components/AIBingoModal";
import { TemplateGalleryModal } from "./components/TemplateGalleryModal";
import { DownloadCardModal } from "./components/DownloadCardModal";
import { TwoPlayerArena } from "./components/TwoPlayerArena";
import { AuthModal } from "./components/auth/AuthModal";
import { PlayerProfileModal } from "./components/profile/PlayerProfileModal";
import { FriendsDrawer } from "./components/friends/FriendsDrawer";
import { PrivateChatModal } from "./components/chat/PrivateChatModal";
import { NotificationCenterModal } from "./components/notifications/NotificationCenterModal";
import { CreatePairModal } from "./components/multiplayer/CreatePairModal";
import { JoinPairModal } from "./components/multiplayer/JoinPairModal";
import { useAuth } from "./context/AuthContext";
import { Friend } from "./types/multiplayer";
import {
  captureCardToCanvas,
  downloadCanvasAsImage,
  copyCardToClipboard,
  printCardDirectly,
  exportCardToPdf,
  exportCardAsJson,
} from "./utils/cardExport";

const INITIAL_BORDER_CONFIG: CanvasBorderConfig = {
  topColor: "#c59b27",
  rightColor: "#92400e",
  bottomColor: "#78350f",
  leftColor: "#d97706",
  borderWidth: 4,
  borderRightWidth: 5,
  borderBottomWidth: 6,
  borderLeftWidth: 5,
  borderRadius: 14,
};

const DEFAULT_BINGO_CELLS = [
  { id: "c1", text: "Morning Espresso", emoji: "☕", marked: false },
  { id: "c2", text: "Deep Focus Flow", emoji: "✨", marked: true },
  { id: "c3", text: "5k Forest Walk", emoji: "🌲", marked: false },
  { id: "c4", text: "Pure Hydration", emoji: "💧", marked: false },
  { id: "c5", text: "Sparked Joy", emoji: "🌟", marked: true },
  { id: "c6", text: "ATELIER FREE ★", emoji: "👑", isFree: true, marked: true },
  { id: "c7", text: "Inbox Zero", emoji: "✉️", marked: false },
  { id: "c8", text: "Classic Novel", emoji: "📖", marked: false },
  { id: "c9", text: "Gourmet Dinner", emoji: "🍷", marked: false },
  { id: "c10", text: "Mindful Reset", emoji: "🧘", marked: false },
  { id: "c11", text: "Genuine Praise", emoji: "💫", marked: false },
  { id: "c12", text: "Vinyl Jazz Hour", emoji: "🎷", marked: false },
  { id: "c13", text: "Digital Detox", emoji: "🕊️", marked: false },
  { id: "c14", text: "Golden Hour View", emoji: "🌅", marked: false },
  { id: "c15", text: "Mastered Craft", emoji: "🎯", marked: false },
  { id: "c16", text: "Restful Slumber", emoji: "🌙", marked: false },
];

const INITIAL_ITEMS: CanvasItem[] = [
  {
    id: "item-title",
    type: "title",
    x: 40,
    y: 22,
    width: 729,
    height: 52,
    text: "THE BINGO ATELIER",
    fontSize: 26,
    fontFamily: "Playfair Display",
    color: "#1c1917",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    textAlign: "center",
    fontWeight: "bold",
    borderRadius: 8,
    borderColor: "#c59b27",
    borderWidth: 1.5,
    letterSpacing: 4,
    zIndex: 10,
  },
  {
    id: "item-subtitle",
    type: "subtitle",
    x: 100,
    y: 84,
    width: 609,
    height: 36,
    text: "★ Haute Couture Card & Social Media Template Studio ★",
    fontSize: 13,
    fontFamily: "Outfit",
    color: "#92400e",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "bold",
    borderRadius: 6,
    borderColor: "#e5d5be",
    borderWidth: 1,
    zIndex: 11,
  },
  {
    id: "item-bingo-main",
    type: "bingo",
    x: 45,
    y: 132,
    width: 719,
    height: 334,
    bingoGridSize: 4,
    bingoCells: DEFAULT_BINGO_CELLS,
    cellBg: "#fffdf9",
    cellTextColor: "#292524",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderColor: "#c59b27",
    borderWidth: 1.5,
    zIndex: 12,
  },
];

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [activeTabId, setActiveTabId] = useState("tab-1");
  const [tabs, setTabs] = useState<TabData[]>([
    {
      id: "tab-1",
      title: "Atelier Premiere",
      width: 809,
      height: 500,
      canvasBgColor: "#f4f1ea",
      containerBgColor: "#faf8f5",
      borderConfig: INITIAL_BORDER_CONFIG,
      items: INITIAL_ITEMS,
    },
  ]);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<CanvasItem | null>(null);
  const [scale, setScale] = useState<number>(0.85);
  const [selectedEffect, setSelectedEffect] = useState<string>("");
  const [selectedFont, setSelectedFont] = useState<string>("Outfit");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState<number>(0);

  // AI Modal
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Template Gallery Modal
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Download Card Modal
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // 2-Player Game Arena Modal
  const [isTwoPlayerOpen, setIsTwoPlayerOpen] = useState(false);
  const [activePairCode, setActivePairCode] = useState<string | undefined>(undefined);
  const [activeIsHost, setActiveIsHost] = useState<boolean>(false);

  // Platform & Social Modals
  const { currentUser, inviteFriendToGame } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFriendsDrawerOpen, setIsFriendsDrawerOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isCreatePairModalOpen, setIsCreatePairModalOpen] = useState(false);
  const [isJoinPairModalOpen, setIsJoinPairModalOpen] = useState(false);
  const [chatFriend, setChatFriend] = useState<Friend | null>(null);

  // Auto-launch 2-player arena if room or pair parameter is present in URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("pair") || params.get("room");
      if (code) {
        setActivePairCode(code.toUpperCase());
        setActiveIsHost(false);
        setIsTwoPlayerOpen(true);
      }
    }
  }, []);

  const handlePairCreated = (pairCode: string, isHost: boolean) => {
    setActivePairCode(pairCode);
    setActiveIsHost(isHost);
    setIsCreatePairModalOpen(false);
    setIsTwoPlayerOpen(true);
  };

  const handleJoinPairSuccess = (pairCode: string, isHost: boolean) => {
    setActivePairCode(pairCode);
    setActiveIsHost(isHost);
    setIsJoinPairModalOpen(false);
    setIsTwoPlayerOpen(true);
  };

  const handleAcceptInvite = (pairCode: string) => {
    setActivePairCode(pairCode);
    setActiveIsHost(false);
    setIsNotificationModalOpen(false);
    setIsTwoPlayerOpen(true);
  };

  const handleInviteFriendToPlay = async (friend: Friend) => {
    const res = await inviteFriendToGame(friend.friendId);
    if (res.success && res.pairCode) {
      setActivePairCode(res.pairCode);
      setActiveIsHost(true);
      setIsFriendsDrawerOpen(false);
      setChatFriend(null);
      setIsTwoPlayerOpen(true);
    } else {
      alert(res.error || "Failed to invite friend to game.");
    }
  };

  // Context Menu
  const [contextMenuState, setContextMenuState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    itemId?: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
  });

  // Undo / Redo history per active tab
  const [history, setHistory] = useState<TabData[][]>([tabs]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const containerExportRef = useRef<HTMLDivElement>(null);

  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const selectedItem = currentTab.items.find((it) => it.id === selectedItemId);

  // Push history state
  const pushState = useCallback((newTabs: TabData[]) => {
    setTabs(newTabs);
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, newTabs];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTabs(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTabs(history[newIndex]);
    }
  };

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Delete, Ctrl+C, Ctrl+V)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs/textareas
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedItemId) {
          e.preventDefault();
          handleDeleteItem(selectedItemId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (selectedItemId) {
          handleCopyItem(selectedItemId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        handlePasteItem();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItemId, historyIndex, history, currentTab]);

  // Update current tab properties
  const updateCurrentTab = (updater: (prev: TabData) => TabData) => {
    const updatedTabs = tabs.map((t) => (t.id === activeTabId ? updater(t) : t));
    pushState(updatedTabs);
  };

  // Sizing & Presets
  const handleWidthChange = (w: number) => {
    updateCurrentTab((t) => ({ ...t, width: w }));
  };

  const handleHeightChange = (h: number) => {
    updateCurrentTab((t) => ({ ...t, height: h }));
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = TEMPLATE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      updateCurrentTab((t) => ({
        ...t,
        width: preset.width,
        height: preset.height,
        title: preset.name.split("(")[0].trim(),
      }));
    }
  };

  // Tabs management
  const handleAddTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: TabData = {
      id: newId,
      title: `Template ${tabs.length + 1}`,
      width: currentTab.width,
      height: currentTab.height,
      canvasBgColor: currentTab.canvasBgColor,
      containerBgColor: currentTab.containerBgColor,
      borderConfig: { ...currentTab.borderConfig },
      items: [
        {
          id: `title-${Date.now()}`,
          type: "title",
          x: 40,
          y: 30,
          width: currentTab.width - 80,
          height: 60,
          text: "New Canvas Design",
          fontSize: 28,
          color: "#1e3a8a",
          backgroundColor: "#ffffff",
          textAlign: "center",
          fontWeight: "bold",
          borderRadius: 8,
          borderColor: "#d97706",
          borderWidth: 2,
        },
      ],
    };
    pushState([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (tabId: string) => {
    if (tabs.length <= 1) return;
    const remaining = tabs.filter((t) => t.id !== tabId);
    pushState(remaining);
    if (activeTabId === tabId) {
      setActiveTabId(remaining[0].id);
    }
  };

  // Items Management
  const handleSelectItem = (id: string | null) => {
    setSelectedItemId(id);
    if (id) {
      const item = currentTab.items.find((i) => i.id === id);
      if (item?.effect) setSelectedEffect(item.effect);
      if (item?.fontFamily) setSelectedFont(item.fontFamily);
    }
  };

  const handleUpdateItem = (id: string, updated: Partial<CanvasItem>) => {
    updateCurrentTab((tab) => ({
      ...tab,
      items: tab.items.map((item) => (item.id === id ? { ...item, ...updated } : item)),
    }));
  };

  const handleReplayAnimation = (_itemId?: string) => {
    setAnimationTrigger((prev) => prev + 1);
  };

  const handleApplyAnimationToAll = (
    anim: EntranceAnimation,
    duration = 0.8,
    staggerDelay = 0.2
  ) => {
    updateCurrentTab((tab) => ({
      ...tab,
      items: tab.items.map((it, idx) => ({
        ...it,
        animation: anim,
        animationDuration: duration,
        animationDelay: anim !== "none" ? Number((idx * staggerDelay).toFixed(2)) : 0,
      })),
    }));
    setAnimationTrigger((prev) => prev + 1);
  };

  const handleDuplicateItem = (id: string) => {
    const item = currentTab.items.find((i) => i.id === id);
    if (!item) return;
    const duplicated: CanvasItem = {
      ...item,
      id: `item-${Date.now()}`,
      x: item.x + 20,
      y: item.y + 20,
      zIndex: (item.zIndex || 10) + 1,
    };
    updateCurrentTab((tab) => ({
      ...tab,
      items: [...tab.items, duplicated],
    }));
    setSelectedItemId(duplicated.id);
  };

  const handleCopyItem = (id: string) => {
    const item = currentTab.items.find((i) => i.id === id);
    if (item) {
      setCopiedItem(item);
    }
  };

  const handlePasteItem = () => {
    if (!copiedItem) return;
    const pasted: CanvasItem = {
      ...copiedItem,
      id: `item-${Date.now()}`,
      x: copiedItem.x + 30,
      y: copiedItem.y + 30,
      zIndex: (copiedItem.zIndex || 10) + 1,
    };
    updateCurrentTab((tab) => ({
      ...tab,
      items: [...tab.items, pasted],
    }));
    setSelectedItemId(pasted.id);
  };

  const handleDeleteItem = (id: string) => {
    updateCurrentTab((tab) => ({
      ...tab,
      items: tab.items.filter((i) => i.id !== id),
    }));
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  const handleApplyToAll = (sourceId: string) => {
    const source = currentTab.items.find((i) => i.id === sourceId);
    if (!source) return;
    updateCurrentTab((tab) => ({
      ...tab,
      items: tab.items.map((item) => ({
        ...item,
        fontSize: source.fontSize,
        color: source.color,
        backgroundColor: source.backgroundColor,
        textAlign: source.textAlign,
        fontFamily: source.fontFamily,
        effect: source.effect,
      })),
    }));
  };

  const handleAddText = (type: "title" | "subtitle" | "text" = "text") => {
    const isTitle = type === "title";
    const isSub = type === "subtitle";
    const newItem: CanvasItem = {
      id: `item-${Date.now()}`,
      type,
      x: 60,
      y: isTitle ? 30 : isSub ? 90 : 160,
      width: isTitle ? 400 : isSub ? 320 : 260,
      height: isTitle ? 55 : isSub ? 45 : 40,
      text: isTitle ? "Catchy New Title" : isSub ? "Subheading Description" : "Editable Paragraph Text",
      fontSize: isTitle ? 28 : isSub ? 20 : 16,
      fontFamily: selectedFont,
      color: isTitle ? "#0044cc" : isSub ? "#e91e63" : "#212121",
      backgroundColor: "#ffffff",
      textAlign: "center",
      fontWeight: isTitle || isSub ? "bold" : "normal",
      borderRadius: 6,
      borderColor: "#d97706",
      borderWidth: 1,
      effect: selectedEffect,
      zIndex: currentTab.items.length + 10,
    };
    updateCurrentTab((t) => ({ ...t, items: [...t.items, newItem] }));
    setSelectedItemId(newItem.id);
  };

  const handleAddBingoBox = () => {
    const newItem: CanvasItem = {
      id: `bingo-${Date.now()}`,
      type: "bingo",
      x: 50,
      y: 120,
      width: 600,
      height: 320,
      bingoGridSize: 4,
      bingoCells: DEFAULT_BINGO_CELLS,
      cellBg: "#fef3c7",
      cellTextColor: "#78350f",
      borderRadius: 12,
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#a0522d",
      borderWidth: 2,
      zIndex: currentTab.items.length + 10,
    };
    updateCurrentTab((t) => ({ ...t, items: [...t.items, newItem] }));
    setSelectedItemId(newItem.id);
  };

  const handleAddShape = (shape: "rectangle" | "circle" | "star" | "heart" | "badge") => {
    const newItem: CanvasItem = {
      id: `shape-${Date.now()}`,
      type: "shape",
      shapeType: shape,
      x: 100,
      y: 100,
      width: shape === "badge" ? 180 : 120,
      height: shape === "badge" ? 50 : 120,
      backgroundColor: "#f59e0b",
      borderColor: "#b45309",
      borderWidth: 2,
      borderRadius: shape === "circle" ? 999 : 8,
      text: shape === "badge" ? "★ VIP PASS ★" : undefined,
      zIndex: currentTab.items.length + 10,
    };
    updateCurrentTab((t) => ({ ...t, items: [...t.items, newItem] }));
    setSelectedItemId(newItem.id);
  };

  const handleAddEmoji = (emoji: string) => {
    const newItem: CanvasItem = {
      id: `emoji-${Date.now()}`,
      type: "emoji",
      x: 120,
      y: 120,
      width: 70,
      height: 70,
      text: emoji,
      fontSize: 40,
      textAlign: "center",
      zIndex: currentTab.items.length + 10,
    };
    updateCurrentTab((t) => ({ ...t, items: [...t.items, newItem] }));
    setSelectedItemId(newItem.id);
  };

  const handleAddSymbol = (symbol: string) => {
    const newItem: CanvasItem = {
      id: `symbol-${Date.now()}`,
      type: "symbol",
      x: 140,
      y: 140,
      width: 80,
      height: 80,
      text: symbol,
      fontSize: 48,
      color: "#f59e0b",
      textAlign: "center",
      zIndex: currentTab.items.length + 10,
    };
    updateCurrentTab((t) => ({ ...t, items: [...t.items, newItem] }));
    setSelectedItemId(newItem.id);
  };

  const handleAddImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const newItem: CanvasItem = {
        id: `img-${Date.now()}`,
        type: "image",
        x: 100,
        y: 100,
        width: 260,
        height: 180,
        imageUrl,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#a0522d",
        zIndex: currentTab.items.length + 10,
      };
      updateCurrentTab((t) => ({ ...t, items: [...t.items, newItem] }));
      setSelectedItemId(newItem.id);
    };
    reader.readAsDataURL(file);
  };

  const handleAddFrame = () => {
    const newItem: CanvasItem = {
      id: `frame-${Date.now()}`,
      type: "frame",
      x: 50,
      y: 50,
      width: currentTab.width - 100,
      height: currentTab.height - 100,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: "#dfb81d",
      borderStyle: "dashed",
      zIndex: 5,
    };
    updateCurrentTab((t) => ({ ...t, items: [...t.items, newItem] }));
    setSelectedItemId(newItem.id);
  };

  // Color Shuffle / Randomizer
  const getRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
  const handleRandomizeColors = () => {
    updateCurrentTab((t) => ({
      ...t,
      containerBgColor: getRandomColor(),
      borderConfig: {
        ...t.borderConfig,
        topColor: getRandomColor(),
        rightColor: getRandomColor(),
        bottomColor: getRandomColor(),
        leftColor: getRandomColor(),
      },
    }));
  };

  // Background Image for Container
  const handleUploadBgImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      updateCurrentTab((t) => ({ ...t, bgImageUrl: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBgImage = () => {
    updateCurrentTab((t) => ({ ...t, bgImageUrl: undefined }));
  };

  // Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // High-Quality Card Exports (PNG, JPEG, PDF, JSON, Print, Clipboard)
  const getCardFilename = () =>
    currentTab.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "bingo_card";

  const handleDownloadPng = async () => {
    if (!containerExportRef.current) return;
    try {
      const canvas = await captureCardToCanvas(containerExportRef.current, {
        scale: 3, // 3x scale produces 300 DPI print-ready quality
        backgroundColor: currentTab.containerBgColor || "#ffffff",
      });
      downloadCanvasAsImage(canvas, getCardFilename(), "png");
    } catch (err) {
      console.error("Export PNG failed", err);
    }
  };

  const handleDownloadJpeg = async () => {
    if (!containerExportRef.current) return;
    try {
      const canvas = await captureCardToCanvas(containerExportRef.current, {
        scale: 3,
        backgroundColor: currentTab.containerBgColor || "#ffffff",
      });
      downloadCanvasAsImage(canvas, getCardFilename(), "jpeg", 0.95);
    } catch (err) {
      console.error("Export JPEG failed", err);
    }
  };

  const handleDownloadPdf = async () => {
    if (!containerExportRef.current) return;
    try {
      const canvas = await captureCardToCanvas(containerExportRef.current, {
        scale: 3,
        backgroundColor: currentTab.containerBgColor || "#ffffff",
      });
      exportCardToPdf(canvas, getCardFilename(), {
        pageSize: "letter",
        orientation: "auto",
        addCutGuides: true,
        title: currentTab.title,
        cardWidth: currentTab.width,
        cardHeight: currentTab.height,
      });
    } catch (err) {
      console.error("Export PDF failed", err);
    }
  };

  const handleCopyClipboard = async () => {
    if (!containerExportRef.current) return;
    try {
      const canvas = await captureCardToCanvas(containerExportRef.current, {
        scale: 2.5,
        backgroundColor: currentTab.containerBgColor || "#ffffff",
      });
      const ok = await copyCardToClipboard(canvas);
      if (ok) {
        alert("Card copied to clipboard! You can paste directly into chat or docs.");
      }
    } catch (err) {
      console.error("Copy to clipboard failed", err);
    }
  };

  const handlePrintCard = async () => {
    if (!containerExportRef.current) return;
    try {
      const canvas = await captureCardToCanvas(containerExportRef.current, {
        scale: 3,
        backgroundColor: currentTab.containerBgColor || "#ffffff",
      });
      printCardDirectly(canvas, currentTab.title);
    } catch (err) {
      console.error("Print card failed", err);
    }
  };

  const handleDownloadJson = () => {
    exportCardAsJson(currentTab, getCardFilename());
  };

  // Local Storage Save & Load
  const handleSaveTemplate = () => {
    try {
      localStorage.setItem("bingo_tingo_saved_tabs", JSON.stringify(tabs));
      localStorage.setItem("bingo_tingo_active_tab", activeTabId);
      alert("Template and tabs saved successfully to storage!");
    } catch (err) {
      console.error("Save template error", err);
    }
  };

  const handleLoadTemplate = () => {
    try {
      const saved = localStorage.getItem("bingo_tingo_saved_tabs");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          pushState(parsed);
          setActiveTabId(parsed[0].id);
          alert("Template loaded successfully!");
        }
      } else {
        alert("No saved template found in storage.");
      }
    } catch (err) {
      console.error("Load template error", err);
    }
  };

  // Import from Template Gallery (pre-made or community)
  const handleImportGalleryTemplate = (template: GalleryTemplate, asNewTab: boolean) => {
    const importedTab: TabData = {
      id: asNewTab ? `tab-${Date.now()}` : activeTabId,
      title: template.title,
      width: template.width,
      height: template.height,
      canvasBgColor: template.canvasBgColor,
      containerBgColor: template.containerBgColor,
      bgImageUrl: template.bgImageUrl,
      borderConfig: { ...template.borderConfig },
      items: JSON.parse(JSON.stringify(template.items)),
    };

    if (asNewTab) {
      pushState([...tabs, importedTab]);
      setActiveTabId(importedTab.id);
    } else {
      updateCurrentTab(() => importedTab);
    }
    setSelectedItemId(null);
  };

  // AI Bingo Data apply
  const handleApplyBingoData = (aiData: any) => {
    if (!aiData) return;

    const newCells = (aiData.cells || []).map((c: any, index: number) => ({
      id: `c-${index}-${Date.now()}`,
      text: c.text,
      emoji: c.emoji,
      isFree: c.isFree || (aiData.gridSize % 2 === 1 && index === Math.floor(aiData.cells.length / 2)),
      marked: false,
    }));

    const newItems: CanvasItem[] = [
      {
        id: `title-${Date.now()}`,
        type: "title",
        x: 40,
        y: 20,
        width: currentTab.width - 80,
        height: 55,
        text: aiData.title || "AI GENERATED BINGO",
        fontSize: 28,
        fontFamily: "Outfit",
        color: "#1e3a8a",
        backgroundColor: "#ffffff",
        textAlign: "center",
        fontWeight: "bold",
        borderRadius: 8,
        borderColor: aiData.colors?.borderColor || "#dfb81d",
        borderWidth: 2,
        effect: aiData.effect || "glow",
        zIndex: 10,
      },
      {
        id: `sub-${Date.now()}`,
        type: "subtitle",
        x: 80,
        y: 85,
        width: currentTab.width - 160,
        height: 38,
        text: aiData.subtitle || "Bingo Tingo AI Challenge",
        fontSize: 16,
        fontFamily: "Outfit",
        color: "#db2777",
        backgroundColor: "#ffffff",
        textAlign: "center",
        fontWeight: "bold",
        borderRadius: 6,
        borderColor: "#a0522d",
        borderWidth: 1,
        zIndex: 11,
      },
      {
        id: `bingo-${Date.now()}`,
        type: "bingo",
        x: 40,
        y: 135,
        width: currentTab.width - 80,
        height: Math.max(300, currentTab.height - 150),
        bingoGridSize: aiData.gridSize || 4,
        bingoCells: newCells,
        cellBg: aiData.colors?.cellBg || "#fef3c7",
        cellTextColor: aiData.colors?.cellTextColor || "#78350f",
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: aiData.colors?.borderColor || "#a0522d",
        borderWidth: 2,
        zIndex: 12,
      },
    ];

    updateCurrentTab((t) => ({
      ...t,
      title: aiData.title ? aiData.title.slice(0, 18) : t.title,
      containerBgColor: aiData.colors?.containerBg || t.containerBgColor,
      canvasBgColor: aiData.colors?.background || t.canvasBgColor,
      borderConfig: {
        ...t.borderConfig,
        topColor: aiData.colors?.borderColor || t.borderConfig.topColor,
        rightColor: aiData.colors?.borderRightColor || t.borderConfig.rightColor,
        bottomColor: aiData.colors?.borderBottomColor || t.borderConfig.bottomColor,
        leftColor: aiData.colors?.borderLeftColor || t.borderConfig.leftColor,
      },
      items: newItems,
    }));
  };

  // AI Template Data apply
  const handleApplyTemplateData = (aiData: any) => {
    if (!aiData) return;
    const generatedItems: CanvasItem[] = [];

    // Title
    if (aiData.title) {
      generatedItems.push({
        id: `title-${Date.now()}`,
        type: "title",
        x: 40,
        y: 30,
        width: currentTab.width - 80,
        height: 65,
        text: aiData.title,
        fontSize: 32,
        fontFamily: "Outfit",
        color: "#1e3a8a",
        backgroundColor: "#ffffff",
        textAlign: "center",
        fontWeight: "bold",
        borderRadius: 8,
        borderColor: aiData.colors?.borderColor || "#d97706",
        borderWidth: 2,
        effect: "glow",
        zIndex: 10,
      });
    }

    // Subtitle
    if (aiData.subtitle) {
      generatedItems.push({
        id: `sub-${Date.now()}`,
        type: "subtitle",
        x: 60,
        y: 110,
        width: currentTab.width - 120,
        height: 45,
        text: aiData.subtitle,
        fontSize: 18,
        fontFamily: "Outfit",
        color: "#db2777",
        backgroundColor: "#ffffff",
        textAlign: "center",
        fontWeight: "bold",
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#a0522d",
        zIndex: 11,
      });
    }

    // Extra items
    if (Array.isArray(aiData.items)) {
      aiData.items.forEach((item: any, idx: number) => {
        generatedItems.push({
          id: `item-${idx}-${Date.now()}`,
          type: "text",
          x: 60 + idx * 40,
          y: 180 + idx * 70,
          width: Math.min(360, currentTab.width - 120),
          height: 50,
          text: item.text,
          fontSize: item.size || 16,
          fontFamily: "Outfit",
          color: item.color || "#1f2937",
          backgroundColor: "#ffffff",
          textAlign: "center",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          zIndex: 12 + idx,
        });
      });
    }

    updateCurrentTab((t) => ({
      ...t,
      title: aiData.title ? aiData.title.slice(0, 18) : t.title,
      containerBgColor: aiData.colors?.containerBg || t.containerBgColor,
      canvasBgColor: aiData.colors?.background || t.canvasBgColor,
      borderConfig: {
        ...t.borderConfig,
        topColor: aiData.colors?.borderColor || t.borderConfig.topColor,
        rightColor: aiData.colors?.borderRightColor || t.borderConfig.rightColor,
        bottomColor: aiData.colors?.borderBottomColor || t.borderConfig.bottomColor,
        leftColor: aiData.colors?.borderLeftColor || t.borderConfig.leftColor,
      },
      items: generatedItems,
    }));
  };

  // Context Menu trigger
  const handleContextMenu = (e: React.MouseEvent, itemId?: string) => {
    if (itemId) {
      setSelectedItemId(itemId);
    }
    setContextMenuState({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      itemId,
    });
  };

  return (
    <div className={`flex w-screen h-screen overflow-hidden ${isDark ? "dark" : ""}`}>
      {/* Sidebar Controls */}
      <Sidebar
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        width={currentTab.width}
        height={currentTab.height}
        onWidthChange={handleWidthChange}
        onHeightChange={handleHeightChange}
        onApplyPreset={handleApplyPreset}
        onAddTab={handleAddTab}
        onSaveTemplate={handleSaveTemplate}
        onLoadTemplate={handleLoadTemplate}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenTwoPlayer={() => setIsTwoPlayerOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onDownloadPng={handleDownloadPng}
        onDownloadPdf={handleDownloadPdf}
        onDownloadJpeg={handleDownloadJpeg}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
        onPrintCard={handlePrintCard}
        onCopyImageClipboard={handleCopyClipboard}
        onDownloadJson={handleDownloadJson}
        onDownloadDeck={() => setIsDownloadModalOpen(true)}
        hasBingoGrid={currentTab.items.some((it) => it.type === "bingo")}
        canvasBgColor={currentTab.canvasBgColor}
        onCanvasBgColorChange={(c) => updateCurrentTab((t) => ({ ...t, canvasBgColor: c }))}
        containerBgColor={currentTab.containerBgColor}
        onContainerBgColorChange={(c) => updateCurrentTab((t) => ({ ...t, containerBgColor: c }))}
        textColor="#1f2937"
        onTextColorChange={(c) => {
          if (selectedItemId) {
            handleUpdateItem(selectedItemId, { color: c });
          }
        }}
        borderConfig={currentTab.borderConfig}
        onBorderConfigChange={(b) =>
          updateCurrentTab((t) => ({ ...t, borderConfig: { ...t.borderConfig, ...b } }))
        }
        onRandomizeColors={handleRandomizeColors}
        onUploadBgImage={handleUploadBgImage}
        onRemoveBgImage={handleRemoveBgImage}
        onOpenAIGenerator={() => setIsAIModalOpen(true)}
        onAddText={handleAddText}
        onAddBingoBox={handleAddBingoBox}
        onAddShape={handleAddShape}
        onAddEmoji={handleAddEmoji}
        onAddSymbol={handleAddSymbol}
        onAddImageFile={handleAddImageFile}
        onAddFrame={handleAddFrame}
        onRemoveSelectedItem={() => selectedItemId && handleDeleteItem(selectedItemId)}
        onCopySelected={() => selectedItemId && handleCopyItem(selectedItemId)}
        onPasteSelected={handlePasteItem}
        onToggleLockSelected={() => {
          if (selectedItemId) {
            handleUpdateItem(selectedItemId, { locked: !selectedItem?.locked });
          }
        }}
        isItemLocked={selectedItem?.locked}
        hasSelectedItem={Boolean(selectedItemId)}
        selectedEffect={selectedEffect}
        onSelectEffect={(eff) => {
          setSelectedEffect(eff);
          if (selectedItemId) {
            handleUpdateItem(selectedItemId, { effect: eff });
          }
        }}
        selectedFont={selectedFont}
        onSelectFont={(font) => {
          setSelectedFont(font);
          if (selectedItemId) {
            handleUpdateItem(selectedItemId, { fontFamily: font });
          }
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        selectedItem={selectedItem}
        onUpdateSelectedItem={(updated) => {
          if (selectedItemId) {
            handleUpdateItem(selectedItemId, updated);
          }
        }}
        onReplayAnimation={handleReplayAnimation}
        onApplyAnimationToAll={handleApplyAnimationToAll}
        canvasItems={currentTab.items}
        onSelectItemById={(id) => handleSelectItem(id)}
      />

      {/* Main Canvas Workspace */}
      <CanvasArea
        ref={containerExportRef}
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onAddTab={handleAddTab}
        onCloseTab={handleCloseTab}
        width={currentTab.width}
        height={currentTab.height}
        canvasBgColor={currentTab.canvasBgColor}
        containerBgColor={currentTab.containerBgColor}
        bgImageUrl={currentTab.bgImageUrl}
        borderConfig={currentTab.borderConfig}
        items={currentTab.items}
        selectedItemId={selectedItemId}
        scale={scale}
        animationTrigger={animationTrigger}
        onScaleChange={setScale}
        onSelectItem={handleSelectItem}
        onUpdateItem={handleUpdateItem}
        onDuplicateItem={handleDuplicateItem}
        onCopyItem={handleCopyItem}
        onDeleteItem={handleDeleteItem}
        onApplyToAll={handleApplyToAll}
        onContextMenu={handleContextMenu}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
        onOpenTwoPlayer={() => {
          setActivePairCode(undefined);
          setActiveIsHost(true);
          setIsTwoPlayerOpen(true);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => {
          if (!currentUser) setIsAuthModalOpen(true);
          else setIsProfileModalOpen(true);
        }}
        onOpenFriends={() => {
          if (!currentUser) setIsAuthModalOpen(true);
          else setIsFriendsDrawerOpen(true);
        }}
        onOpenNotifications={() => {
          if (!currentUser) setIsAuthModalOpen(true);
          else setIsNotificationModalOpen(true);
        }}
        onOpenCreatePair={() => setIsCreatePairModalOpen(true)}
        onOpenJoinPair={() => setIsJoinPairModalOpen(true)}
        onAcceptInvite={handleAcceptInvite}
      />

      {/* Floating Right-Click Context Menu */}
      {contextMenuState.visible && (
        <ContextMenu
          x={contextMenuState.x}
          y={contextMenuState.y}
          hasSelectedItem={Boolean(selectedItemId)}
          isLocked={selectedItem?.locked}
          onAddText={() => handleAddText("text")}
          onAddBingoBox={handleAddBingoBox}
          onRotateItem={() => {
            if (selectedItemId) {
              handleUpdateItem(selectedItemId, { rotation: ((selectedItem?.rotation || 0) + 15) % 360 });
            }
          }}
          onAddBackground={() => {
            if (selectedItemId) {
              handleUpdateItem(selectedItemId, { backgroundColor: getRandomColor() });
            }
          }}
          onChangeShape={(shape) => {
            if (selectedItemId) {
              handleUpdateItem(selectedItemId, {
                shapeType: shape,
                borderRadius: shape === "circle" ? 999 : shape === "rectangle" ? 0 : 8,
              });
            }
          }}
          onCopy={() => selectedItemId && handleCopyItem(selectedItemId)}
          onPaste={handlePasteItem}
          onDelete={() => selectedItemId && handleDeleteItem(selectedItemId)}
          onToggleLock={() => {
            if (selectedItemId) {
              handleUpdateItem(selectedItemId, { locked: !selectedItem?.locked });
            }
          }}
          onBringForward={() => {
            if (selectedItemId) {
              handleUpdateItem(selectedItemId, { zIndex: (selectedItem?.zIndex || 10) + 2 });
            }
          }}
          onSendBackward={() => {
            if (selectedItemId) {
              handleUpdateItem(selectedItemId, { zIndex: Math.max(1, (selectedItem?.zIndex || 10) - 2) });
            }
          }}
          onClose={() => setContextMenuState((s) => ({ ...s, visible: false }))}
        />
      )}

      {/* AI Bingo & Template Generator Modal */}
      <AIBingoModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onApplyBingoData={handleApplyBingoData}
        onApplyTemplateData={handleApplyTemplateData}
      />

      {/* Template Gallery Modal */}
      <TemplateGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        currentWorkspace={currentTab}
        onImportTemplate={handleImportGalleryTemplate}
      />

      {/* Download & Export Card Modal */}
      <DownloadCardModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        currentTab={currentTab}
        tabs={tabs}
        containerRef={containerExportRef}
        isDark={isDark}
      />

      {/* 2-Player Game Arena Modal (Local Pass & Play, AI Match, or Real-Time Pair Duel) */}
      <TwoPlayerArena
        isOpen={isTwoPlayerOpen}
        onClose={() => {
          setIsTwoPlayerOpen(false);
          setActivePairCode(undefined);
          setActiveIsHost(false);
        }}
        initialPairCode={activePairCode}
        initialIsHost={activeIsHost}
        sourceCells={
          currentTab.items.find((it) => it.type === "bingo")?.bingoCells || DEFAULT_BINGO_CELLS
        }
        sourceTitle={currentTab.title || "Bingo Atelier Duel"}
        sourceGridSize={
          currentTab.items.find((it) => it.type === "bingo")?.bingoGridSize || 4
        }
      />

      {/* Platform User Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Player Profile & Match History Modal */}
      <PlayerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Friends Drawer */}
      <FriendsDrawer
        isOpen={isFriendsDrawerOpen}
        onClose={() => setIsFriendsDrawerOpen(false)}
        onOpenChat={(friend) => setChatFriend(friend)}
        onInviteToPlay={handleInviteFriendToPlay}
      />

      {/* Private Chat Modal */}
      <PrivateChatModal
        isOpen={Boolean(chatFriend)}
        friend={chatFriend}
        onClose={() => setChatFriend(null)}
        onInviteToPlay={handleInviteFriendToPlay}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onAcceptGameInvite={handleAcceptInvite}
      />

      {/* Create Pair Modal */}
      <CreatePairModal
        isOpen={isCreatePairModalOpen}
        onClose={() => setIsCreatePairModalOpen(false)}
        onPairCreated={handlePairCreated}
        customCards={
          currentTab.items.find((it) => it.type === "bingo")?.bingoCells || DEFAULT_BINGO_CELLS
        }
      />

      {/* Join Pair Modal */}
      <JoinPairModal
        isOpen={isJoinPairModalOpen}
        onClose={() => setIsJoinPairModalOpen(false)}
        onJoinSuccess={handleJoinPairSuccess}
      />
    </div>
  );
}
