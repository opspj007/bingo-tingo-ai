import { TemplatePreset } from "../types";

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  { id: "mahashankh-template", name: "Mahashankh / Bingo Tingo (809x500)", width: 809, height: 500, category: "bingo" },
  { id: "youtube-thumbnail", name: "YouTube Thumbnail (1280x720)", width: 1280, height: 720, category: "social" },
  { id: "instagram-post", name: "Instagram Post (1080x1080)", width: 1080, height: 1080, category: "social" },
  { id: "instagram-story", name: "Instagram Story (1080x1920)", width: 1080, height: 1920, category: "social" },
  { id: "tiktok-video", name: "TikTok Video (1080x1920)", width: 1080, height: 1920, category: "social" },
  { id: "facebook-cover", name: "Facebook Cover (820x312)", width: 820, height: 312, category: "social" },
  { id: "facebook-dp", name: "Facebook DP (180x180)", width: 180, height: 180, category: "profile" },
  { id: "whatsapp-cover", name: "WhatsApp Cover (1920x1080)", width: 1920, height: 1080, category: "social" },
  { id: "whatsapp-dp", name: "WhatsApp DP (500x500)", width: 500, height: 500, category: "profile" },
  { id: "twitter-cover", name: "Twitter Cover (1500x500)", width: 1500, height: 500, category: "social" },
  { id: "twitter-dp", name: "Twitter DP (400x400)", width: 400, height: 400, category: "profile" },
  { id: "linkedin-cover", name: "LinkedIn Cover (1584x396)", width: 1584, height: 396, category: "social" },
  { id: "linkedin-dp", name: "LinkedIn DP (400x400)", width: 400, height: 400, category: "profile" },
  { id: "logo", name: "Logo (500x500)", width: 500, height: 500, category: "marketing" },
  { id: "banner", name: "Banner (1200x300)", width: 1200, height: 300, category: "marketing" },
  { id: "poster", name: "Poster (800x1200)", width: 800, height: 1200, category: "marketing" },
  { id: "pinterest-pin", name: "Pinterest Pin (1000x1500)", width: 1000, height: 1500, category: "social" },
  { id: "tumblr-header", name: "Tumblr Header (3000x1055)", width: 3000, height: 1055, category: "social" },
  { id: "snapchat-ad", name: "Snapchat Ad (1080x1920)", width: 1080, height: 1920, category: "social" },
  { id: "reddit-banner", name: "Reddit Banner (1920x384)", width: 1920, height: 384, category: "social" },
  { id: "medium-profile", name: "Medium Profile (500x500)", width: 500, height: 500, category: "profile" },
  { id: "vimeo-thumbnail", name: "Vimeo Thumbnail (1280x720)", width: 1280, height: 720, category: "social" },
];

export const EFFECT_OPTIONS = [
  { value: "", label: "No Effect" },
  { value: "neon-glow", label: "Neon Glow" },
  { value: "holographic", label: "Holographic" },
  { value: "glitch", label: "Glitch" },
  { value: "ink-spill", label: "Ink Spill" },
  { value: "wave", label: "Wave Animation" },
  { value: "wavy-text", label: "Wavy Text" },
  { value: "shake", label: "Shake" },
  { value: "tilt", label: "Tilt" },
  { value: "flicker", label: "Flicker" },
  { value: "rotate-30", label: "Rotate 30°" },
  { value: "rotate-45", label: "Rotate 45°" },
  { value: "rotate-90", label: "Rotate 90°" },
  { value: "rotate-180", label: "Rotate 180°" },
  { value: "rotate-270", label: "Rotate 270°" },
  { value: "zoom-2d", label: "2D Zoom" },
  { value: "zoom-3d", label: "3D Zoom" },
  { value: "zoom-4d", label: "4D Zoom" },
  { value: "text-shadow", label: "Text Shadow" },
  { value: "glow", label: "Soft Glow" },
  { value: "blur", label: "Blur" },
  { value: "underline-animation", label: "Underline Hover" },
  { value: "flip-3d", label: "3D Flip" },
];

export const FONT_OPTIONS = [
  { value: "Arial", label: "Arial" },
  { value: "Outfit", label: "Outfit (Modern Bold)" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans" },
  { value: "Bungee", label: "Bungee (Gaming / Poster)" },
  { value: "Playfair Display", label: "Playfair (Elegant Serif)" },
  { value: "Space Mono", label: "Space Mono (Tech)" },
  { value: "Courier New", label: "Courier New" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Verdana", label: "Verdana" },
];

export const POPULAR_EMOJIS = [
  "😊", "🎉", "🔥", "⭐", "🏆", "💎", "🎯", "🚀", "💡", "🌈",
  "🍿", "🍕", "☕", "🎮", "🎵", "🎈", "✨", "❤️", "👍", "👑"
];

export const POPULAR_SYMBOLS = [
  "★", "✦", "✪", "➤", "▲", "◆", "✔", "✖", "✿", "❄",
  "❖", "✤", "✸", "➔", "⚡", "☀", "♠", "♣", "♥", "♦"
];

export interface EntranceAnimationOption {
  value: "none" | "fade-in" | "slide-up" | "bounce" | "zoom-in";
  label: string;
  description: string;
  iconName: string;
}

export const ENTRANCE_ANIMATION_OPTIONS: EntranceAnimationOption[] = [
  {
    value: "none",
    label: "None",
    description: "Static element, no entrance animation",
    iconName: "Ban",
  },
  {
    value: "fade-in",
    label: "Fade In",
    description: "Smooth opacity fade entrance",
    iconName: "Eye",
  },
  {
    value: "slide-up",
    label: "Slide Up",
    description: "Smooth glide from bottom upwards",
    iconName: "ArrowUp",
  },
  {
    value: "bounce",
    label: "Bounce",
    description: "Playful spring overshoot bounce",
    iconName: "Sparkles",
  },
  {
    value: "zoom-in",
    label: "Zoom In",
    description: "Expands dynamically from center scale",
    iconName: "Maximize",
  },
];

