/**
 * Helper para enviar respuestas de error HTTP desde controladores.
 *
 * @param {import('express').Response} res - objeto de respuesta
 * @param {string} message - mensaje de error a enviar
 * @param {number} [status=500] - código de estado HTTP
 */
export const handleHttpError = (res, message = 'Error interno', status = 500) => {
  return res.status(status).json({
    error: true,
    message
  });
};
