import React, { useState } from "react";
import { Sparkles, X, Wand2, RefreshCw, Layers, Check } from "lucide-react";

interface AIBingoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBingoData: (data: any) => void;
  onApplyTemplateData: (data: any) => void;
}

export const AIBingoModal: React.FC<AIBingoModalProps> = ({
  isOpen,
  onClose,
  onApplyBingoData,
  onApplyTemplateData,
}) => {
  const [activeTab, setActiveTab] = useState<"bingo" | "template" | "enhance">("bingo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bingo state
  const [topic, setTopic] = useState("Weekend Fun & Chill");
  const [gridSize, setGridSize] = useState<number>(4);
  const [audience, setAudience] = useState("Friends & Family");
  const [style, setStyle] = useState("Colorful & Playful");

  // Template state
  const [templatePrompt, setTemplatePrompt] = useState("Neon Music Festival Announcement with Retro Vibes");
  const [templateType, setTemplateType] = useState("Mahashankh-Template");

  // Text Enhance state
  const [rawText, setRawText] = useState("Special Bingo Night");
  const [enhancedVariants, setEnhancedVariants] = useState<string[]>([]);
  const [suggestedEffect, setSuggestedEffect] = useState<string>("");

  if (!isOpen) return null;

  const handleGenerateBingo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-bingo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, gridSize, audience, style }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      onApplyBingoData(data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to generate bingo card");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTemplate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: templatePrompt, templateType }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      onApplyTemplateData(data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to generate template");
    } finally {
      setLoading(false);
    }
  };

  const handleEnhanceText = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-enhance-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });
      if (!res.ok) throw new Error("Enhance text failed");
      const data = await res.json();
      setEnhancedVariants(data.variations || []);
      setSuggestedEffect(data.suggestedEffect || "neon-glow");
    } catch (err: any) {
      setError(err.message || "Failed to enhance text");
    } finally {
      setLoading(false);
    }
  };

  const topicPresets = [
    "Work From Home",
    "90s Retro Movie Night",
    "Weekend Coffee & Chill",
    "Birthday Party Scavenger",
    "Fitness & Self Care",
    "Coder Life & Bugs",
    "Travel & Roadtrip",
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border-2 border-amber-800 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-orange-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-1.5">
                Bingo Tingo AI Studio
              </h3>
              <p className="text-xs text-amber-200">
                Powered by Gemini AI for instant cards, layouts & designs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 bg-amber-50/50 p-1 gap-1">
          <button
            onClick={() => setActiveTab("bingo")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "bingo"
                ? "bg-amber-800 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-amber-100/50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Bingo Card
          </button>
          <button
            onClick={() => setActiveTab("template")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "template"
                ? "bg-amber-800 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-amber-100/50"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            AI Template Layout
          </button>
          <button
            onClick={() => setActiveTab("enhance")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "enhance"
                ? "bg-amber-800 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-amber-100/50"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            AI Text Polish
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto max-h-[70vh] flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {activeTab === "bingo" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Bingo Theme / Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. 90s Music, College Dorm Life, Roadtrip..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-amber-600 bg-white"
                />
                {/* Topic quick presets */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {topicPresets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTopic(p)}
                      className="px-2 py-0.5 rounded-full text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Grid Size
                  </label>
                  <select
                    value={gridSize}
                    onChange={(e) => setGridSize(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value={3}>3x3 (9 tiles - Quick Game)</option>
                    <option value={4}>4x4 (16 tiles - Standard)</option>
                    <option value={5}>5x5 (25 tiles - Classic with Free Space)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. Coworkers, Kids, Gamers"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Style Mood
                </label>
                <input
                  type="text"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="e.g. Energetic & Neon, Cozy Pastel, Retro Vintage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>

              <button
                onClick={handleGenerateBingo}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Crafting Bingo Magic...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Generate & Place Bingo Card
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === "template" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Design Idea / Prompt
                </label>
                <textarea
                  rows={3}
                  value={templatePrompt}
                  onChange={(e) => setTemplatePrompt(e.target.value)}
                  placeholder="Describe your graphic: 'Neon burger joint grand opening discount flyer with badge and bold headline'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-amber-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Target Template
                </label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="Mahashankh-Template">Mahashankh Template (809x500)</option>
                  <option value="youtube-thumbnail">YouTube Thumbnail (1280x720)</option>
                  <option value="instagram-post">Instagram Post (1080x1080)</option>
                  <option value="instagram-story">Instagram Story (1080x1920)</option>
                  <option value="poster">Poster (800x1200)</option>
                  <option value="banner">Banner (1200x300)</option>
                </select>
              </div>

              <button
                onClick={handleGenerateTemplate}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Designing Layout with Gemini...
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4 text-amber-300" />
                    Generate Complete Layout
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === "enhance" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Text to Enhance / Rewrite
                </label>
                <input
                  type="text"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="e.g. Big Summer Sale"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-amber-600 bg-white"
                />
              </div>

              <button
                onClick={handleEnhanceText}
                disabled={loading}
                className="w-full py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                Generate Catchy Variations
              </button>

              {enhancedVariants.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="text-xs font-bold text-gray-700">Suggested Variations:</div>
                  {enhancedVariants.map((v, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        onApplyBingoData({
                          title: v,
                          effect: suggestedEffect,
                        });
                        onClose();
                      }}
                      className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-100 hover:border-amber-400 cursor-pointer text-xs font-medium text-amber-950 flex items-center justify-between group transition-colors"
                    >
                      <span>{v}</span>
                      <span className="text-[10px] text-amber-700 font-bold group-hover:underline flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Use
                      </span>
                    </div>
                  ))}
                  {suggestedEffect && (
                    <div className="text-[11px] text-amber-800 mt-1 font-semibold">
                      Suggested visual effect: <span className="underline font-bold">{suggestedEffect}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
