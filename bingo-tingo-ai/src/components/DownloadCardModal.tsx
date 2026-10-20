import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Printer,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Layers,
  Scissors,
  FileJson,
  Archive,
  Eye,
  X,
  Sparkles,
  Info,
  Loader2,
} from "lucide-react";
import { TabData, ExportFormat, PdfPageSize } from "../types";
import {
  captureCardToCanvas,
  downloadCanvasAsImage,
  copyCardToClipboard,
  printCardDirectly,
  exportCardToPdf,
  exportCardAsJson,
  generateAndDownloadCardDeck,
  downloadAllTabsAsZip,
} from "../utils/cardExport";

interface DownloadCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: TabData;
  tabs: TabData[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDark?: boolean;
}

export const DownloadCardModal: React.FC<DownloadCardModalProps> = ({
  isOpen,
  onClose,
  currentTab,
  tabs,
  containerRef,
  isDark = false,
}) => {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [resolution, setResolution] = useState<number>(3); // 3x HD by default
  const [filename, setFilename] = useState<string>("");
  const [transparentBg, setTransparentBg] = useState<boolean>(false);
  const [jpegQuality, setJpegQuality] = useState<number>(0.92);
  const [pdfPageSize, setPdfPageSize] = useState<PdfPageSize>("letter");
  const [pdfOrientation, setPdfOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [addCutGuides, setAddCutGuides] = useState<boolean>(true);
  const [deckCount, setDeckCount] = useState<number>(10);
  const [deckFormat, setDeckFormat] = useState<"pdf" | "zip">("pdf");

  // Status & Progress
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const hasBingoGrid = currentTab.items.some((it) => it.type === "bingo");

  // Initialize clean filename on modal open or tab change
  useEffect(() => {
    if (isOpen) {
      const sanitized = currentTab.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "bingo_card";
      setFilename(sanitized);
      setCopySuccess(false);
      setSuccessToast(null);

      // Generate quick thumbnail preview
      generateThumbnail();
    }
  }, [isOpen, currentTab]);

  const generateThumbnail = async () => {
    if (!containerRef.current) return;
    try {
      const canvas = await captureCardToCanvas(containerRef.current, { scale: 1 });
      setPreviewDataUrl(canvas.toDataURL("image/png"));
    } catch (e) {
      console.warn("Failed to generate preview thumbnail", e);
    }
  };

  if (!isOpen) return null;

  const targetWidth = currentTab.width * resolution;
  const targetHeight = currentTab.height * resolution;

  const handleDownload = async () => {
    if (!containerRef.current) return;
    setIsProcessing(true);
    setProgressText("Rendering card...");

    try {
      const cleanBaseName = filename.trim() || "bingo_card";

      if (format === "png") {
        setProgressText(`Rendering crisp ${resolution}x PNG...`);
        const canvas = await captureCardToCanvas(containerRef.current, {
          scale: resolution,
          backgroundColor: transparentBg ? null : currentTab.containerBgColor || "#ffffff",
        });
        downloadCanvasAsImage(canvas, cleanBaseName, "png");
        setSuccessToast(`Saved ${cleanBaseName}.png`);
      } else if (format === "jpeg") {
        setProgressText(`Compressing JPEG (${Math.round(jpegQuality * 100)}%)...`);
        const canvas = await captureCardToCanvas(containerRef.current, {
          scale: resolution,
          backgroundColor: currentTab.containerBgColor || "#ffffff",
        });
        downloadCanvasAsImage(canvas, cleanBaseName, "jpeg", jpegQuality);
        setSuccessToast(`Saved ${cleanBaseName}.jpeg`);
      } else if (format === "pdf") {
        setProgressText("Formatting PDF document...");
        const canvas = await captureCardToCanvas(containerRef.current, {
          scale: Math.max(2, resolution),
          backgroundColor: currentTab.containerBgColor || "#ffffff",
        });
        exportCardToPdf(canvas, cleanBaseName, {
          pageSize: pdfPageSize,
          orientation: pdfOrientation,
          addCutGuides,
          title: currentTab.title,
          cardWidth: currentTab.width,
          cardHeight: currentTab.height,
        });
        setSuccessToast(`Generated ${cleanBaseName}.pdf`);
      } else if (format === "json") {
        exportCardAsJson(currentTab, cleanBaseName);
        setSuccessToast(`Exported ${cleanBaseName}.json template`);
      } else if (format === "deck") {
        await generateAndDownloadCardDeck(
          containerRef.current,
          currentTab,
          deckCount,
          deckFormat,
          cleanBaseName,
          (done, total, msg) => {
            setProgressText(msg);
          }
        );
        setSuccessToast(`Generated ${deckCount} unique randomized cards!`);
      }
    } catch (err: any) {
      console.error("Export error:", err);
      alert(`Export error: ${err?.message || "Failed to download card"}`);
    } finally {
      setIsProcessing(false);
      setProgressText("");
    }
  };

  const handleCopyClipboard = async () => {
    if (!containerRef.current) return;
    setIsProcessing(true);
    setProgressText("Copying high-res card to clipboard...");
    try {
      const canvas = await captureCardToCanvas(containerRef.current, {
        scale: 2.5,
        backgroundColor: currentTab.containerBgColor || "#ffffff",
      });
      const ok = await copyCardToClipboard(canvas);
      if (ok) {
        setCopySuccess(true);
        setSuccessToast("Card image copied to clipboard! Paste into Discord, Slack, etc.");
        setTimeout(() => setCopySuccess(false), 3000);
      } else {
        alert("Clipboard copy failed. Your browser may require permission.");
      }
    } catch (err) {
      console.error("Clipboard copy failed", err);
    } finally {
      setIsProcessing(false);
      setProgressText("");
    }
  };

  const handleDirectPrint = async () => {
    if (!containerRef.current) return;
    setIsProcessing(true);
    setProgressText("Preparing print window...");
    try {
      const canvas = await captureCardToCanvas(containerRef.current, {
        scale: 3,
        backgroundColor: currentTab.containerBgColor || "#ffffff",
      });
      printCardDirectly(canvas, currentTab.title);
      setSuccessToast("Print dialog opened!");
    } catch (err) {
      console.error("Direct print failed", err);
    } finally {
      setIsProcessing(false);
      setProgressText("");
    }
  };

  const handleDownloadAllTabs = async () => {
    if (!containerRef.current) return;
    setIsProcessing(true);
    setProgressText(`Packaging ${tabs.length} tabs into ZIP...`);
    try {
      await downloadAllTabsAsZip(
        tabs,
        async (_tab) => {
          // Captures currently mounted container
          return captureCardToCanvas(containerRef.current!, { scale: 2.5 });
        },
        "bingo_card_pack",
        (curr, total) => {
          setProgressText(`Processing card ${curr} of ${total}...`);
        }
      );
      setSuccessToast(`Exported all ${tabs.length} tabs into ZIP package!`);
    } catch (err) {
      console.error("Download all tabs failed", err);
    } finally {
      setIsProcessing(false);
      setProgressText("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-all ${
          isDark
            ? "bg-stone-900 border-stone-800 text-stone-100"
            : "bg-white border-amber-200 text-stone-900"
        }`}
        style={{ maxHeight: "92vh" }}
      >
        {/* Modal Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isDark ? "border-stone-800 bg-stone-950/40" : "border-amber-100 bg-amber-50/70"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-md">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide text-amber-900 dark:text-amber-300">
                Download & Export Card
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Export crisp print-ready files, social images, PDF documents, or randomized game decks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-stone-500 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
          {/* Success Toast */}
          {successToast && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2 font-bold">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{successToast}</span>
              </div>
              <button
                onClick={() => setSuccessToast(null)}
                className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Top Row: Preview Card + Quick Stats */}
          <div
            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-4 ${
              isDark ? "bg-stone-800/50 border-stone-800" : "bg-stone-50 border-amber-100"
            }`}
          >
            {/* Thumbnail Preview */}
            <div className="w-32 h-32 rounded-lg border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-900 overflow-hidden flex items-center justify-center relative shadow-inner shrink-0">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Card Preview"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="text-stone-400 flex flex-col items-center gap-1">
                  <Eye className="w-5 h-5" />
                  <span className="text-[10px]">Loading preview</span>
                </div>
              )}
            </div>

            {/* Quick Card Details & Dimensions */}
            <div className="flex-1 flex flex-col gap-1.5 w-full">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {currentTab.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                  {currentTab.width} × {currentTab.height} px
                </span>
              </div>

              <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
                <span>Output Resolution:</span>
                <strong className="font-mono text-amber-700 dark:text-amber-400">
                  {targetWidth} × {targetHeight} px
                </strong>
                <span className="text-[10px] text-stone-400">
                  ({resolution === 1 ? "72 DPI Web" : resolution === 2 ? "150 DPI Standard" : resolution === 3 ? "225 DPI Print HD" : "300 DPI Ultra HD"})
                </span>
              </div>

              {/* Quick Actions Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-stone-200 dark:border-stone-700/60 mt-1">
                <button
                  onClick={handleCopyClipboard}
                  disabled={isProcessing}
                  title="Copy high-res image to clipboard"
                  className="px-2.5 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  {copySuccess ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copySuccess ? "Copied!" : "Copy to Clipboard"}</span>
                </button>

                <button
                  onClick={handleDirectPrint}
                  disabled={isProcessing}
                  title="Open browser print dialog"
                  className="px-2.5 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Card</span>
                </button>

                {tabs.length > 1 && (
                  <button
                    onClick={handleDownloadAllTabs}
                    disabled={isProcessing}
                    title="Download all open tabs as a ZIP package"
                    className="px-2.5 py-1.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 hover:bg-teal-200 dark:hover:bg-teal-900 border border-teal-300 dark:border-teal-800 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Download All Tabs ({tabs.length})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Format Selection Tabs */}
          <div>
            <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300 block mb-1.5 uppercase tracking-wider">
              Choose File Format:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {/* PNG */}
              <button
                onClick={() => setFormat("png")}
                className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  format === "png"
                    ? "bg-amber-700 text-white border-amber-800 shadow-md scale-[1.02]"
                    : "bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-amber-50"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span className="font-bold text-xs">PNG</span>
                <span className={`text-[9px] ${format === "png" ? "text-amber-200" : "text-stone-400"}`}>
                  Crisp Lossless
                </span>
              </button>

              {/* PDF */}
              <button
                onClick={() => setFormat("pdf")}
                className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  format === "pdf"
                    ? "bg-amber-700 text-white border-amber-800 shadow-md scale-[1.02]"
                    : "bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-amber-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="font-bold text-xs">PDF</span>
                <span className={`text-[9px] ${format === "pdf" ? "text-amber-200" : "text-stone-400"}`}>
                  Print Document
                </span>
              </button>

              {/* JPEG */}
              <button
                onClick={() => setFormat("jpeg")}
                className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  format === "jpeg"
                    ? "bg-amber-700 text-white border-amber-800 shadow-md scale-[1.02]"
                    : "bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-amber-50"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span className="font-bold text-xs">JPEG</span>
                <span className={`text-[9px] ${format === "jpeg" ? "text-amber-200" : "text-stone-400"}`}>
                  Small File Size
                </span>
              </button>

              {/* Bingo Card Deck (if applicable) */}
              <button
                onClick={() => setFormat("deck")}
                disabled={!hasBingoGrid}
                className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                  !hasBingoGrid
                    ? "opacity-40 cursor-not-allowed bg-stone-100 dark:bg-stone-800 border-stone-200"
                    : format === "deck"
                    ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-700 shadow-md scale-[1.02] cursor-pointer"
                    : "bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-amber-50 cursor-pointer"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="font-bold text-xs">Card Deck</span>
                <span className={`text-[9px] ${format === "deck" ? "text-amber-100" : "text-stone-400"}`}>
                  {hasBingoGrid ? "Multi-Card Pack" : "Requires Bingo"}
                </span>
              </button>

              {/* JSON */}
              <button
                onClick={() => setFormat("json")}
                className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  format === "json"
                    ? "bg-amber-700 text-white border-amber-800 shadow-md scale-[1.02]"
                    : "bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-amber-50"
                }`}
              >
                <FileJson className="w-4 h-4" />
                <span className="font-bold text-xs">JSON</span>
                <span className={`text-[9px] ${format === "json" ? "text-amber-200" : "text-stone-400"}`}>
                  Template Data
                </span>
              </button>
            </div>
          </div>

          {/* Configuration Options based on selected format */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col gap-3 ${
              isDark ? "bg-stone-800/40 border-stone-800" : "bg-amber-50/40 border-amber-200/80"
            }`}
          >
            {/* Filename Input */}
            <div>
              <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block mb-1">
                File Name:
              </label>
              <div className="flex items-center rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-2 py-1.5 focus-within:border-amber-600">
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="my_bingo_card"
                  className="w-full text-xs font-mono bg-transparent outline-none text-stone-900 dark:text-stone-100"
                />
                <span className="text-xs font-mono text-stone-400 font-semibold pl-1 select-none">
                  .{format === "deck" ? deckFormat : format}
                </span>
              </div>
            </div>

            {/* PNG & JPEG Resolution Options */}
            {(format === "png" || format === "jpeg") && (
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                  <span>Image Quality & Scaling:</span>
                  <span className="font-mono text-amber-700 dark:text-amber-400">{resolution}x Scale</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { scale: 1, label: "1x", desc: "Web (72 DPI)" },
                    { scale: 2, label: "2x", desc: "HD (150 DPI)" },
                    { scale: 3, label: "3x", desc: "Print (225 DPI)" },
                    { scale: 4, label: "4x", desc: "Ultra (300 DPI)" },
                  ].map((lvl) => (
                    <button
                      key={lvl.scale}
                      onClick={() => setResolution(lvl.scale)}
                      className={`py-1.5 px-2 rounded-lg border text-center flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
                        resolution === lvl.scale
                          ? "bg-amber-700 text-white border-amber-800 font-bold"
                          : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-amber-50"
                      }`}
                    >
                      <span className="text-xs font-bold">{lvl.label}</span>
                      <span
                        className={`text-[9px] ${
                          resolution === lvl.scale ? "text-amber-200" : "text-stone-400"
                        }`}
                      >
                        {lvl.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PNG Specific: Transparent Background Toggle */}
            {format === "png" && (
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="rounded accent-amber-600 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    Transparent Background (PNG only)
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Omit card canvas color for transparent graphics and stickers
                  </span>
                </div>
              </label>
            )}

            {/* JPEG Specific: Quality Slider */}
            {format === "jpeg" && (
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                  <span>Compression Quality:</span>
                  <span className="font-mono text-amber-700 dark:text-amber-400">
                    {Math.round(jpegQuality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.0"
                  step="0.05"
                  value={jpegQuality}
                  onChange={(e) => setJpegQuality(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            )}

            {/* PDF Specific: Page Size, Orientation, Cut Guides */}
            {format === "pdf" && (
              <div className="flex flex-col gap-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-1">
                      Paper Size
                    </label>
                    <select
                      value={pdfPageSize}
                      onChange={(e) => setPdfPageSize(e.target.value as PdfPageSize)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 font-medium"
                    >
                      <option value="letter">US Letter (8.5 × 11 in)</option>
                      <option value="a4">A4 (210 × 297 mm)</option>
                      <option value="fit">Exact Card Dimensions</option>
                      <option value="photo">Photo Card (4 × 6 in)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-1">
                      Orientation
                    </label>
                    <select
                      value={pdfOrientation}
                      onChange={(e) =>
                        setPdfOrientation(e.target.value as "auto" | "portrait" | "landscape")
                      }
                      className="w-full px-2 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 font-medium"
                    >
                      <option value="auto">Auto (Match Card)</option>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                </div>

                {pdfPageSize !== "fit" && (
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addCutGuides}
                      onChange={(e) => setAddCutGuides(e.target.checked)}
                      className="rounded accent-amber-600 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-stone-500" />
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        Include Cut Guides & Crop Marks
                      </span>
                    </div>
                  </label>
                )}
              </div>
            )}

            {/* Bingo Deck Specific Options */}
            {format === "deck" && (
              <div className="flex flex-col gap-2.5">
                <div className="p-2 rounded-lg bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                    Generates a deck of <strong>unique, randomized bingo cards</strong> for your
                    game night or classroom. The free-space center is kept intact while cell items
                    are shuffled uniquely per card.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-1">
                      Deck Size (Cards)
                    </label>
                    <select
                      value={deckCount}
                      onChange={(e) => setDeckCount(parseInt(e.target.value) || 10)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 font-bold text-amber-900 dark:text-amber-300"
                    >
                      <option value={5}>5 Unique Cards</option>
                      <option value={10}>10 Unique Cards</option>
                      <option value={20}>20 Unique Cards</option>
                      <option value={30}>30 Unique Cards</option>
                      <option value={50}>50 Unique Cards</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-1">
                      Deck Package Format
                    </label>
                    <select
                      value={deckFormat}
                      onChange={(e) => setDeckFormat(e.target.value as "pdf" | "zip")}
                      className="w-full px-2 py-1.5 text-xs rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 font-medium"
                    >
                      <option value="pdf">Multi-Page PDF (Ready to Print)</option>
                      <option value="zip">ZIP Archive of PNG Images</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isDark ? "border-stone-800 bg-stone-950/40" : "border-amber-100 bg-stone-50"
          }`}
        >
          <div className="flex items-center gap-2">
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{progressText || "Processing card download..."}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-700 via-amber-800 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white font-extrabold text-xs shadow-lg shadow-amber-900/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    Download {format === "deck" ? `${deckCount} Cards Deck` : format.toUpperCase()}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
