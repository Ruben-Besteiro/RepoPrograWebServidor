import { z } from 'zod';

export const createUserSchema = z.object({
    body: z.object({
        email: z.string().email('Correo no válido').transform(email => email.toLowerCase()).refine(email => email.includes('@'), 'Correo no válido'),
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
        name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
        nif: z.string().min(9, 'El NIF debe tener 9 caracteres').max(9, 'El NIF debe tener 9 caracteres'),
        company: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de empresa no válido').optional(),
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
        email: z.string().email('Correo no válido').transform(email => email.toLowerCase()).refine(email => email.includes('@'), 'Correo no válido').optional(),
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
        name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
        lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').optional(),
        nif: z.string().min(9, 'El NIF debe tener 9 caracteres').max(9, 'El NIF debe tener 9 caracteres').optional(),
        role: z.enum(['admin', 'guest']).default('guest').optional(),
        status: z.enum(['pending', 'verified']).default('pending').optional(),
        verificationCode: z.number().int().positive().min(100000).max(999999).optional(),
        verificationAttempts: z.number().default(0).optional(),
        company: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de empresa no válido').optional(),
        address: z.object({
            street: z.string().optional(),
            number: z.number().int().positive().min(1).optional(),
            postal: z.number().int().positive().min(1000).max(99999).optional(),
            city: z.string().optional(),
            province: z.string().optional()
        }).optional(),
        deleted: z.boolean().default(false).optional(),
    })
});

// La contraseña no puede ser igual a la anterior
export const updatePasswordSchema = z.object({
    body: z.object({
        oldPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
    }).refine((data) => data.password !== data.oldPassword, {
        message: 'La contraseña no puede ser igual a la anterior',
        path: ['password']
    })
});

export const updateUserVerificationCodeSchema = z.object({
    body: z.object({
        verificationCode: z.number().int().positive().min(100000).max(999999)
    })
});

export const loginUserSchema = z.object({
    body: z.object({
        email: z.string().email('Correo no válido'),
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
    })
});