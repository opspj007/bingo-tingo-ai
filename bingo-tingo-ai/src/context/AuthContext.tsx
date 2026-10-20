import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { UserProfile, Friend, FriendRequest, NotificationItem, ChatMessage } from "../types/multiplayer";
import { playSoundEffect } from "../utils/audioEffects";

interface AuthContextType {
  currentUser: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  friends: Friend[];
  incomingRequests: FriendRequest[];
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  activeInvite: NotificationItem | null;
  login: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, pass: string, avatar?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateAvatar: (avatar: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  refreshFriends: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  sendFriendRequest: (targetUsername: string) => Promise<{ success: boolean; message: string }>;
  acceptFriendRequest: (friendshipId: string) => Promise<boolean>;
  rejectFriendRequest: (friendshipId: string) => Promise<boolean>;
  removeFriend: (friendId: string) => Promise<boolean>;
  markNotificationRead: (notifId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  inviteFriendToGame: (friendId: string, gridSize?: number, gameMode?: string) => Promise<{ success: boolean; pairCode?: string; error?: string }>;
  dismissActiveInvite: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("bingo_tingo_auth_token"));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeInvite, setActiveInvite] = useState<NotificationItem | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // Authenticated fetch helper
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return fetch(url, { ...options, headers });
    },
    [token]
  );

  // Refresh current user profile
  const refreshProfile = useCallback(async () => {
    if (!token) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await authFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        // Token expired or invalid
        localStorage.removeItem("bingo_tingo_auth_token");
        setToken(null);
        setCurrentUser(null);
      }
    } catch (e) {
      console.error("Failed to fetch current user profile", e);
    } finally {
      setIsLoading(false);
    }
  }, [token, authFetch]);

  // Refresh friends & friend requests
  const refreshFriends = useCallback(async () => {
    if (!token) {
      setFriends([]);
      setIncomingRequests([]);
      return;
    }
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        authFetch("/api/friends"),
        authFetch("/api/friends/requests"),
      ]);

      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriends(data.friends || []);
      }
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setIncomingRequests(data.incoming || []);
      }
    } catch (e) {
      console.error("Failed to refresh friends", e);
    }
  }, [token, authFetch]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      return;
    }
    try {
      const res = await authFetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const list: NotificationItem[] = data.notifications || [];
        setNotifications(list);

        // Check for active unread game invite
        const latestInvite = list.find((n) => n.type === "game_invite" && !n.read);
        if (latestInvite) {
          setActiveInvite(latestInvite);
        }
      }
    } catch (e) {
      console.error("Failed to refresh notifications", e);
    }
  }, [token, authFetch]);

  // Initial load
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // When user is authenticated, refresh friends & notifications
  useEffect(() => {
    if (currentUser) {
      refreshFriends();
      refreshNotifications();

      const interval = setInterval(() => {
        refreshFriends();
        refreshNotifications();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [currentUser, refreshFriends, refreshNotifications]);

  // Persistent User WebSocket for real-time notifications & invites
  useEffect(() => {
    if (!currentUser) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/bingo`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "USER_IDENTIFY",
          userId: currentUser.id,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "NOTIFICATION_RECEIVED") {
          const notif: NotificationItem = data.notification;
          setNotifications((prev) => [notif, ...prev]);

          if (notif.type === "game_invite") {
            setActiveInvite(notif);
            playSoundEffect("bingo-win");
          } else {
            playSoundEffect("ball-pop");
          }
        }
      } catch (e) {
        console.error("User WS message parse error", e);
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [currentUser]);

  // Login action
  const login = async (username: string, pass: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: pass }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || "Login failed" };
      }
      localStorage.setItem("bingo_tingo_auth_token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      playSoundEffect("celebration");
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    }
  };

  // Register action
  const register = async (username: string, pass: string, avatar: string = "⚡") => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: pass, avatar }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || "Registration failed" };
      }
      localStorage.setItem("bingo_tingo_auth_token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      playSoundEffect("celebration");
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem("bingo_tingo_auth_token");
    setToken(null);
    setCurrentUser(null);
    setFriends([]);
    setNotifications([]);
    setIncomingRequests([]);
    setActiveInvite(null);
  };

  // Update avatar
  const updateAvatar = async (avatar: string) => {
    try {
      const res = await authFetch("/api/auth/update-avatar", {
        method: "POST",
        body: JSON.stringify({ avatar }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Friend actions
  const sendFriendRequest = async (targetUsername: string) => {
    try {
      const res = await authFetch("/api/friends/request", {
        method: "POST",
        body: JSON.stringify({ targetUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || "Failed to send request" };
      }
      refreshFriends();
      return { success: true, message: data.message };
    } catch (e: any) {
      return { success: false, message: e.message || "Failed to send request" };
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      const res = await authFetch("/api/friends/accept", {
        method: "POST",
        body: JSON.stringify({ friendshipId }),
      });
      if (res.ok) {
        refreshFriends();
        playSoundEffect("ding");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    try {
      const res = await authFetch("/api/friends/reject", {
        method: "POST",
        body: JSON.stringify({ friendshipId }),
      });
      if (res.ok) {
        refreshFriends();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      const res = await authFetch("/api/friends/remove", {
        method: "POST",
        body: JSON.stringify({ friendId }),
      });
      if (res.ok) {
        refreshFriends();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Notification actions
  const markNotificationRead = async (notifId: string) => {
    try {
      await authFetch(`/api/notifications/read/${notifId}`, { method: "POST" });
      setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
      if (activeInvite?.id === notifId) {
        setActiveInvite(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await authFetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setActiveInvite(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Invite friend directly to game
  const inviteFriendToGame = async (friendId: string, gridSize: number = 5, gameMode: string = "battle") => {
    try {
      const res = await authFetch("/api/multiplayer/invite-friend", {
        method: "POST",
        body: JSON.stringify({ friendId, gridSize, gameMode }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to send invitation" };
      }
      return { success: true, pairCode: data.pairCode };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    }
  };

  const dismissActiveInvite = () => {
    if (activeInvite) {
      markNotificationRead(activeInvite.id);
    }
    setActiveInvite(null);
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isLoading,
        friends,
        incomingRequests,
        notifications,
        unreadNotificationsCount,
        activeInvite,
        login,
        register,
        logout,
        updateAvatar,
        refreshProfile,
        refreshFriends,
        refreshNotifications,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        markNotificationRead,
        markAllNotificationsRead,
        inviteFriendToGame,
        dismissActiveInvite,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
