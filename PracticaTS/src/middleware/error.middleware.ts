// src/middleware/error.middleware.js
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { sendSlackMessage } from '../services/slack.service.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Si es un error de servidor (5XX), notificamos a Slack
    if (err.statusCode >= 500) {
        sendSlackMessage(err);
    }

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // En producción no mandamos detalles del error a menos que sea operacional
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        } else {
            // Error de programación u otro desconocido: no filtrar detalles al cliente
            console.error('ERROR 💥', err);
            res.status(500).json({
                status: 'error',
                message: 'Algo salió muy mal'
            });
        }
    }
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
    next(AppError.notFound(`No se puede encontrar ${req.originalUrl} en este servidor`));
};
