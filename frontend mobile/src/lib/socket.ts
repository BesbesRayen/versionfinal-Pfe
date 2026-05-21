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

const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });
  }

  return socketInstance;
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
