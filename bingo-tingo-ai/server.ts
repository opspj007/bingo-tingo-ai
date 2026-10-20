import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { registerBingoRoomRoutes, setupBingoWebSocket } from "./server/bingoRooms";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Register 2-Player Multiplayer Bingo Room API routes
registerBingoRoomRoutes(app);

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", aiEnabled: Boolean(process.env.GEMINI_API_KEY) });
});

// Generate complete Bingo card data with Gemini AI
app.post("/api/generate-bingo", async (req, res) => {
  try {
    const { topic = "Weekend Fun", gridSize = 4, style = "colorful", audience = "friends" } = req.body;
    const ai = getGeminiClient();

    const totalCells = gridSize * gridSize;

    if (!ai) {
      // High-quality offline fallback if no API key is set
      const fallbackCells = Array.from({ length: totalCells }, (_, i) => {
        if (gridSize % 2 === 1 && i === Math.floor(totalCells / 2)) {
          return { text: "FREE SPACE ★", emoji: "⭐", isFree: true };
        }
        const funItems = [
          { text: "Drank 2L Water", emoji: "💧" },
          { text: "Watched a Movie", emoji: "🍿" },
          { text: "Took a Long Walk", emoji: "👟" },
          { text: "Baked Sweet Treats", emoji: "🧁" },
          { text: "Read 20 Pages", emoji: "📖" },
          { text: "Learned Something New", emoji: "🧠" },
          { text: "Called Old Friend", emoji: "📞" },
          { text: "Slept 8+ Hours", emoji: "😴" },
          { text: "Tidied the Room", emoji: "✨" },
          { text: "Listened to Favorite Album", emoji: "🎵" },
          { text: "Cooked New Recipe", emoji: "🍳" },
          { text: "Solved a Puzzle", emoji: "🧩" },
          { text: "Made Someone Laugh", emoji: "😂" },
          { text: "Went Stargazing", emoji: "🌌" },
          { text: "Zero Social Media for 2h", emoji: "📵" },
          { text: "Planted or Watered Flowers", emoji: "🌱" },
          { text: "Danced to Music", emoji: "💃" },
          { text: "Took Sunset Photo", emoji: "📸" },
          { text: "Tried Bubble Tea", emoji: "🧋" },
          { text: "Won a Game", emoji: "🏆" },
          { text: "Did Morning Yoga", emoji: "🧘" },
          { text: "Cleaned Desktop", emoji: "💻" },
          { text: "Wrote in Journal", emoji: "✍️" },
          { text: "Spontaneous Roadtrip", emoji: "🚗" },
          { text: "Watched Fireworks", emoji: "🎆" }
        ];
        return funItems[i % funItems.length];
      });

      return res.json({
        title: `${topic.toUpperCase()} BINGO`,
        subtitle: `Bingo Tingo Challenge for ${audience}`,
        gridSize,
        colors: {
          background: "#fdf8ee",
          containerBg: "#ffffff",
          borderColor: "#d1a61a",
          borderRightColor: "#ef07d0",
          borderBottomColor: "#0726ef",
          borderLeftColor: "#efb507",
          cellBg: "#fef3c7",
          cellTextColor: "#78350f",
          accentColor: "#f59e0b",
        },
        cells: fallbackCells,
        aiGenerated: false,
      });
    }

    const prompt = `Create a fun, creative, engaging ${gridSize}x${gridSize} Bingo Card game about the topic: "${topic}".
Target audience: ${audience}.
Style tone: ${style}.
You must provide exactly ${totalCells} cell items.
If gridSize is odd (like 3 or 5), the exact center cell should be a FREE SPACE with an emoji.
Each cell item must have a short punchy action/phrase (2-4 words max) and a matching emoji.
Also provide a catchy Title, Subtitle, and recommended hex color palette (background, containerBg, border colors, cellBg, cellTextColor, accentColor).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            colors: {
              type: Type.OBJECT,
              properties: {
                background: { type: Type.STRING },
                containerBg: { type: Type.STRING },
                borderColor: { type: Type.STRING },
                borderRightColor: { type: Type.STRING },
                borderBottomColor: { type: Type.STRING },
                borderLeftColor: { type: Type.STRING },
                cellBg: { type: Type.STRING },
                cellTextColor: { type: Type.STRING },
                accentColor: { type: Type.STRING },
              },
              required: [
                "background",
                "containerBg",
                "borderColor",
                "borderRightColor",
                "borderBottomColor",
                "borderLeftColor",
                "cellBg",
                "cellTextColor",
                "accentColor",
              ],
            },
            cells: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  emoji: { type: Type.STRING },
                  isFree: { type: Type.BOOLEAN },
                },
                required: ["text", "emoji"],
              },
            },
          },
          required: ["title", "subtitle", "colors", "cells"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    // Ensure we have enough cells
    if (!parsed.cells || parsed.cells.length < totalCells) {
      const existing = parsed.cells || [];
      while (existing.length < totalCells) {
        existing.push({ text: `Tile ${existing.length + 1}`, emoji: "🎯", isFree: false });
      }
      parsed.cells = existing;
    }

    res.json({
      ...parsed,
      gridSize,
      aiGenerated: true,
    });
  } catch (error) {
    console.error("Bingo generation error, using fallback:", error);
    const totalCells = (req.body.gridSize || 4) * (req.body.gridSize || 4);
    const fallbackCells = Array.from({ length: totalCells }, (_, i) => {
      if (req.body.gridSize % 2 === 1 && i === Math.floor(totalCells / 2)) {
        return { text: "FREE SPACE ★", emoji: "⭐", isFree: true };
      }
      const funItems = [
        { text: "Drank 2L Water", emoji: "💧" },
        { text: "Watched a Movie", emoji: "🍿" },
        { text: "Took a Long Walk", emoji: "👟" },
        { text: "Baked Sweet Treats", emoji: "🧁" },
        { text: "Read 20 Pages", emoji: "📖" },
        { text: "Learned Something New", emoji: "🧠" },
        { text: "Called Old Friend", emoji: "📞" },
        { text: "Slept 8+ Hours", emoji: "😴" },
        { text: "Tidied the Room", emoji: "✨" },
        { text: "Listened to Music", emoji: "🎵" },
        { text: "Cooked New Recipe", emoji: "🍳" },
        { text: "Solved a Puzzle", emoji: "🧩" },
        { text: "Made Someone Laugh", emoji: "😂" },
        { text: "Went Stargazing", emoji: "🌌" },
        { text: "Zero Social Media 2h", emoji: "📵" },
        { text: "Watered Flowers", emoji: "🌱" }
      ];
      return funItems[i % funItems.length];
    });

    res.json({
      title: `${(req.body.topic || "Weekend").toUpperCase()} BINGO`,
      subtitle: `Bingo Tingo Challenge for ${req.body.audience || "Friends"}`,
      gridSize: req.body.gridSize || 4,
      colors: {
        background: "#fdf8ee",
        containerBg: "#ffffff",
        borderColor: "#d1a61a",
        borderRightColor: "#ef07d0",
        borderBottomColor: "#0726ef",
        borderLeftColor: "#efb507",
        cellBg: "#fef3c7",
        cellTextColor: "#78350f",
        accentColor: "#f59e0b",
      },
      cells: fallbackCells,
      aiGenerated: false,
    });
  }
});

// AI Template & Design Generator
app.post("/api/generate-template", async (req, res) => {
  try {
    const { prompt: userPrompt, templateType = "Mahashankh-Template" } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        title: "MAHASHANKH DESIGN",
        subtitle: "Created with Bingo Tingo AI Editor",
        items: [
          { text: "Special Announcement", type: "title", size: 32, color: "#1e3a8a" },
          { text: "Catchy subtitle detailing your event or promotion", type: "subtitle", size: 20, color: "#db2777" },
          { text: "Scan QR Code or Click Link Below", type: "badge", size: 16, color: "#059669" },
        ],
        colors: {
          background: "#0f172a",
          containerBg: "#10b981",
          borderColor: "#d1a61a",
          borderRightColor: "#ef07d0",
          borderBottomColor: "#0726ef",
          borderLeftColor: "#efb507",
        },
        aiGenerated: false,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `You are a graphic designer creating a layout for a "${templateType}" based on user idea: "${userPrompt}".
Return a JSON configuration with:
- title: catchy main title
- subtitle: supportive secondary text
- tags: 3 short highlight words or emojis
- items: array of 2 to 4 design elements to place on the template (each with text, suggestedType ['text','badge','quote'], color hex, size in px)
- colors: palette with background, containerBg, borderColor, borderRightColor, borderBottomColor, borderLeftColor.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  suggestedType: { type: Type.STRING },
                  color: { type: Type.STRING },
                  size: { type: Type.NUMBER },
                },
                required: ["text", "color", "size"],
              },
            },
            colors: {
              type: Type.OBJECT,
              properties: {
                background: { type: Type.STRING },
                containerBg: { type: Type.STRING },
                borderColor: { type: Type.STRING },
                borderRightColor: { type: Type.STRING },
                borderBottomColor: { type: Type.STRING },
                borderLeftColor: { type: Type.STRING },
              },
              required: ["background", "containerBg", "borderColor", "borderRightColor", "borderBottomColor", "borderLeftColor"],
            },
          },
          required: ["title", "subtitle", "items", "colors"],
        },
      },
    });

    res.json({
      ...JSON.parse(response.text || "{}"),
      aiGenerated: true,
    });
  } catch (error) {
    console.error("Template generation error, using fallback:", error);
    res.json({
      title: (req.body.prompt || "Mahashankh Design").toUpperCase().slice(0, 30),
      subtitle: "Created with Bingo Tingo AI Editor",
      items: [
        { text: "Special Feature", color: "#1e3a8a", size: 28 },
        { text: "Explore exciting challenges & designs", color: "#db2777", size: 18 },
        { text: "★ Limited Edition ★", color: "#059669", size: 14 }
      ],
      colors: {
        background: "#0f172a",
        containerBg: "#fef08a",
        borderColor: "#d1a61a",
        borderRightColor: "#ef07d0",
        borderBottomColor: "#0726ef",
        borderLeftColor: "#efb507",
      },
      aiGenerated: false,
    });
  }
});

// AI Text Polish & Effect Recommender
app.post("/api/ai-enhance-text", async (req, res) => {
  try {
    const { text, tone = "catchy" } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        variations: [
          `✨ ${text} (VIP Edition)`,
          `💥 SUPER ${text.toUpperCase()}`,
          `🎯 ${text} - Limited Time`,
        ],
        suggestedEffect: "neon-glow",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Given this text: "${text}", produce 4 creative ${tone} variations for a social graphic/bingo banner and pick the best visual effect from: [neon-glow, glitch, holographic, wavy-text, text-shadow, tilt, 3d-flip, shake, wave, ink-spill].`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            variations: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedEffect: { type: Type.STRING },
          },
          required: ["variations", "suggestedEffect"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.error("Enhance text error:", error);
    res.status(500).json({ error: "Failed to enhance text" });
  }
});

async function startServer() {
  const httpServer = http.createServer(app);

  // Attach WebSocket server for real-time 2-player Bingo rooms
  setupBingoWebSocket(httpServer);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Bingo Tingo AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
