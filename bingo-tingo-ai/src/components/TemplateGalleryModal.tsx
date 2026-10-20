import React, { useState, useEffect } from "react";
import { GalleryTemplate, TabData } from "../types";
import { PREMADE_GALLERY_TEMPLATES } from "../constants/galleryTemplates";
import {
  X,
  Search,
  Download,
  BookmarkPlus,
  Heart,
  Sparkles,
  Layers,
  Trash2,
  Check,
  Plus,
  Grid,
} from "lucide-react";

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkspace: TabData;
  onImportTemplate: (template: GalleryTemplate, asNewTab: boolean) => void;
}

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  isOpen,
  onClose,
  currentWorkspace,
  onImportTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<"browse" | "save">("browse");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<GalleryTemplate[]>([]);
  const [likedTemplates, setLikedTemplates] = useState<Record<string, boolean>>({});

  // Save form states
  const [saveTitle, setSaveTitle] = useState("");
  const [saveCategory, setSaveCategory] = useState<GalleryTemplate["category"]>("community");
  const [saveAuthor, setSaveAuthor] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [saveTags, setSaveTags] = useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");

  // Load community templates from localStorage
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = localStorage.getItem("bingo_tingo_community_templates");
      let communityList: GalleryTemplate[] = [];
      if (stored) {
        communityList = JSON.parse(stored);
      }
      setTemplates([...PREMADE_GALLERY_TEMPLATES, ...communityList]);

      const storedLikes = localStorage.getItem("bingo_tingo_template_likes");
      if (storedLikes) {
        setLikedTemplates(JSON.parse(storedLikes));
      }
    } catch (e) {
      setTemplates(PREMADE_GALLERY_TEMPLATES);
    }

    // Set default values for save form based on current workspace
    setSaveTitle(currentWorkspace.title || "My Custom Bingo Card");
    setSaveAuthor(localStorage.getItem("bingo_tingo_author_name") || "Creative Designer");
    setSaveDescription(`Custom designed bingo template with ${currentWorkspace.items.length} elements.`);
    setSaveTags("Bingo, Custom, Social");
    setSaveSuccessMessage("");
  }, [isOpen, currentWorkspace]);

  if (!isOpen) return null;

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "bingo", label: "Bingo Cards" },
    { id: "work", label: "Work & Teams" },
    { id: "games", label: "Retro & Gaming" },
    { id: "social", label: "Social & Events" },
    { id: "community", label: "My Saved & Community" },
  ];

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory =
      selectedCategory === "all" ||
      t.category === selectedCategory ||
      (selectedCategory === "community" && t.isCommunity);
    const matchesSearch =
      searchQuery.trim() === "" ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleToggleLike = (id: string) => {
    const isLiked = likedTemplates[id];
    const newLikes = { ...likedTemplates, [id]: !isLiked };
    setLikedTemplates(newLikes);
    localStorage.setItem("bingo_tingo_template_likes", JSON.stringify(newLikes));

    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, likes: t.likes + (isLiked ? -1 : 1) } : t))
    );
  };

  const handleSaveCurrentWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;

    localStorage.setItem("bingo_tingo_author_name", saveAuthor);

    const newTemplate: GalleryTemplate = {
      id: `comm-${Date.now()}`,
      title: saveTitle.trim(),
      category: saveCategory,
      author: saveAuthor.trim() || "Anonymous",
      description: saveDescription.trim() || "User-submitted community bingo design.",
      tags: saveTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      likes: 1,
      width: currentWorkspace.width,
      height: currentWorkspace.height,
      canvasBgColor: currentWorkspace.canvasBgColor,
      containerBgColor: currentWorkspace.containerBgColor,
      bgImageUrl: currentWorkspace.bgImageUrl,
      borderConfig: { ...currentWorkspace.borderConfig },
      items: JSON.parse(JSON.stringify(currentWorkspace.items)),
      isCommunity: true,
      createdAt: new Date().toLocaleDateString(),
    };

    try {
      const stored = localStorage.getItem("bingo_tingo_community_templates");
      const existing: GalleryTemplate[] = stored ? JSON.parse(stored) : [];
      const updated = [newTemplate, ...existing];
      localStorage.setItem("bingo_tingo_community_templates", JSON.stringify(updated));

      setTemplates([newTemplate, ...templates]);
      setSaveSuccessMessage("Template successfully saved to your Gallery!");
      setTimeout(() => {
        setActiveTab("browse");
        setSelectedCategory("community");
      }, 1200);
    } catch (err) {
      console.error("Failed to save template", err);
    }
  };

  const handleDeleteCommunityTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this saved template from your gallery?")) return;

    try {
      const stored = localStorage.getItem("bingo_tingo_community_templates");
      if (stored) {
        const existing: GalleryTemplate[] = JSON.parse(stored);
        const updated = existing.filter((t) => t.id !== id);
        localStorage.setItem("bingo_tingo_community_templates", JSON.stringify(updated));
      }
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Delete template error", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-stone-900 border border-amber-200 dark:border-stone-700 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 border-b border-gray-200 dark:border-stone-800 flex items-center justify-between bg-amber-50/70 dark:bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-md">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-amber-950 dark:text-amber-100 flex items-center gap-2">
                <span>Template & Community Gallery</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                  {templates.length} Designs
                </span>
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Browse pre-made bingo games, community designs, or save and share your current template
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Navigation Tabs */}
            <div className="flex bg-amber-100/70 dark:bg-stone-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab("browse")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "browse"
                    ? "bg-amber-800 text-white shadow-sm"
                    : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Browse Gallery
              </button>
              <button
                onClick={() => setActiveTab("save")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "save"
                    ? "bg-amber-800 text-white shadow-sm"
                    : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
                }`}
              >
                <BookmarkPlus className="w-3.5 h-3.5" /> Save Current Design
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === "browse" ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search & Category Filter Toolbar */}
            <div className="p-4 border-b border-gray-100 dark:border-stone-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-stone-900">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search templates, tags, creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-stone-700 dark:bg-stone-800 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-amber-800 text-white shadow-xs"
                        : "bg-gray-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-stone-700"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Grid View */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 bg-stone-50/50 dark:bg-stone-950/40">
              {filteredTemplates.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-stone-400">
                  <Grid className="w-12 h-12 mb-3 stroke-1 text-stone-300 dark:text-stone-600" />
                  <p className="font-semibold text-sm">No templates matched your search</p>
                  <p className="text-xs mt-1 text-stone-400">
                    Try different keywords or check out the &quot;Save Current Design&quot; tab to add your own!
                  </p>
                </div>
              ) : (
                filteredTemplates.map((tpl) => {
                  const isLiked = likedTemplates[tpl.id];
                  const bingoItem = tpl.items.find((i) => i.type === "bingo");
                  const cellCount = bingoItem?.bingoCells?.length || 16;
                  const gridSize = bingoItem?.bingoGridSize || 4;

                  return (
                    <div
                      key={tpl.id}
                      className="group bg-white dark:bg-stone-900 rounded-2xl border border-gray-200 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all flex flex-col overflow-hidden"
                    >
                      {/* Mini Visual Preview Canvas */}
                      <div
                        className="h-44 p-3 relative flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-stone-800 select-none"
                        style={{ backgroundColor: tpl.canvasBgColor }}
                      >
                        {/* Miniature Container */}
                        <div
                          className="w-full h-full rounded-lg shadow-md flex flex-col p-2 items-center justify-between text-center relative overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]"
                          style={{
                            backgroundColor: tpl.containerBgColor,
                            borderTop: `3px solid ${tpl.borderConfig.topColor}`,
                            borderRight: `4px solid ${tpl.borderConfig.rightColor}`,
                            borderBottom: `4px solid ${tpl.borderConfig.bottomColor}`,
                            borderLeft: `4px solid ${tpl.borderConfig.leftColor}`,
                            borderRadius: `${tpl.borderConfig.borderRadius || 8}px`,
                          }}
                        >
                          {/* Mini Title */}
                          <div className="text-[10px] font-black tracking-wide text-stone-800 dark:text-stone-900 bg-white/80 px-2 py-0.5 rounded shadow-xs truncate max-w-[90%]">
                            {tpl.title}
                          </div>

                          {/* Mini Grid representation */}
                          <div
                            className="w-full max-w-[200px] grid gap-1 my-1 p-1 rounded bg-white/70 shadow-xs"
                            style={{
                              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                            }}
                          >
                            {Array.from({ length: Math.min(gridSize * gridSize, 16) }).map((_, idx) => (
                              <div
                                key={idx}
                                className={`h-3 rounded-xs text-[8px] flex items-center justify-center font-bold ${
                                  idx % 3 === 0
                                    ? "bg-amber-400 text-amber-950"
                                    : "bg-stone-200 text-stone-600"
                                }`}
                              >
                                {idx === Math.floor(cellCount / 2) ? "★" : ""}
                              </div>
                            ))}
                          </div>

                          {/* Mini Specs Pill */}
                          <div className="flex items-center gap-2 text-[9px] text-stone-700 bg-white/90 px-2 py-0.5 rounded-full font-mono font-medium">
                            <span>
                              {tpl.width}×{tpl.height}px
                            </span>
                            <span>•</span>
                            <span>{gridSize}×{gridSize} Grid</span>
                          </div>
                        </div>

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          {tpl.isCommunity ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                              My Saved
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white shadow-xs">
                              Pre-Made
                            </span>
                          )}
                        </div>

                        {/* Delete button if user-saved */}
                        {tpl.isCommunity && (
                          <button
                            onClick={(e) => handleDeleteCommunityTemplate(tpl.id, e)}
                            title="Delete Saved Template"
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Card Info & Meta */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                              {tpl.title}
                            </h3>
                            <button
                              onClick={() => handleToggleLike(tpl.id)}
                              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                                isLiked
                                  ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50"
                                  : "bg-gray-100 dark:bg-stone-800 text-stone-500 hover:text-rose-500"
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                              <span>{tpl.likes}</span>
                            </button>
                          </div>

                          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                            by <span className="font-semibold text-stone-700 dark:text-stone-300">{tpl.author}</span>
                          </div>

                          <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                            {tpl.description}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {tpl.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons: Import to Current vs Open as New Tab */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-stone-800">
                          <button
                            onClick={() => {
                              onImportTemplate(tpl, false);
                              onClose();
                            }}
                            className="py-1.5 px-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                            title="Replace contents of active tab with this design"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Import</span>
                          </button>
                          <button
                            onClick={() => {
                              onImportTemplate(tpl, true);
                              onClose();
                            }}
                            className="py-1.5 px-2 bg-amber-100 hover:bg-amber-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            title="Open this template in a fresh workspace tab"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>New Tab</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Save Workspace to Gallery View */
          <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50 dark:bg-stone-950/40 flex items-center justify-center">
            <div className="w-full max-w-xl bg-white dark:bg-stone-900 p-6 rounded-2xl border border-gray-200 dark:border-stone-800 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400">
                  <BookmarkPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    Save Current Workspace to Gallery
                  </h3>
                  <p className="text-xs text-stone-500">
                    Capture your colors, multi-side borders, and bingo cells for quick reuse anytime.
                  </p>
                </div>
              </div>

              {saveSuccessMessage && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveCurrentWorkspace} className="flex flex-col gap-3.5 text-xs">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Template Title
                  </label>
                  <input
                    type="text"
                    required
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="e.g. Summer Beach Holiday Bingo"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-stone-700 dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Category
                    </label>
                    <select
                      value={saveCategory}
                      onChange={(e) => setSaveCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-stone-700 dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:border-amber-500 outline-none"
                    >
                      <option value="bingo">Bingo Card</option>
                      <option value="work">Work & Team</option>
                      <option value="games">Games & Retro</option>
                      <option value="social">Social & Media</option>
                      <option value="community">Community / Personal</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Author / Creator Name
                    </label>
                    <input
                      type="text"
                      value={saveAuthor}
                      onChange={(e) => setSaveAuthor(e.target.value)}
                      placeholder="e.g. Maya Lin"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-stone-700 dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    placeholder="Describe how to play, target audience, or theme..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-stone-700 dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={saveTags}
                    onChange={(e) => setSaveTags(e.target.value)}
                    placeholder="e.g. Travel, Summer, Scavenger, Fun"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-stone-700 dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:border-amber-500 outline-none"
                  />
                </div>

                {/* Live Stats Snapshot */}
                <div className="p-3 bg-amber-50/60 dark:bg-stone-800/60 rounded-xl border border-amber-200 dark:border-stone-700 flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-300">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-900 dark:text-amber-300">Dimensions:</span>
                    <span>
                      {currentWorkspace.width} × {currentWorkspace.height} px
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-900 dark:text-amber-300">Canvas Items:</span>
                    <span>{currentWorkspace.items.length} items</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: currentWorkspace.containerBgColor }} />
                    <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: currentWorkspace.borderConfig.topColor }} />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("browse")}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-gray-100 dark:hover:bg-stone-800 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold cursor-pointer transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    <span>Save to Gallery</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
