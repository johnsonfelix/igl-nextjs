// server.js (prod entry - runs with node)
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

global.serverSocket = { io: null };

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));

  const io = new Server(server, {
    path: '/ws',
    cors: { origin: '*' },
  });

  io.use((socket, nextFn) => {
    const companyId =
      socket.handshake.auth?.companyId ?? socket.handshake.query?.companyId;
    if (!companyId || typeof companyId !== 'string') {
      return nextFn(new Error('Unauthorized'));
    }
    socket.data.companyId = companyId;
    nextFn();
  });

  io.on('connection', (socket) => {
    const companyId = socket.data.companyId;

    socket.join(`company:${companyId}`);

    socket.on('conversation:join', (conversationId) => {
      if (typeof conversationId === 'string') {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on('conversation:leave', (conversationId) => {
      if (typeof conversationId === 'string') {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    socket.on('typing', (payload) => {
      if (!payload?.conversationId) return;
      socket.to(`conversation:${payload.conversationId}`).emit('typing', {
        conversationId: payload.conversationId,
        companyId,
        isTyping: !!payload.isTyping,
      });
    });

    socket.on('message:read', (payload) => {
      if (!payload?.conversationId || !payload?.messageId) return;
      socket.to(`conversation:${payload.conversationId}`).emit('message:read', {
        conversationId: payload.conversationId,
        messageId: payload.messageId,
        companyId,
      });
    });
  });

  global.serverSocket.io = io;

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  server.listen(port, () => {
    console.log(`> Prod server ready on http://localhost:${port}`);
    console.log(`> WebSocket at ws://localhost:${port}/ws`);
  });
});
