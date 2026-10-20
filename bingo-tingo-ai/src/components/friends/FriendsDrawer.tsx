import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Friend } from "../../types/multiplayer";
import {
  X,
  UserPlus,
  Search,
  MessageSquare,
  Gamepad2,
  Trash2,
  Check,
  Clock,
  Circle,
  Users,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface FriendsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (friend: Friend) => void;
  onInviteToPlay: (friend: Friend) => void;
}

export const FriendsDrawer: React.FC<FriendsDrawerProps> = ({
  isOpen,
  onClose,
  onOpenChat,
  onInviteToPlay,
}) => {
  const {
    friends,
    incomingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"friends" | "add" | "requests">("friends");
  const [searchUsername, setSearchUsername] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;

    setIsSending(true);
    setStatusMessage(null);
    const res = await sendFriendRequest(searchUsername.trim());
    setIsSending(false);

    if (res.success) {
      setStatusMessage({ type: "success", text: res.message });
      setSearchUsername("");
    } else {
      setStatusMessage({ type: "error", text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full bg-stone-900 border-l border-amber-500/40 shadow-2xl flex flex-col text-stone-100 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-amber-400 font-mono uppercase">
                Friends & Chat
              </h2>
              <p className="text-[11px] text-stone-400 font-mono">
                {friends.length} Friends • {friends.filter((f) => f.isOnline).length} Online
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 p-2 bg-stone-950/80 border-b border-stone-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setActiveTab("friends");
              setStatusMessage(null);
            }}
            className={`py-2 rounded-lg font-bold transition-all text-center ${
              activeTab === "friends"
                ? "bg-amber-500 text-stone-950 shadow"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("requests");
              setStatusMessage(null);
            }}
            className={`py-2 rounded-lg font-bold transition-all text-center relative ${
              activeTab === "requests"
                ? "bg-amber-500 text-stone-950 shadow"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Requests
            {incomingRequests.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black">
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("add");
              setStatusMessage(null);
            }}
            className={`py-2 rounded-lg font-bold transition-all text-center ${
              activeTab === "add"
                ? "bg-amber-500 text-stone-950 shadow"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            + Add Friend
          </button>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div
            className={`m-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
                : "bg-red-950/80 border-red-500/50 text-red-200"
            }`}
          >
            {statusMessage.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === "friends" && (
            friends.length === 0 ? (
              <div className="py-16 text-center text-stone-500 font-mono text-xs">
                <Users className="w-10 h-10 mx-auto mb-3 text-stone-600 opacity-50" />
                No friends added yet.
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("add")}
                    className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 rounded-xl font-bold transition-colors"
                  >
                    + Add a Friend Now
                  </button>
                </div>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.friendshipId}
                  className="p-3 bg-stone-950/70 border border-stone-800/90 rounded-2xl flex items-center justify-between gap-3 hover:border-amber-500/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700 flex items-center justify-center text-xl shadow">
                        {friend.avatar || "👤"}
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-stone-950 ${
                          friend.isOnline ? "bg-emerald-400 shadow-emerald-500/50 shadow-sm" : "bg-stone-600"
                        }`}
                        title={friend.isOnline ? "Online" : "Offline"}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-stone-100 font-mono flex items-center gap-1.5">
                        {friend.username}
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-black">
                          Lv.{friend.level}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400 font-mono">
                        {friend.isOnline ? (
                          <span className="text-emerald-400 font-semibold">● Online</span>
                        ) : (
                          <span>Offline</span>
                        )}
                        <span className="mx-1.5">•</span>
                        <span>{friend.score.toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenChat(friend)}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300 transition-colors"
                      title="Open Private Chat"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onInviteToPlay(friend)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs font-mono shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                      title="Invite to Bingo Duel"
                    >
                      <Gamepad2 className="w-3.5 h-3.5" />
                      <span>INVITE</span>
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === "requests" && (
            incomingRequests.length === 0 ? (
              <div className="py-16 text-center text-stone-500 font-mono text-xs">
                No pending friend requests.
              </div>
            ) : (
              incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 bg-stone-950 border border-stone-800 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-xl">
                      {req.avatar || "👤"}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-stone-100 font-mono">
                        {req.username}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        Level {req.level} • Wants to be your friend
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => acceptFriendRequest(req.id)}
                      className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold"
                      title="Accept Request"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectFriendRequest(req.id)}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-rose-950 hover:text-rose-300 text-stone-400"
                      title="Decline Request"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === "add" && (
            <div className="space-y-4">
              <form onSubmit={handleSendRequest} className="space-y-3">
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider font-mono">
                  Enter Player Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    placeholder="e.g. Rahul123 or PriyaGaming"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSending || !searchUsername.trim()}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow transition-all font-mono flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Send Friend Request</span>
                </button>
              </form>

              <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 text-xs text-stone-400 font-mono space-y-2">
                <div className="font-bold text-stone-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Try Adding Popular Players:
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Rahul123", "PriyaGaming", "Amit45"].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setSearchUsername(u)}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-amber-500/20 hover:text-amber-300 border border-stone-700 text-stone-300 text-[11px] transition-colors"
                    >
                      +{u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
