import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Estos son los validadores de Zod
// Son funciones middleware y se llaman cuando en las rutas ponemos validate(x)

export const createClientSchema = z.object({
    body: z.object({
        user: z.string().regex(objectIdRegex, 'ID de usuario no válido').optional(),
        company: z.string().regex(objectIdRegex, 'ID de empresa no válido').optional(),
        name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        cif: z.string().min(9, 'El CIF debe tener 9 caracteres').max(9, 'El CIF debe tener 9 caracteres').optional(),
        email: z.string().email('Correo no válido').transform(email => email.toLowerCase()).optional(),
        phone: z.string().min(9, 'El teléfono debe tener al menos 9 caracteres').optional(),
        address: z.object({
            street: z.string().optional(),
            number: z.string().optional(),
            postal: z.string().optional(),
            city: z.string().optional(),
            province: z.string().optional()
        }).optional()
    })
});

export const updateClientSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
        cif: z.string().min(9, 'El CIF debe tener 9 caracteres').max(9, 'El CIF debe tener 9 caracteres').optional(),
        email: z.string().email('Correo no válido').transform(email => email.toLowerCase()).optional(),
        phone: z.string().min(9, 'El teléfono debe tener al menos 9 caracteres').optional(),
        address: z.object({
            street: z.string().optional(),
            number: z.string().optional(),
            postal: z.string().optional(),
            city: z.string().optional(),
            province: z.string().optional()
        }).optional()
    })
});
