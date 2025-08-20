// server.ts (dev entry - runs with ts-node)
import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Expose socket.io to route handlers if you want to emit from API
declare global {
  // eslint-disable-next-line no-var
  var serverSocket: { io: Server | null } | undefined;
}
global.serverSocket = { io: null };

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));

  const io = new Server(server, {
    path: '/ws',
    cors: { origin: '*' },
  });

  io.use((socket, nextFn) => {
    // Replace with JWT validation
    const companyId =
      (socket.handshake.auth as any)?.companyId ??
      (socket.handshake.query as any)?.companyId;
    if (!companyId || typeof companyId !== 'string') {
      return nextFn(new Error('Unauthorized'));
    }
    (socket.data as any).companyId = companyId;
    nextFn();
  });

  io.on('connection', (socket) => {
    const companyId = (socket.data as any).companyId as string;

    // Per-company room for list updates
    socket.join(`company:${companyId}`);

    socket.on('conversation:join', (conversationId: string) => {
      if (typeof conversationId === 'string') {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on('conversation:leave', (conversationId: string) => {
      if (typeof conversationId === 'string') {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    socket.on('typing', (payload: { conversationId: string; isTyping: boolean }) => {
      if (!payload?.conversationId) return;
      socket.to(`conversation:${payload.conversationId}`).emit('typing', {
        conversationId: payload.conversationId,
        companyId,
        isTyping: !!payload.isTyping,
      });
    });

    socket.on('message:read', (payload: { conversationId: string; messageId: string }) => {
      if (!payload?.conversationId || !payload?.messageId) return;
      socket.to(`conversation:${payload.conversationId}`).emit('message:read', {
        conversationId: payload.conversationId,
        messageId: payload.messageId,
        companyId,
      });
    });
  });

  global.serverSocket!.io = io;

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  server.listen(port, () => {
    console.log(`> Dev server ready on http://localhost:${port}`);
    console.log(`> WebSocket at ws://localhost:${port}/ws`);
  });
});
