import { z } from 'zod';
import { tareas } from '../data/tareas.js';

export const createUserSchema = z.object({
  body: z.object ({
    name: z.string(),
    email: z.string(),
    password: z.string(),
    role: z.string(),
    avatar: z.string(),
    isActive: z.boolean(),
  })
});


export const updateUserSchema = z.object({
  /*body: z.object({
    title: z.string().min(3).max(100),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']),
    completed: z.boolean(),
    dueDate: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    createdAt: z.coerce.date().default(() => new Date()),
    updatedAt: z.coerce.date().default(() => new Date()),
  }).refine((data) => data.dueDate > data.createdAt, {
    message: "La fecha límite debe ser posterior a la fecha de creación",
    path: ["dueDate"], // el error se asocia a dueDate
  })*/
});