export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message = "Solicitud incorrecta", details = null) {
    return new ApiError(400, message, details);
  }

  static notFound(message = "Recurso no encontrado") {
    return new ApiError(404, message);
  }

  static internal(message = "Error interno del servidor") {
    return new ApiError(500, message);
  }
}

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Ruta ${req.originalUrl} no encontrada`));
};

export const errorHandler = (err, req, res, next) => {
  console.error("Error capturado:", err);

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details && { detalles: err.details })
    });
  }

  const isDev = process.env.NODE_ENV === "development";

  return res.status(500).json({
    error: "Error interno del servidor",
    ...(isDev && {
      message: err.message,
      stack: err.stack
    })
  });
};
