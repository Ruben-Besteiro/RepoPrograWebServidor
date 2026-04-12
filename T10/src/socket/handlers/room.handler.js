import Room from '../../models/room.model.js';

export default (io, socket) => {
  const joinRoom = async (payload) => {
    const { roomId } = payload;
    
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        return socket.emit('error', { message: 'La sala no existe' });
      }

      // Salir de salas anteriores (excepto su propio socket.id)
      socket.rooms.forEach(id => {
        if (id !== socket.id) socket.leave(id);
      });

      socket.join(roomId);
      console.log(`📡 User ${socket.user.username} se unió a ${room.name}`);

      // Confirmar al usuario que se unió
      // En una implementación real podrías enviar también la lista de usuarios conectados a esa sala
      socket.emit('room:joined', { room });

      // Notificar a otros en la sala
      socket.to(roomId).emit('room:user-joined', { 
        user: { id: socket.user._id, username: socket.user.username } 
      });

    } catch (error) {
      socket.emit('error', { message: 'Error al unirse a la sala' });
    }
  };

  const leaveRoom = async (payload) => {
    const { roomId } = payload;
    socket.leave(roomId);
    
    socket.to(roomId).emit('room:user-left', { 
      user: { id: socket.user._id, username: socket.user.username } 
    });
  };

  socket.on('room:join', joinRoom);
  socket.on('room:leave', leaveRoom);
};
