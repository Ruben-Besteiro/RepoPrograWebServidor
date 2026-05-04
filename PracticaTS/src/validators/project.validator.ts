import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createProjectSchema = z.object({
    body: z.object({
        user: z.string().regex(objectIdRegex, 'ID de usuario no válido').optional(),
        company: z.string().regex(objectIdRegex, 'ID de empresa no válido').optional(),
        client: z.string().regex(objectIdRegex, 'ID de cliente no válido'),
        name: z.string().min(2, 'El nombre del proyecto debe tener al menos 2 caracteres'),
        projectCode: z.string().min(1, 'El código del proyecto es obligatorio'),
        address: z.object({
            street: z.string().optional(),
            number: z.string().optional(),
            postal: z.string().optional(),
            city: z.string().optional(),
            province: z.string().optional()
        }).optional(),
        email: z.string().email('Correo no válido').transform(email => email.toLowerCase()),
        notes: z.string().optional(),
        active: z.boolean().optional().default(true),
        deleted: z.boolean().optional().default(false),
    })
});

export const updateProjectSchema = z.object({
    body: z.object({
        client: z.string().regex(objectIdRegex, 'ID de cliente no válido').optional(),
        name: z.string().min(2, 'El nombre del proyecto debe tener al menos 2 caracteres').optional(),
        projectCode: z.string().min(1, 'El código del proyecto es obligatorio').optional(),
        address: z.object({
            street: z.string().optional(),
            number: z.string().optional(),
            postal: z.string().optional(),
            city: z.string().optional(),
            province: z.string().optional()
        }).optional(),
        email: z.string().email('Correo no válido').transform(email => email.toLowerCase()).optional(),
        notes: z.string().optional(),
        active: z.boolean().optional(),
        deleted: z.boolean().optional(),
    })
});
