import User from '../models/user.model.js';
import webpush from 'web-push';


/**
 * Guarda la suscripción push para el usuario actual.
 * @route POST /api/notifications/subscribe
 */
export const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription) {
      return res.status(400).json({ message: 'Suscripción requerida' });
    }

    // Actualizar el usuario con la nueva suscripción
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription: subscription
    });

    res.status(201).json({ message: 'Suscripción guardada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar suscripción', error: error.message });
  }
};

/**
 * Obtiene la clave pública VAPID para que el cliente pueda suscribirse.
 * @route GET /api/notifications/vapid-key
 */
export const getVapidKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};
