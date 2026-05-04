import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createDeliveryNoteSchema = z.object({
    body: z.object({
        user: z.string().regex(objectIdRegex, 'ID de usuario no válido').optional(),
        company: z.string().regex(objectIdRegex, 'ID de empresa no válido').optional(),
        client: z.string().regex(objectIdRegex, 'ID de cliente no válido'),
        project: z.string().regex(objectIdRegex, 'ID de proyecto no válido'),
        format: z.enum(['material', 'hours'], {
            message: 'El formato debe ser "material" o "hours"'
        }),
        description: z.string().min(1, 'La descripción es obligatoria'),
        workDate: z.coerce.date({
            message: 'Fecha de trabajo no válida'
        }),
        material: z.string().optional(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
        hours: z.number().optional(),
        workers: z.array(z.object({
            name: z.string().min(1, 'El nombre del trabajador es obligatorio'),
            hours: z.number().positive('Las horas deben ser un número positivo')
        })).optional(),
        signed: z.boolean().optional().default(false),
        signedAt: z.coerce.date().optional(),
        signatureUrl: z.string().url('URL de firma no válida').optional(),
        pdfUrl: z.string().url('URL de PDF no válida').optional(),
        deleted: z.boolean().optional().default(false),
    })
});

export const updateDeliveryNoteSchema = z.object({
    body: z.object({
        client: z.string().regex(objectIdRegex, 'ID de cliente no válido').optional(),
        project: z.string().regex(objectIdRegex, 'ID de proyecto no válido').optional(),
        format: z.enum(['material', 'hours'], {
            message: 'El formato debe ser "material" o "hours"'
        }).optional(),
        description: z.string().min(1, 'La descripción es obligatoria').optional(),
        workDate: z.coerce.date().optional(),
        material: z.string().optional(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
        hours: z.number().optional(),
        workers: z.array(z.object({
            name: z.string().min(1, 'El nombre del trabajador es obligatorio'),
            hours: z.number().positive()
        })).optional(),
        signed: z.boolean().optional(),
        signedAt: z.coerce.date().optional(),
        signatureUrl: z.string().url().optional(),
        pdfUrl: z.string().url().optional(),
        deleted: z.boolean().optional(),
    })
});
