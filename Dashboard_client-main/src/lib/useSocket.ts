'use client';

/**
 * useSocket — connects to the Socket.IO server and joins the user's personal
 * room so that real-time events (KYC updates, credit changes, notifications)
 * are received only for the authenticated user.
 *
 * Usage:
 *   const { connected, lastEvent } = useSocket();
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

export interface SocketEvent {
  type: 'kyc-update' | 'credit-update' | 'payment-due' | 'notification' | 'notification-read' | 'notifications-read-all';
  data: Record<string, unknown>;
  receivedAt: number;
}

interface UseSocketReturn {
  connected: boolean;
  lastEvent: SocketEvent | null;
  reconnecting: boolean;
}

export function useSocket(userId: string | number | null | undefined, token: string | null): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [lastEvent, setLastEvent] = useState<SocketEvent | null>(null);

  useEffect(() => {
    // Only connect when we have a userId
    if (!userId || !token) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setReconnecting(false);
      socket.emit('join-user', String(userId));
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });
    socket.io.on('reconnect_attempt', () => setReconnecting(true));
    socket.io.on('reconnect', () => setReconnecting(false));
    socket.io.on('reconnect_failed', () => setReconnecting(false));

    const handleEvent = (type: SocketEvent['type']) => (data: Record<string, unknown>) => {
      setLastEvent({ type, data, receivedAt: Date.now() });
    };

    socket.on('kyc-update',    handleEvent('kyc-update'));
    socket.on('credit-update', handleEvent('credit-update'));
    socket.on('payment-due',   handleEvent('payment-due'));
    socket.on('notification',  handleEvent('notification'));
    socket.on('notification-read', handleEvent('notification-read'));
    socket.on('notifications-read-all', handleEvent('notifications-read-all'));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [userId, token]);

  return { connected, lastEvent, reconnecting };
}
