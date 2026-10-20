import React from "react";
import { useAuth } from "../../context/AuthContext";
import { NotificationItem } from "../../types/multiplayer";
import { X, Bell, Gamepad2, UserPlus, Trophy, CheckCheck, Trash2, ArrowRight } from "lucide-react";

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptGameInvite: (pairCode: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onAcceptGameInvite,
}) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[85vh] bg-stone-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-stone-100">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide text-amber-400 font-mono uppercase">
                Notifications
              </h2>
              <p className="text-[10px] text-stone-400 font-mono">
                {notifications.filter((n) => !n.read).length} Unread Updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono flex items-center gap-1 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-stone-500 font-mono text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => {
              const isInvite = n.type === "game_invite";
              const isFriend = n.type === "friend_request";
              const isMatch = n.type === "match_result";

              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    !n.read
                      ? "bg-amber-950/25 border-amber-500/40 shadow-sm"
                      : "bg-stone-950/60 border-stone-800/80 opacity-80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm ${
                        isInvite
                          ? "bg-amber-500 text-stone-950"
                          : isFriend
                          ? "bg-indigo-500 text-stone-950"
                          : "bg-emerald-500 text-stone-950"
                      }`}
                    >
                      {isInvite ? (
                        <Gamepad2 className="w-4 h-4" />
                      ) : isFriend ? (
                        <UserPlus className="w-4 h-4" />
                      ) : (
                        <Trophy className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs text-stone-200 font-mono">
                          {n.title}
                        </h3>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 mt-1 font-sans">
                        {n.message}
                      </p>

                      {/* Game Invitation Actions */}
                      {isInvite && n.data?.pairCode && (
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              markNotificationRead(n.id);
                              onAcceptGameInvite(n.data!.pairCode!);
                              onClose();
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs font-mono shadow transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>ACCEPT & JOIN</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => markNotificationRead(n.id)}
                            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs font-mono transition-colors"
                          >
                            Decline
                          </button>
                          <span className="text-[10px] text-stone-500 font-mono ml-auto">
                            Code: {n.data.pairCode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
