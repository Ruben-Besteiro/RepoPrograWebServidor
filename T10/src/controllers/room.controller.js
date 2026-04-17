import Room from '../models/room.model.js';
import Message from '../models/message.model.js';

/**
 * Lista todas las salas disponibles.
 * @route GET /api/rooms
 */
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener salas', error: error.message });
  }
};

/**
 * Crea una nueva sala.
 * @route POST /api/rooms
 */
export const createRoom = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ message: 'Ya existe una sala con ese nombre' });
    }

    const room = new Room({ name, description });
    await room.save();

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear sala', error: error.message });
  }
};

/**
 * Obtiene el historial de mensajes de una sala.
 * @route GET /api/rooms/:id/messages
 */
export const getRoomMessages = async (req, res) => {
  try {
    const { id } = req.params;

    const messages = await Message.find({ room: id })
      .populate('user', 'username')
      .sort({ createdAt: 1 }); // Orden cronológico para el historial

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial', error: error.message });
  }
};

/**
 * Edita un mensaje existente.
 * @route PUT /api/rooms/:roomId/messages/:messageId 
*/
export const editMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Mensaje no encontrado' });
    }

    if (message.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permiso para editar este mensaje' });
    }

    message.content = content;
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error al editar mensaje', error: error.message });
  }
};

/**
 * Elimina un mensaje.
 * @route DELETE /api/rooms/:roomId/messages/:messageId
*/
export const deleteMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Mensaje no encontrado' });
    }

    if (message.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este mensaje' });
    }

    await message.deleteOne();

    res.json({ message: 'Mensaje eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar mensaje', error: error.message });
  }
};