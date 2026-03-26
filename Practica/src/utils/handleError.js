// src/utils/handleError.js

/**
 * Maneja errores HTTP y envía respuesta al cliente
 * @param {Object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @param {number} code - Código HTTP (default 403)
 */
export const handleHttpError = (res, message = 'ERROR', code = 403) => {
    res.status(code).json({ error: message });
};
