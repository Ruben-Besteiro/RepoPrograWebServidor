import Message from '../../models/message.model.js';

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

    } catch (error) {
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
