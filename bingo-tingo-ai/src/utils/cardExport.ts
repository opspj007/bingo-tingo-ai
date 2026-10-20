import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { TabData, DownloadCardConfig, CanvasItem, BingoCell } from "../types";

/**
 * Renders an HTML element (the template container) to an HTMLCanvasElement
 */
export async function captureCardToCanvas(
  element: HTMLElement,
  options: {
    scale?: number;
    backgroundColor?: string | null;
  } = {}
): Promise<HTMLCanvasElement> {
  const { scale = 3, backgroundColor = null } = options;

  // Add temporary is-exporting class to disable entrance animations, transitions, and hover artifacts
  element.classList.add("is-exporting");

  try {
    // Wait for any pending fonts/renders
    if (document.fonts) {
      await document.fonts.ready;
    }

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: backgroundColor ?? null,
      onclone: (clonedDoc) => {
        // Ensure cloned element has no selection outlines or popovers
        const clonedContainer = clonedDoc.getElementById("template-container");
        if (clonedContainer) {
          clonedContainer.classList.add("is-exporting");
          // Remove any selection rings / badges in export
          clonedContainer.querySelectorAll(".export-hide, .quick-edit-popover").forEach((el) => {
            (el as HTMLElement).style.display = "none";
          });
        }
      },
    });

    return canvas;
  } finally {
    element.classList.remove("is-exporting");
  }
}

/**
 * Downloads canvas as PNG or JPEG image
 */
export function downloadCanvasAsImage(
  canvas: HTMLCanvasElement,
  filename: string,
  format: "png" | "jpeg" = "png",
  quality = 0.95
) {
  const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
  const dataUrl = canvas.toDataURL(mimeType, quality);

  const cleanExt = filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`;
  const link = document.createElement("a");
  link.download = cleanExt;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copies the rendered card canvas directly to the system clipboard
 */
export async function copyCardToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        resolve(true);
      } catch (err) {
        console.warn("Clipboard write failed:", err);
        resolve(false);
      }
    }, "image/png");
  });
}

/**
 * Sends rendered card to browser native print dialog with high resolution
 */
export function printCardDirectly(canvas: HTMLCanvasElement, title: string) {
  const dataUrl = canvas.toDataURL("image/png", 1.0);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print - ${title}</title>
        <style>
          @page {
            margin: 10mm;
            size: auto;
          }
          body {
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            min-height: 100vh;
          }
          img {
            max-width: 100%;
            max-height: 96vh;
            object-fit: contain;
            display: block;
            margin: 0 auto;
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="${title}" />
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Exports card to PDF with selectable page size, margins, and cut lines
 */
export function exportCardToPdf(
  canvas: HTMLCanvasElement,
  filename: string,
  config: {
    pageSize: "fit" | "letter" | "a4" | "photo";
    orientation: "auto" | "portrait" | "landscape";
    addCutGuides?: boolean;
    title?: string;
    cardWidth: number;
    cardHeight: number;
  }
) {
  const imgData = canvas.toDataURL("image/jpeg", 0.98);
  const { pageSize, addCutGuides, title = "Bingo Card", cardWidth, cardHeight } = config;

  let orientation: "portrait" | "landscape" =
    config.orientation === "auto"
      ? cardWidth >= cardHeight
        ? "landscape"
        : "portrait"
      : config.orientation;

  let pdf: jsPDF;

  if (pageSize === "fit") {
    // Exact card dimensions in px
    pdf = new jsPDF({
      orientation,
      unit: "px",
      format: [cardWidth, cardHeight],
    });
    pdf.addImage(imgData, "JPEG", 0, 0, cardWidth, cardHeight, undefined, "FAST");
  } else {
    // Standard paper formats with margin and centering
    // Letter: 612 x 792 pt | A4: 595.28 x 841.89 pt | Photo: 288 x 432 pt
    let pageWidthPt = 612;
    let pageHeightPt = 792;

    if (pageSize === "a4") {
      pageWidthPt = 595.28;
      pageHeightPt = 841.89;
    } else if (pageSize === "photo") {
      pageWidthPt = 288;
      pageHeightPt = 432;
    }

    // Adjust orientation of standard page
    if (orientation === "landscape" && pageHeightPt > pageWidthPt) {
      const tmp = pageWidthPt;
      pageWidthPt = pageHeightPt;
      pageHeightPt = tmp;
    }

    pdf = new jsPDF({
      orientation,
      unit: "pt",
      format: [pageWidthPt, pageHeightPt],
    });

    const margin = 28; // 28pt padding
    const printableWidth = pageWidthPt - margin * 2;
    const printableHeight = pageHeightPt - margin * 2 - (title ? 16 : 0);

    const cardAspect = cardWidth / cardHeight;
    let renderW = printableWidth;
    let renderH = renderW / cardAspect;

    if (renderH > printableHeight) {
      renderH = printableHeight;
      renderW = renderH * cardAspect;
    }

    const x = (pageWidthPt - renderW) / 2;
    const y = (pageHeightPt - renderH) / 2 + (title ? 8 : 0);

    // Subtle header
    if (title) {
      pdf.setFontSize(10);
      pdf.setTextColor(120, 120, 120);
      pdf.text(title, pageWidthPt / 2, y - 10, { align: "center" });
    }

    // Optional Cut Guides (crop marks around card corners)
    if (addCutGuides) {
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.setLineWidth(0.5);

      // Corner guides
      const guideLen = 12;
      // Top Left
      pdf.line(x - guideLen, y, x, y);
      pdf.line(x, y - guideLen, x, y);
      // Top Right
      pdf.line(x + renderW, y, x + renderW + guideLen, y);
      pdf.line(x + renderW, y - guideLen, x + renderW, y);
      // Bottom Left
      pdf.line(x - guideLen, y + renderH, x, y + renderH);
      pdf.line(x, y + renderH, x, y + renderH + guideLen);
      // Bottom Right
      pdf.line(x + renderW, y + renderH, x + renderW + guideLen, y + renderH);
      pdf.line(x + renderW, y + renderH, x + renderW, y + renderH + guideLen);

      pdf.setLineDashPattern([], 0); // reset
    }

    pdf.addImage(imgData, "JPEG", x, y, renderW, renderH, undefined, "FAST");
  }

  const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  pdf.save(cleanFilename);
}

/**
 * Exports card template as a portable JSON file
 */
export function exportCardAsJson(tab: TabData, filename: string) {
  const jsonString = JSON.stringify(tab, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const cleanFilename = filename.endsWith(".json") ? filename : `${filename}.json`;
  const link = document.createElement("a");
  link.href = url;
  link.download = cleanFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper to shuffle array preserving free spaces
 */
export function shuffleBingoCells(cells: BingoCell[]): BingoCell[] {
  const shuffled = [...cells];
  for (let i = shuffled.length - 1; i > 0; i--) {
    if (shuffled[i].isFree) continue;
    const j = Math.floor(Math.random() * (i + 1));
    if (shuffled[j].isFree) continue;
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generates a batch deck of randomized unique bingo cards,
 * exporting either as a multi-page PDF or a ZIP containing high-res PNG cards!
 */
export async function generateAndDownloadCardDeck(
  containerEl: HTMLElement,
  tab: TabData,
  count: number,
  format: "pdf" | "zip",
  baseFilename: string,
  onProgress?: (done: number, total: number, statusText: string) => void
): Promise<void> {
  // Find bingo grid item
  const bingoIndex = tab.items.findIndex((it) => it.type === "bingo");
  if (bingoIndex === -1) {
    throw new Error("No Bingo Grid item found on this card to generate a deck from.");
  }

  const originalBingoItem = tab.items[bingoIndex];
  const originalCells = originalBingoItem.bingoCells || [];

  if (originalCells.length === 0) {
    throw new Error("Bingo grid has no cells to randomize.");
  }

  onProgress?.(0, count, "Preparing deck generation...");

  let pdfDoc: jsPDF | null = null;
  const zip = format === "zip" ? new JSZip() : null;

  // Track cell DOM container
  for (let cardNum = 1; cardNum <= count; cardNum++) {
    onProgress?.(cardNum - 1, count, `Generating Card #${cardNum} of ${count}...`);

    // Shuffle cells
    const shuffledCells = shuffleBingoCells(originalCells);

    // Apply temporary shuffled cells to the DOM
    // We can directly find bingo cell text elements or dispatch update
    const cellElements = containerEl.querySelectorAll<HTMLElement>("[data-bingo-cell-id]");
    if (cellElements.length > 0) {
      shuffledCells.forEach((cell, idx) => {
        if (cellElements[idx]) {
          const textSpan = cellElements[idx].querySelector(".bingo-cell-text");
          if (textSpan) textSpan.textContent = cell.text;
        }
      });
    }

    // Wait a frame for DOM update
    await new Promise((r) => setTimeout(r, 40));

    // Capture card
    const cardCanvas = await captureCardToCanvas(containerEl, { scale: 2.5 });

    if (format === "pdf") {
      const isLandscape = tab.width >= tab.height;
      if (!pdfDoc) {
        pdfDoc = new jsPDF({
          orientation: isLandscape ? "landscape" : "portrait",
          unit: "pt",
          format: "letter",
        });
      } else {
        pdfDoc.addPage("letter", isLandscape ? "landscape" : "portrait");
      }

      const pageWidth = isLandscape ? 792 : 612;
      const pageHeight = isLandscape ? 612 : 792;
      const margin = 30;
      const printW = pageWidth - margin * 2;
      const printH = pageHeight - margin * 2 - 20;

      const aspect = tab.width / tab.height;
      let rW = printW;
      let rH = rW / aspect;
      if (rH > printH) {
        rH = printH;
        rW = rH * aspect;
      }
      const x = (pageWidth - rW) / 2;
      const y = (pageHeight - rH) / 2 + 10;

      // Header: "Card #X of Y"
      pdfDoc.setFontSize(10);
      pdfDoc.setTextColor(140, 140, 140);
      pdfDoc.text(`${tab.title} • Card #${cardNum} of ${count}`, pageWidth / 2, y - 8, {
        align: "center",
      });

      const imgData = cardCanvas.toDataURL("image/jpeg", 0.95);
      pdfDoc.addImage(imgData, "JPEG", x, y, rW, rH, undefined, "FAST");
    } else if (zip) {
      const dataUrl = cardCanvas.toDataURL("image/png");
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      zip.file(`${baseFilename}_card_${cardNum}.png`, base64Data, { base64: true });
    }
  }

  // Restore original cells on DOM
  const cellElements = containerEl.querySelectorAll<HTMLElement>("[data-bingo-cell-id]");
  if (cellElements.length > 0) {
    originalCells.forEach((cell, idx) => {
      if (cellElements[idx]) {
        const textSpan = cellElements[idx].querySelector(".bingo-cell-text");
        if (textSpan) textSpan.textContent = cell.text;
      }
    });
  }

  onProgress?.(count, count, "Packaging download file...");

  if (format === "pdf" && pdfDoc) {
    pdfDoc.save(`${baseFilename}_deck_${count}_cards.pdf`);
  } else if (zip) {
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = `${baseFilename}_deck_${count}_cards.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}

/**
 * Packages all current card tabs into a single ZIP archive
 */
export async function downloadAllTabsAsZip(
  tabs: TabData[],
  renderTabCanvas: (tab: TabData) => Promise<HTMLCanvasElement>,
  baseFilename = "bingo_tingo_cards",
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const total = tabs.length;

  for (let i = 0; i < total; i++) {
    onProgress?.(i + 1, total);
    const tab = tabs[i];
    const canvas = await renderTabCanvas(tab);
    const dataUrl = canvas.toDataURL("image/png");
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    const safeTitle = tab.title.toLowerCase().replace(/[^a-z0-9]/g, "_") || `card_${i + 1}`;
    zip.file(`${safeTitle}.png`, base64Data, { base64: true });
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(zipBlob);
  link.download = `${baseFilename}_all_tabs.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
