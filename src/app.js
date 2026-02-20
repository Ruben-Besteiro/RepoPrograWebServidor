// src/app.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Seguridad
app.use(helmet());
app.use(cors());

// Parseo de body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas de la API (lo que realmente importa)
app.use('/api', routes);    // Aquí se indexan todas las rutas, que a su vez redirigen a otras rutas, y así sucesivamente hasta llegar a los endpoints concretos

// Manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

export default app;