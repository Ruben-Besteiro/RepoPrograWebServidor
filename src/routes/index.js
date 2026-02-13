// Aquí se indexan todas las rutas

// src/routes/index.js
import { Router } from 'express';
import tareasRoutes from './tareas.routes.js';

const router = Router();

// Este script de aquí es el primero que recibe las llamadas del cliente

// Si el cliente mete /api/cursos/programacion, se redirige al objeto cursosRoutes
// que más arriba definimos que corresponde al archivo cursos.routes.js
router.use('/tareas', tareasRoutes);


// Esto da igual porque el cliente no va a llamar a /api, sino a /api/cursos/programacion o a /api/usuarios, pero lo dejo para que se vea que se puede hacer
router.get('/', (req, res) => {
  res.json({
    mensaje: 'API de Tareas v1.0',
    endpoints: {
      tareas: '/api/tareas',
      health: '/health'
    }
  });
});

export default router;