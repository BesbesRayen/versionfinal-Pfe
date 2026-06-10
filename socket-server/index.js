/**
 * CreadiTn Socket.IO Real-time Server
 * Port: 3001
 *
 * Clients (mobile app / dashboard) connect via Socket.IO.
 * Backend (Spring Boot) posts events via HTTP POST /emit.
 *
 * Global events:
 *   - new-article     { article }
 *   - update-article  { article }
 *   - delete-article  { id }
 *
 * User-scoped events (room: "user:<userId>"):
 *   - kyc-update      { userId, status }
 *   - credit-update   { userId, creditLimit, walletBalance }
 *   - payment-due     { userId, amount, dueDate }
 *   - notification    { userId, message, type }
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const PORT = process.env.SOCKET_PORT ?? 3001;
// Secret shared with Spring Boot backend to authorise emit requests
const EMIT_SECRET = process.env.SOCKET_EMIT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const SOCKET_DEBUG = process.env.SOCKET_DEBUG === 'true';
const ALLOWED_ORIGINS = (process.env.SOCKET_ALLOWED_ORIGINS ?? 'http://localhost:3000,http://localhost:8083')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!EMIT_SECRET || !JWT_SECRET) {
  throw new Error('SOCKET_EMIT_SECRET and JWT_SECRET are required');
}

function debugLog(...parts) {
  if (!SOCKET_DEBUG) {
    return;
  }
  process.stdout.write(`${parts.join(' ')}\n`);
}

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

// ── Socket.IO connection ────────────────────────────────────────────────────

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!JWT_SECRET || !token) {
    next(new Error('Authentication required'));
    return;
  }

  try {
    const claims = jwt.verify(token, JWT_SECRET);
    if (!claims?.userId) {
      next(new Error('Invalid user token'));
      return;
    }
    socket.data.userId = String(claims.userId);
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  debugLog(`[socket] client connected: ${socket.id}`);
  const room = `user:${socket.data.userId}`;
  socket.join(room);
  socket.emit('sync-required', { reason: 'authenticated-user-room' });

  socket.on('join-user', (_ignoredUserId, acknowledge) => {
    if (typeof acknowledge === 'function') {
      acknowledge({ ok: true, room });
    }
  });

  socket.on('disconnect', () => {
    debugLog(`[socket] client disconnected: ${socket.id}`);
  });
});

// ── HTTP endpoint for Spring Boot to emit events ───────────────────────────

/**
 * POST /emit
 * Body: { secret, event, data }
 */
app.post('/emit', (req, res) => {
  const { secret, event, data } = req.body ?? {};

  if (!secret || secret !== EMIT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const allowedEvents = [
    // global article events
    'new-article', 'update-article', 'delete-article',
    // user-scoped events (require userId in data)
    'kyc-update', 'credit-update', 'payment-due', 'notification',
    'notification-read', 'notifications-read-all',
  ];
  if (!event || !allowedEvents.includes(event)) {
    return res.status(400).json({ error: 'Unknown event' });
  }

  const userScopedEvents = [
    'kyc-update', 'credit-update', 'payment-due', 'notification',
    'notification-read', 'notifications-read-all',
  ];
  if (userScopedEvents.includes(event)) {
    const userId = data?.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId required for user-scoped events' });
    }
    const room = `user:${userId}`;
    io.to(room).emit(event, data ?? {});
    debugLog(`[emit:user] room=${room} event=${event}`, JSON.stringify(data ?? {}).slice(0, 120));
  } else {
    io.emit(event, data ?? {});
    debugLog(`[emit:global] ${event}`, JSON.stringify(data ?? {}).slice(0, 120));
  }

  res.json({ ok: true, event, connectedClients: io.engine.clientsCount });
});

// ── Health check ─────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', clients: io.engine.clientsCount, uptime: process.uptime() });
});

// ─────────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  process.stdout.write(`[socket-server] listening on port ${PORT}\n`);
});
