import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { X, Lock, User, Sparkles, Check, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

const AVATAR_PRESETS = ["⚡", "🔥", "👑", "⭐", "🎯", "💎", "🦁", "🚀", "🦊", "🐉"];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = "register",
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("⚡");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    if (!cleanUser) {
      setError("Please enter a username.");
      return;
    }
    if (cleanUser.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (mode === "register") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsSubmitting(true);

    if (mode === "register") {
      const res = await register(cleanUser, password, selectedAvatar);
      setIsSubmitting(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Registration failed.");
      }
    } else {
      const res = await login(cleanUser, password);
      setIsSubmitting(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Login failed. Check your credentials.");
      }
    }
  };

  const handleQuickDemo = async (demoUser: string) => {
    setError(null);
    setIsSubmitting(true);
    const res = await login(demoUser, "bingo123");
    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || "Demo login failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-stone-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden text-stone-100 p-6 md:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 font-black text-2xl shadow-lg shadow-amber-500/20 mb-3">
            ★
          </div>
          <h2 className="text-2xl font-black tracking-wider text-amber-400 font-serif uppercase">
            BINGO TINGO
          </h2>
          <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest font-mono">
            {mode === "register" ? "Create Player Account" : "Welcome Back Player"}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 bg-stone-950/80 rounded-xl border border-stone-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              mode === "register"
                ? "bg-amber-500 text-stone-950 shadow-md font-extrabold"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              mode === "login"
                ? "bg-amber-500 text-stone-950 shadow-md font-extrabold"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Login
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar selector for registration */}
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                Choose Player Avatar
              </label>
              <div className="flex items-center justify-between gap-1 p-2 bg-stone-950 rounded-xl border border-stone-800">
                {AVATAR_PRESETS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                      selectedAvatar === av
                        ? "bg-amber-500 text-stone-950 scale-110 shadow-md"
                        : "hover:bg-stone-800 text-stone-300"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. omvictus"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                required
                autoComplete={mode === "register" ? "new-password" : "current-password"}
              />
            </div>
          </div>

          {/* Confirm Password (Register only) */}
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 mt-2 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Connecting...</span>
            ) : mode === "register" ? (
              <>
                <span>CREATE ACCOUNT</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>LOGIN</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Testing Demo Profiles */}
        <div className="mt-6 pt-5 border-t border-stone-800/80">
          <div className="text-center mb-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400">
              ⚡ Quick Test with Sample Accounts:
            </span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("Rahul123")}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs rounded-lg font-mono border border-stone-700 transition-colors"
            >
              🔥 Rahul123 (Lv.14)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("PriyaGaming")}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs rounded-lg font-mono border border-stone-700 transition-colors"
            >
              ⭐ PriyaGaming (Lv.11)
            </button>
          </div>
        </div>

        {/* Footer Toggle text */}
        <div className="mt-4 text-center">
          {mode === "register" ? (
            <p className="text-xs text-stone-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="text-amber-400 font-bold hover:underline"
              >
                LOGIN
              </button>
            </p>
          ) : (
            <p className="text-xs text-stone-400">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className="text-amber-400 font-bold hover:underline"
              >
                CREATE ACCOUNT
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
