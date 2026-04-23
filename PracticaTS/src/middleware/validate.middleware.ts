// src/middleware/validate.middleware.js
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        });
        next();
    } catch (error: any) {
        if (error.issues) {
            const errors = error.issues.map((e: any) => ({
                field: e.path.join('.'),
                message: e.message
            }));

            res.status(400).json({
                error: true,
                message: 'Error de validación',
                details: errors
            });
        } else {
            res.status(500).json({
                error: true,
                message: 'Error interno en la validación',
                details: error.message || error
            });
        }
    }
};

export const validateObjectId = (paramName: string = 'id') => (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
        return res.status(400).json({
            error: true,
            message: `'${paramName}' no es un ID válido`
        });
    }

    next();
};