import Message from '../../models/message.model.js';
import Room from '../../models/room.model.js';
import { sendPushNotification } from '../../utils/notification.js';

export default (io, socket) => {
  const sendMessage = async (payload) => {
    const { roomId, content } = payload;
    
    if (!content || content.trim() === '') return;

    try {
      const newMessage = new Message({
        room: roomId,
        user: socket.user._id,
        content: content
      });

      await newMessage.save();

      // Emitir mensaje a todos en la sala (incluyendo remitente)
      io.to(roomId).emit('chat:message', {
        user: { id: socket.user._id, username: socket.user.username },
        content: content,
        timestamp: newMessage.createdAt
      });

      // --- Notificaciones Push ---
      try {
        const room = await Room.findById(roomId).populate('members');
        if (room && room.members) {
          // Obtener IDs de usuarios conectados actualmente a esta sala de socket
          const connectedSocketIds = io.sockets.adapter.rooms.get(roomId);
          const connectedUserIds = new Set();
          
          if (connectedSocketIds) {
            for (const socketId of connectedSocketIds) {
              const s = io.sockets.sockets.get(socketId);
              if (s && s.user) connectedUserIds.add(s.user._id.toString());
            }
          }

          // Notificar a miembros que NO están en la sala de socket actualmente
          const pushPromises = room.members
            .filter(member => 
              member._id.toString() !== socket.user._id.toString() && // No al remitente
              !connectedUserIds.has(member._id.toString()) && // Solo a los que no están en el socket
              member.pushSubscription // Solo si tiene suscripción
            )
            .map(member => sendPushNotification(member.pushSubscription, {
              title: `Nuevo mensaje en ${room.name}`,
              body: `${socket.user.username}: ${content}`,
              icon: '/icon.png', // Opcional, dependiendo de lo que tengas
              data: { url: `/chat/${roomId}` } // URL a la que ir al pulsar
            }));

          await Promise.all(pushPromises);
        }
      } catch (pushError) {
        console.error('Error enviando notificaciones push:', pushError);
      }
      // --------------------------

    } catch (error) {
      console.error(error);
      socket.emit('error', { message: 'Error al enviar mensaje' });
    }
  };

  const typingStatus = (payload) => {
    const { roomId } = payload;
    // Notificar a otros en la sala que este usuario está escribiendo
    socket.to(roomId).emit('chat:typing', {
      user: { id: socket.user._id, username: socket.user.username }
    });
  };

  socket.on('chat:message', sendMessage);
  socket.on('chat:typing', typingStatus);
};
