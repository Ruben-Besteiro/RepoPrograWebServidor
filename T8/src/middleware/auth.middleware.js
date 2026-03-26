// src/middleware/auth.middleware.js
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string()
        .min(3, 'Mínimo 3 caracteres')
        .max(99, 'Máximo 99 caracteres')
        .trim(),
    email: z.string()
        .email('Email no válido')
        .toLowerCase()
        .trim(),
    password: z.string()
        .min(8, 'Mínimo 8 caracteres')
        .max(16, 'Máximo 16 caracteres'),
    role: z.enum(['user', 'admin']).optional(),
    age: z.number().min(18).max(99),
    createdAt: z.date().optional()
});

const loginSchema = z.object({
    email: z.string()
        .email('Email no válido')
        .toLowerCase()
        .trim(),
    password: z.string()
        .min(8, 'Mínimo 8 caracteres')
        .max(16, 'Máximo 16 caracteres')
});

export const middlewareRegister = (req, res, next) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            error: true,
            message: 'Datos de registro no válidos',
            errors: result.error.issues
        });
    }
    req.body = result.data;
    next();
};

export const middlewareLogin = (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            error: true,
            message: 'Datos de login no válidos',
            errors: result.error.issues
        });
    }
    req.body = result.data;
    next();
};