// src/schemas/validation.js
import { z } from 'zod';

export const registerSchema = z.object({
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
    role: z.enum(['USER', 'LIBRARIAN', 'ADMIN'])
});

export const loginSchema = z.object({
    email: z.string()
        .email('Email no válido')
        .toLowerCase()
        .trim(),
    password: z.string()
        .min(8, 'Mínimo 8 caracteres')
        .max(16, 'Máximo 16 caracteres')
});

export const reviewSchema = z.object({
    rating: z.number()
        .min(1, 'Mínimo 1')
        .max(5, 'Máximo 5'),
    comment: z.string()
        .min(1, 'Mínimo 1 caracter')
        .max(500, 'Máximo 500 caracteres')
        .trim()
});

export const loanSchema = z.object({
    bookId: z.number()
        .int('Debe ser un número entero')
        .positive('Debe ser un número positivo'),
    loanDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    dueDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    returnedDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
        .nullable(),
    status: z.enum(['PENDING', 'ACTIVE', 'OVERDUE', 'RETURNED'])
});

export const bookSchema = z.object({
    isbn: z.string()
        .length(17, 'ISBN debe tener 17 caracteres (formato: XXX-X-XX-XXXXXX-X)')
        .regex(/^\d{3}-\d-\d{2}-\d{6}-\d$/),
    title: z.string()
        .min(1, 'El título no puede estar vacío')
        .max(255, 'El título no puede exceder 255 caracteres')
        .trim(),
    author: z.string()
        .min(1, 'El autor no puede estar vacío')
        .max(255, 'El autor no puede exceder 255 caracteres')
        .trim(),
    genre: z.string()
        .min(1, 'El género no puede estar vacío')
        .max(100, 'El género no puede exceder 100 caracteres')
        .trim(),
    description: z.string()
        .max(1000, 'La descripción no puede exceder 1000 caracteres')
        .nullable(),
    publishedYear: z.number()
        .int('El año de publicación debe ser un número entero')
        .min(0, 'El año de publicación no puede ser negativo')
        .max(new Date().getFullYear(), 'El año de publicación no puede ser mayor al año actual')
        .nullable(),
    copies: z.number()
        .int('El número de copias debe ser un número entero')
        .positive('El número de copias debe ser positivo')
        .default(1),
    availableCopies: z.number()
        .int('El número de copias disponibles debe ser un número entero')
        .nonnegative('El número de copias disponibles no puede ser negativo')
        .default(1)
});