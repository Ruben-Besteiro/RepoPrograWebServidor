import { z } from 'zod';

export const createCompanySchema = z.object({
    body: z.object({
        name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        cif: z.string().min(9, 'El CIF debe tener 9 caracteres').max(9, 'El CIF debe tener 9 caracteres'),
        address: z.object({
            street: z.string(),
            number: z.number().int().positive('El número de la calle debe ser mayor que 0').min(1),
            postal: z.number().int().positive('Código postal no válido').min(1000).max(99999),
            city: z.string(),
            province: z.string()
        }).optional(),
        logo: z.string().optional(),
        isFreelance: z.boolean().default(false)
    })
});

export const updateCompanySchema = z.object({
    body: z.object({
        name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        cif: z.string().min(9, 'El CIF debe tener 9 caracteres').max(9, 'El CIF debe tener 9 caracteres'),
        address: z.object({
            street: z.string(),
            number: z.number().int().positive('El número de la calle debe ser mayor que 0').min(1),
            postal: z.number().int().positive('Código postal no válido').min(1000).max(99999),
            city: z.string(),
            province: z.string()
        }).optional(),
        logo: z.string().optional(),
        isFreelance: z.boolean().default(false)
    })
});

export const updatePasswordSchema = z.object({
    body: z.object({
        oldPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
    }).refine((data) => data.password !== data.oldPassword, {
        message: 'La contraseña no puede ser igual a la anterior',
        path: ['password']
    })
});