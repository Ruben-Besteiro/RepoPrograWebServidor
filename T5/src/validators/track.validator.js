// src/validators/track.validator.js
import { z } from 'zod';

// Validar que un string sea un ObjectId de MongoDB válido
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, 'ObjectId no válido');

export const createTrackSchema = z.object({
    body: z.object({
        title: z.string()
            .min(1, 'El título es requerido')
            .max(200, 'Máximo 200 caracteres')
            .trim(),
        duration: z.number()
            .positive('La duración debe ser positiva'),
        artist: objectId,
        collaborators: z.array(objectId).optional(),
        genres: z.array(z.string()).optional(),
        plays: z.number()
            .int('Debe ser un número entero')
            .min(0, 'No puede ser negativo')
            .optional()
    })
});

export const updateTrackSchema = z.object({
    body: z.object({
        title: z.string()
            .min(1, 'El título es requerido')
            .max(200, 'Máximo 200 caracteres')
            .trim()
            .optional(),
        duration: z.number()
            .positive('La duración debe ser positiva')
            .optional(),
        artist: objectId.optional(),
        collaborators: z.array(objectId).optional(),
        genres: z.array(z.string()).optional(),
        plays: z.number()
            .int('Debe ser un número entero')
            .min(0, 'No puede ser negativo')
            .optional()
    })
});
