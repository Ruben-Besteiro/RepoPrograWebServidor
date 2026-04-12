import { Server } from 'socket.io';
import { verifyToken } from '../utils/handleJwt.js';
import User from '../models/user.model.js';
import registerChatHandlers from './handlers/chat.handler.js';
import registerRoomHandlers from './handlers/room.handler.js';

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // En producción limitar al dominio real
      methods: ['GET', 'POST']
    }
  });

  // Middleware de autenticación para Socket.IO
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Autenticación fallida: Token no proporcionado'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Autenticación fallida: Token inválido'));
    }

    try {
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Autenticación fallida: Usuario no encontrado'));
      }
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Error en el servidor durante la autenticación'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`👤 Usuario conectado: ${socket.user.username} (${socket.id})`);

    // Marcar usuario como online
    await User.findByIdAndUpdate(socket.user._id, { online: true });
    socket.broadcast.emit('user:online', { userId: socket.user._id });

    // Registrar manejadores
    registerChatHandlers(io, socket);
    registerRoomHandlers(io, socket);

    socket.on('disconnect', async () => {
      console.log(`👤 Usuario desconectado: ${socket.user.username}`);
      await User.findByIdAndUpdate(socket.user._id, { online: false });
      socket.broadcast.emit('user:offline', { userId: socket.user._id });
    });
  });

  return io;
};
