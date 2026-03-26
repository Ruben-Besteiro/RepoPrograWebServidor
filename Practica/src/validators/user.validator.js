import { z } from 'zod';

export const createUserSchema = z.object({
    body: z.object({
        email: z.string().transform(email => email.toLowerCase()).refine(email => email.includes('@'), 'Correo no válido'),
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
        name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
        nif: z.string().min(9, 'El NIF debe tener 9 caracteres').max(9, 'El NIF debe tener 9 caracteres'),
        role: z.enum(['admin', 'guest']).default('guest'),
        status: z.enum(['pending', 'verified']).default('pending'),
        verificationCode: z.number().int().positive().min(100000).max(999999),
        verificationAttempts: z.number().default(0),
        company: z.string().optional(),
        address: z.object({
            street: z.string(),
            number: z.number().int().positive('El número de la calle debe ser mayor que 0').min(1),
            postal: z.number().int().positive('Código postal no válido').min(1000).max(99999),
            city: z.string(),
            province: z.string()
        }).optional(),
        deleted: z.boolean().default(false),
    })
});


export const updateUserSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
        lastName: z.string().min(2),
        nif: z.string().min(9).max(9),
        role: z.enum(['admin', 'guest']).default('guest'),
        status: z.enum(['pending', 'verified']).default('pending'),
        verificationCode: z.number().int().positive().min(100000).max(999999),
        verificationAttempts: z.number().default(0),
        company: z.string().optional(),
        address: z.object({
            street: z.string(),
            number: z.number().int().positive().min(1),
            postal: z.number().int().positive().min(1000).max(99999),
            city: z.string(),
            province: z.string()
        }).optional(),
        deleted: z.boolean().default(false),
    })
});

export const updateUserVerificationCodeSchema = z.object({
    body: z.object({
        verificationCode: z.number().int().positive().min(100000).max(999999)
    })
});