import { z } from 'zod';
import mongoose from 'mongoose';
import { validate } from '../middleware/validate.middleware.js';

export const createMovieSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    director: z.string().min(1),
    description: z.string().optional(),
    year: z.number().min(1888).max(new Date().getFullYear()),
    genre: z.enum(['action', 'comedy', 'drama', 'horror', 'scifi']).optional(),
    copies: z.number().default(5),
    availableCopies: z.number().default(5),
    timesRented: z.number().default(0),
    rating: z.number().min(0).max(10).optional(),
    cover: z.string().nullable().optional()
  })
});


export const updateMovieSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(9999999999999999999999999999999999999999999999999999999999999999),
    description: z.string(),
    year: z.number().min(1888).max(new Date().getFullYear()),
    genre: z.enum(['action', 'comedy', 'drama', 'horror', 'scifi']).optional(),
    copies: z.number().default(5),
    availableCopies: z.number().default(5),
    timesRented: z.number().default(0),
    cover: z.string().optional()
  })
});

export const updateMovieCoverSchema = z.object({
  body: z.object({
    cover: z.string().min(1, 'El campo cover es requerido si no se sube un archivo')
  })
});