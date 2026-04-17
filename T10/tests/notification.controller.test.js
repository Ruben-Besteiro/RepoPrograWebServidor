import { jest } from '@jest/globals';
import { subscribe, getVapidKey } from '../src/controllers/notification.controller.js';
import User from '../src/models/user.model.js';

describe('Notification controller', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('subscribe devuelve 400 si no hay suscripción', async () => {
    const req = { body: {} };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await subscribe(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Suscripción requerida' });
  });

  test('subscribe guarda la suscripción y devuelve 201', async () => {
    const updateMock = jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});

    const req = {
      body: { subscription: { endpoint: 'https://example.com' } },
      user: { _id: 'user123' }
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await subscribe(req, res);

    expect(updateMock).toHaveBeenCalledWith('user123', {
      pushSubscription: { endpoint: 'https://example.com' }
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Suscripción guardada exitosamente' });
  });

  test('getVapidKey devuelve la clave pública VAPID', () => {
    process.env.VAPID_PUBLIC_KEY = 'test-vapid-key';

    const req = {};
    const res = {
      json: jest.fn()
    };

    getVapidKey(req, res);

    expect(res.json).toHaveBeenCalledWith({ publicKey: 'test-vapid-key' });
  });

  test('subscribe maneja errores internos', async () => {
    jest.spyOn(User, 'findByIdAndUpdate').mockRejectedValue(new Error('fallo DB'));

    const req = {
      body: { subscription: { endpoint: 'https://example.com' } },
      user: { _id: 'user123' }
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    await subscribe(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error al guardar suscripción', error: 'fallo DB' });
  });
});
