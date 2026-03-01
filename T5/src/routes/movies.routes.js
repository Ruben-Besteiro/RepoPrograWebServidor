import { Router } from 'express';
import uploadMiddleware from '../utils/handleStorage.js';
import { getMovies, getOneMovie, createMovie, updateMovie, deleteMovie, rentMovie, returnMovie, updateMovieCover, getMovieCover, getTopMovies, getAvailableMovies, updateMovieRating } from '../controllers/movies.controller.js';
import { createMovieSchema, updateMovieSchema } from '../schemas/movies.schema.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// Es importante que las rutas estén ordenadas de la más específica a la más general porque si no se bugea
// También deben ir primero las rutas que no tienen ID y después las que sí

router.get('/stats/top', getTopMovies);   // Obtener las 5 películas más alquiladas
router.get('/available', getAvailableMovies);    // Pillar las pelis con copias disponibles
router.get('/', getMovies);         // Listarlo todo
router.get('/:id/cover', getMovieCover);   // Obtener solo la portada de una peli
router.get('/:id', getOneMovie);     // Listar una sola peli

// Las cosas que tienen 3 argumentos -> El segundo es lo que se va a ejecutar antes del controller (middleware)
router.post('/', uploadMiddleware.single('cover'), validate(createMovieSchema), createMovie);      // Crear una peli (con subida de archivo)
router.put('/:id', uploadMiddleware.single('cover'), validate(updateMovieSchema), updateMovie);   // Editar una peli (con subida de archivo)
router.delete('/:id', deleteMovie);     // Borrar una peli

router.patch('/:id/rate', updateMovieRating);   // Ponerle nota a una peli
router.patch('/:id/rent', rentMovie);     // Alquilar una peli (edita datos)
router.patch('/:id/return', returnMovie);   // Devolver una peli (edita datos)
router.patch('/:id/cover', uploadMiddleware.single('cover'), updateMovieCover);   // Actualizar solo la portada de una peli


export default router;