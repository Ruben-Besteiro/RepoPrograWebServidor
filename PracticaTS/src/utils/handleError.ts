// src/utils/handleError.js
import { Response } from 'express';

/**
 * Maneja errores HTTP y envía respuesta al cliente
 * @param {Response} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @param {number} code - Código HTTP (default 403)
 */
export const handleHttpError = (res: Response, message: string = 'ERROR', code: number = 403): void => {
    res.status(code).json({ error: message });
};