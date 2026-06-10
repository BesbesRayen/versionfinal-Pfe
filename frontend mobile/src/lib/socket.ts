/**
 * Socket.IO client used by the mobile app for live article updates.
 */

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";

const deriveSocketUrl = () => {
  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.hostname}:3001`;
  } catch {
    return "http://localhost:3001";
  }
};

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? deriveSocketUrl();

export interface ArticleSocketEvent {
  id: number;
  productName: string;
  description: string;
  price: number;
  imageUrl: string;
  boutiqueName: string;
  category: string;
  active: boolean;
  sourceUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

let socketInstance: Socket | null = null;
let activeUserId: number | null = null;
let activeToken: string | null = null;
let coreListenersBound = false;
const syncListeners = new Set<(reason: string) => void>();

const notifySync = (reason: string) => {
  syncListeners.forEach((listener) => listener(reason));
};

const joinActiveUser = (socket: Socket) => {
  if (!activeUserId) return;
  socket.emit("join-user", activeUserId);
};

const bindCoreListeners = (socket: Socket) => {
  if (coreListenersBound) return;
  coreListenersBound = true;

  socket.on("connect", () => joinActiveUser(socket));
  socket.on("sync-required", () => notifySync("sync-required"));
  socket.on("kyc-update", () => notifySync("kyc-update"));
  socket.on("credit-update", () => notifySync("credit-update"));
  socket.on("payment-due", () => notifySync("payment-due"));
  socket.on("notification", () => notifySync("notification"));
  socket.on("notification-read", () => notifySync("notification-read"));
  socket.on("notifications-read-all", () => notifySync("notifications-read-all"));
};

const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 10000,
      autoConnect: false,
      auth: { token: activeToken },
    });
    bindCoreListeners(socketInstance);
  }

  return socketInstance;
};

export const subscribeToUserSync = (
  userId: number,
  token: string,
  listener: (reason: string) => void,
) => {
  const socket = getSocket();
  activeUserId = userId;
  activeToken = token;
  socket.auth = { token };
  syncListeners.add(listener);

  if (socket.connected) {
    joinActiveUser(socket);
  } else {
    socket.connect();
  }

  return () => {
    syncListeners.delete(listener);
    if (syncListeners.size === 0) {
      activeUserId = null;
      activeToken = null;
    }
  };
};

export const resumeRealtimeSocket = () => {
  const socket = getSocket();
  socket.auth = { token: activeToken };
  if (!socket.connected) {
    socket.connect();
    return;
  }
  joinActiveUser(socket);
};

export const disconnectRealtimeSocket = () => {
  activeUserId = null;
  activeToken = null;
  syncListeners.clear();
  socketInstance?.disconnect();
};

export const useArticleSocket = (initialArticles: ArticleSocketEvent[]) => {
  const [articles, setArticles] = useState<ArticleSocketEvent[]>(initialArticles);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    setArticles(initialArticles);
  }, [initialArticles]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onNew = (article: ArticleSocketEvent) => {
      if (!article?.active) return;
      setArticles((prev) => {
        if (prev.find((a) => a.id === article.id)) return prev;
        return [article, ...prev];
      });
    };

    const onUpdate = (article: ArticleSocketEvent) => {
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, ...article } : a)),
      );
    };

    const onDelete = (data: { id: number }) => {
      setArticles((prev) => prev.filter((a) => a.id !== data.id));
    };

    socket.on("new-article", onNew);
    socket.on("update-article", onUpdate);
    socket.on("delete-article", onDelete);

    return () => {
      socket.off("new-article", onNew);
      socket.off("update-article", onUpdate);
      socket.off("delete-article", onDelete);
    };
  }, []);

  return { articles };
};
