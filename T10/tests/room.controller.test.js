import { jest } from '@jest/globals';
import { getAllRooms, createRoom, getRoomMessages, editMessage, deleteMessage } from '../src/controllers/room.controller.js';
import Room from '../src/models/room.model.js';
import Message from '../src/models/message.model.js';

describe('Room controller', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getAllRooms devuelve las salas ordenadas', async () => {
    const sortMock = jest.fn().mockResolvedValue([{ name: 'Sala A' }]);
    jest.spyOn(Room, 'find').mockReturnValue({ sort: sortMock });

    const req = {};
    const res = {
      json: jest.fn()
    };

    await getAllRooms(req, res);

    expect(Room.find).toHaveBeenCalled();
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.json).toHaveBeenCalledWith([{ name: 'Sala A' }]);
  });

  test('createRoom devuelve 201 al crear nueva sala', async () => {
    jest.spyOn(Room, 'findOne').mockResolvedValue(null);
    const saveMock = jest.fn().mockResolvedValue();
    jest.spyOn(Room.prototype, 'save').mockImplementation(saveMock);

    const req = { body: { name: 'Nueva Sala', description: 'Descripción' } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await createRoom(req, res);

    expect(Room.findOne).toHaveBeenCalledWith({ name: 'Nueva Sala' });
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nueva Sala' }));
  });

  test('createRoom devuelve 400 si la sala ya existe', async () => {
    jest.spyOn(Room, 'findOne').mockResolvedValue({ name: 'Sala Existente' });

    const req = { body: { name: 'Sala Existente', description: 'Descripción' } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await createRoom(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Ya existe una sala con ese nombre' });
  });

  test('getRoomMessages devuelve mensajes ordenados y poblados', async () => {
    const sortMock = jest.fn().mockResolvedValue([{ content: 'Hola' }]);
    const populateMock = jest.fn(() => ({ sort: sortMock }));
    jest.spyOn(Message, 'find').mockReturnValue({ populate: populateMock });

    const req = { params: { id: 'room123' } };
    const res = { json: jest.fn() };

    await getRoomMessages(req, res);

    expect(Message.find).toHaveBeenCalledWith({ room: 'room123' });
    expect(populateMock).toHaveBeenCalledWith('user', 'username');
    expect(sortMock).toHaveBeenCalledWith({ createdAt: 1 });
    expect(res.json).toHaveBeenCalledWith([{ content: 'Hola' }]);
  });

  test('editMessage devuelve 404 si no existe el mensaje', async () => {
    jest.spyOn(Message, 'findById').mockResolvedValue(null);

    const req = { params: { messageId: 'msg1' }, body: { content: 'Editado' }, user: { _id: 'user1' } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await editMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Mensaje no encontrado' });
  });

  test('editMessage devuelve 403 si el usuario no puede editar', async () => {
    const message = {
      user: { toString: () => 'otroUsuario' },
      content: 'Original',
      save: jest.fn()
    };
    jest.spyOn(Message, 'findById').mockResolvedValue(message);

    const req = { params: { messageId: 'msg1' }, body: { content: 'Editado' }, user: { _id: 'user1' } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await editMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'No tienes permiso para editar este mensaje' });
    expect(message.save).not.toHaveBeenCalled();
  });

  test('editMessage actualiza y devuelve el mensaje', async () => {
    const message = {
      user: { toString: () => 'user1' },
      content: 'Original',
      save: jest.fn().mockResolvedValue(),
    };
    jest.spyOn(Message, 'findById').mockResolvedValue(message);

    const req = { params: { messageId: 'msg1' }, body: { content: 'Editado' }, user: { _id: 'user1' } };
    const res = { json: jest.fn() };

    await editMessage(req, res);

    expect(message.content).toBe('Editado');
    expect(message.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(message);
  });

  test('deleteMessage devuelve 404 si no existe el mensaje', async () => {
    jest.spyOn(Message, 'findById').mockResolvedValue(null);

    const req = { params: { messageId: 'msg1' }, user: { _id: 'user1' } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await deleteMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Mensaje no encontrado' });
  });

  test('deleteMessage devuelve 403 si el usuario no puede eliminar', async () => {
    const message = {
      user: { toString: () => 'otroUsuario' },
      deleteOne: jest.fn()
    };
    jest.spyOn(Message, 'findById').mockResolvedValue(message);

    const req = { params: { messageId: 'msg1' }, user: { _id: 'user1' } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await deleteMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'No tienes permiso para eliminar este mensaje' });
    expect(message.deleteOne).not.toHaveBeenCalled();
  });

  test('deleteMessage elimina y devuelve confirmación', async () => {
    const message = {
      user: { toString: () => 'user1' },
      deleteOne: jest.fn().mockResolvedValue(),
    };
    jest.spyOn(Message, 'findById').mockResolvedValue(message);

    const req = { params: { messageId: 'msg1' }, user: { _id: 'user1' } };
    const res = {
      json: jest.fn()
    };

    await deleteMessage(req, res);

    expect(message.deleteOne).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Mensaje eliminado correctamente' });
  });

  test('getAllRooms maneja errores internos', async () => {
    const sortMock = jest.fn().mockRejectedValue(new Error('fallo DB'));
    jest.spyOn(Room, 'find').mockReturnValue({ sort: sortMock });

    const req = {};
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await getAllRooms(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error al obtener salas', error: 'fallo DB' });
  });

  test('createRoom maneja errores internos', async () => {
    jest.spyOn(Room, 'findOne').mockRejectedValue(new Error('fallo DB'));

    const req = { body: { name: 'Sala Error', description: 'Descripción' } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await createRoom(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error al crear sala', error: 'fallo DB' });
  });

  test('getRoomMessages maneja errores internos', async () => {
    const populateMock = jest.fn(() => ({ sort: jest.fn().mockRejectedValue(new Error('fallo DB')) }));
    jest.spyOn(Message, 'find').mockReturnValue({ populate: populateMock });

    const req = { params: { id: 'room123' } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await getRoomMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error al obtener historial', error: 'fallo DB' });
  });

  test('editMessage maneja errores internos', async () => {
    jest.spyOn(Message, 'findById').mockRejectedValue(new Error('fallo DB'));

    const req = { params: { messageId: 'msg1' }, body: { content: 'Editado' }, user: { _id: 'user1' } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await editMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error al editar mensaje', error: 'fallo DB' });
  });

  test('deleteMessage maneja errores internos', async () => {
    jest.spyOn(Message, 'findById').mockRejectedValue(new Error('fallo DB'));

    const req = { params: { messageId: 'msg1' }, user: { _id: 'user1' } };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await deleteMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error al eliminar mensaje', error: 'fallo DB' });
  });
});
