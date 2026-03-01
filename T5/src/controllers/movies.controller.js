// src/controllers/movies.controller.js
import path from 'node:path';
import fs from 'fs';
import Movie from '../models/movies.model.js';
import { handleHttpError } from '../utils/handleError.js';


const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:3000';

/*router.get('/', getMovies);         // Listarlo todo
router.get('/:id', getOneMovie);     // Listar una sola peli
router.post('/', uploadMiddleware.single('file'), createMovie);      // Crear una peli (con subida de archivo)
router.put('/:id', uploadMiddleware.single('file'), updateMovie);   // Editar una peli (con subida de archivo)
router.delete('/:id', deleteMovie);     // Borrar una peli
router.post('/:id/rent', rentMovie);     // Alquilar una peli (edita datos)
router.post('/:id/return', returnMovie);   // Devolver una peli (edita datos)
router.patch('/:id/cover', uploadMiddleware.single('file'), updateMovieCover);   // Actualizar solo la portada de una peli
router.get('/:id/cover', getMovieCover);   // Obtener solo la portada de una peli
router.get('/stats/top', getTopMovies);   // Obtener las 5 películas más alquiladas*/

// GET /api/movies
export const getMovies = async (req, res) => {
    const { page = 1, limit = 10, genre } = req.query;

    // Filtro dinámico
    const filter = {};
    if (genre) filter.genre = genre;

    const skip = (Number(page) - 1) * Number(limit);

    const [movies, total] = await Promise.all([
        Movie.find(filter)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 }),
        Movie.countDocuments(filter)
    ]);

    res.json({
        data: movies,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
        }
    });
};



export const getOneMovie = async (req, res) => {
    const { id } = req.params;

    // Si el ID no es un número, devolvemos error antes de que Mongoose explote
    if (isNaN(id)) {
        return handleHttpError(res, 'Valor inválido para _id', 400);
    }

    const movie = await Movie.findById(id);

    if (!movie) {
        return handleHttpError(res, 'Película no encontrada', 404);
    }
    res.json({ data: movie });
};

export const getMovieCover = async (req, res) => {
    const { id } = req.params;

    if (isNaN(id)) {
        return handleHttpError(res, 'Valor inválido para _id', 400);
    }

    const movie = await Movie.findById(id);

    if (!movie || !movie.cover) {
        return handleHttpError(res, 'Portada no encontrada', 404);
    }

    // Resolvemos la ruta absoluta al archivo
    // El filename está guardado en movie.cover
    const filename = movie.cover.includes('/') ? movie.cover.split('/').pop() : movie.cover;
    const filePath = path.join(process.cwd(), 'storage', filename);

    if (!fs.existsSync(filePath)) {
        // Por si acaso están en la carpeta uploads (retrocompatibilidad)
        const oldPath = path.join(process.cwd(), 'uploads', filename);
        if (fs.existsSync(oldPath)) {
            return res.sendFile(oldPath);
        }
        return handleHttpError(res, 'El archivo de imagen no existe en el servidor', 404);
    }

    res.sendFile(filePath);
};


// La diferencia es que en vez de ser un usuario tiene que ser una peli
export const createMovie = async (req, res) => {
    const movie = await Movie.create(req.body);
    res.status(201).json({ data: movie });
};

export const updateMovie = async (req, res) => {
};

export const deleteMovie = async (req, res) => {
    const { id } = req.params;
    const movie = await Movie.findByIdAndDelete(id);

    if (!movie) {
        return handleHttpError(res, 'Nope', 404);
    }
    res.status(204).send();
};

export const rentMovie = async (req, res) => {
    const { id } = req.params;
    const movie = await Movie.findById(id);

    if (!movie) {
        return handleHttpError(res, 'Nope', 404);
    }

    if (movie.availableCopies <= 0) {
        return handleHttpError(res, 'No hay copias disponibles', 400);
    }

    movie.availableCopies -= 1;
    movie.timesRented += 1;
    await movie.save();
    res.json({ data: movie });
};

export const returnMovie = async (req, res) => {
    const { id } = req.params;
    const movie = await Movie.findById(id);

    if (!movie) {
        return handleHttpError(res, 'Nope', 404);
    }

    if (movie.availableCopies >= movie.copies) {
        return handleHttpError(res, 'No quedan copias por devolver', 400);
    }
    movie.availableCopies += 1;
    await movie.save();
    res.json({ data: movie });
};

export const updateMovieCover = async (req, res) => {
    const { id } = req.params;

    if (isNaN(id)) {
        return handleHttpError(res, 'Valor inválido para _id', 400);
    }

    // El archivo viene en req.file si se sube por multipart/form-data
    // El path viene en req.body.cover si se manda por JSON
    let coverFilename = null;

    if (req.file) {
        coverFilename = req.file.filename;
    } else if (req.body && req.body.cover) {
        // Si mandan "uploads/archivo.jpg", extraemos solo "archivo.jpg"
        coverFilename = req.body.cover.includes('/') ? req.body.cover.split('/').pop() : req.body.cover;
    }

    if (!coverFilename) {
        return handleHttpError(res, 'No se subió ningún archivo ni se proporcionó un path de portada', 400);
    }

    const movie = await Movie.findById(id);

    if (!movie) {
        return handleHttpError(res, 'Película no encontrada', 404);
    }

    movie.cover = coverFilename;
    await movie.save();

    res.json({
        message: 'Portada actualizada con éxito',
        data: movie
    });
};

export const getTopMovies = async (req, res) => {
    // Lo que va dentro del sort es el campo por el que quieres ordenar, y el -1 es para ordenarlo de mayor a menor (si fuera 1 sería de menor a mayor)
    const topMovies = await Movie.find().sort({ timesRented: -1 }).limit(5);
    res.json({ data: topMovies });
};

export const getAvailableMovies = async (req, res) => {
    const availableMovies = await Movie.find({ availableCopies: { $gt: 0 } });
    res.json({ data: availableMovies });
};

export const updateMovieRating = async (req, res) => {
    const { id } = req.params;
    const { rating } = req.body;
    const movie = await Movie.findById(id);

    if (!movie) {
        return handleHttpError(res, 'Nope', 404);
    }

    if (rating < 0 || rating > 10) {
        return handleHttpError(res, 'Nota no válida', 400);
    }

    movie.rating = rating;
    await movie.save();
    res.json({ data: movie });
};
