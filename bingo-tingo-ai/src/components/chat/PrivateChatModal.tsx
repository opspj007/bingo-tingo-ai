import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Friend, ChatMessage } from "../../types/multiplayer";
import { X, Send, Gamepad2, Smile, Sparkles } from "lucide-react";
import { playSoundEffect } from "../../utils/audioEffects";

interface PrivateChatModalProps {
  isOpen: boolean;
  friend: Friend | null;
  onClose: () => void;
  onInviteToPlay: (friend: Friend) => void;
}

const QUICK_EMOJIS = ["🎉", "🔥", "👑", "🎯", "👏", "😂", "😎", "⭐", "⚡", "❤️"];

export const PrivateChatModal: React.FC<PrivateChatModalProps> = ({
  isOpen,
  friend,
  onClose,
  onInviteToPlay,
}) => {
  const { currentUser, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!friend || !token) return;
    try {
      const res = await fetch(`/api/chat/${friend.friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error("Failed to load chat messages", e);
    }
  };

  useEffect(() => {
    if (isOpen && friend) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, friend, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen || !friend || !currentUser) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text || isSending || !token) return;

    setIsSending(true);
    setInputText("");
    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          friendId: friend.friendId,
          text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
          playSoundEffect("click");
        }
      }
    } catch (e) {
      console.error("Error sending message", e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg h-[560px] bg-stone-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-stone-100">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700 flex items-center justify-center text-xl shadow">
                {friend.avatar || "👤"}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-stone-950 ${
                  friend.isOnline ? "bg-emerald-400" : "bg-stone-600"
                }`}
              />
            </div>
            <div>
              <div className="font-bold text-sm text-stone-100 font-mono flex items-center gap-2">
                {friend.username}
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-black">
                  Lv.{friend.level}
                </span>
              </div>
              <div className="text-[11px] text-stone-400 font-mono">
                {friend.isOnline ? "Online Now" : "Last seen recently"}
              </div>
            </div>
          </div>

          {/* Quick Invite & Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onInviteToPlay(friend)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs font-mono shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>INVITE</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-950/40">
          {messages.length === 0 ? (
            <div className="py-20 text-center text-stone-500 font-mono text-xs">
              No messages yet. Say hello or invite {friend.username} to a match!
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId === currentUser.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm font-sans break-words ${
                      isMine
                        ? "bg-amber-500 text-stone-950 rounded-br-none shadow-md font-medium"
                        : "bg-stone-800 text-stone-100 rounded-bl-none border border-stone-700/80"
                    }`}
                  >
                    {m.message}
                  </div>
                  <span className="text-[9px] text-stone-500 font-mono mt-1 px-1">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Emoji Bar */}
        <div className="px-3 py-1.5 bg-stone-950 border-t border-stone-800 flex items-center gap-1 overflow-x-auto">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSendMessage(emoji)}
              className="p-1.5 hover:bg-stone-800 rounded-lg text-base transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-stone-900 border-t border-stone-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${friend.username}...`}
            className="flex-1 px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition-all font-mono"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 rounded-xl transition-all shadow cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
