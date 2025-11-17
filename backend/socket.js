import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from './middleware/auth.js';

let ioInstance = null;

export function initSocket(server) {
  ioInstance = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Attach authenticated user (if any) from JWT provided in handshake auth
    try {
      const auth = socket.handshake && socket.handshake.auth;
      const token = auth && typeof auth.token === 'string' ? auth.token : null;

      if (token) {
        const decoded = verifyToken(token);
        if (decoded && decoded.userId) {
          socket.data.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
          };
        }
      }
    } catch (err) {
      console.error('Socket auth error:', err);
      socket.data.user = null;
    }

    socket.on('chat:join', (payload) => {
      try {
        const roomId = payload && (payload.roomId || payload.room || '').toString();
        if (!roomId) return;

        const isDmRoom = roomId.startsWith('dm:');
        if (isDmRoom) {
          const parts = roomId.split(':');
          if (parts.length !== 3 || !parts[1] || !parts[2]) {
            return; // invalid DM room shape
          }

          const [, userA, userB] = parts;
          const viewer = socket.data && socket.data.user;
          const viewerId = viewer && viewer.id;

          if (!viewerId || (viewerId !== userA && viewerId !== userB)) {
            // Unauthorized to join this DM room
            return;
          }
        }

        socket.join(roomId);
      } catch (err) {
        console.error('Socket join error:', err);
      }
    });

    socket.on('chat:leave', (payload) => {
      try {
        const roomId = payload && (payload.roomId || payload.room || '').toString();
        if (!roomId) return;
        socket.leave(roomId);
      } catch (err) {
        console.error('Socket leave error:', err);
      }
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}
