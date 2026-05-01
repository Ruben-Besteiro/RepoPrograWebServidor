// src/app.js
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import dbConnect from './config/index.js';
import routes from './routes/index.js';
import 'dotenv/config';
import './listeners/user.listener.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './docs/swagger.js';

const app = express();

// Middleware globales
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware wrapper para express-mongo-sanitize (compatibilidad con Express 5)
app.use((req: Request, res: Response, next: NextFunction) => {
  ['body', 'params', 'headers', 'query'].forEach(key => {
    if ((req as any)[key]) {
      mongoSanitize.sanitize((req as any)[key]);
    }
  });
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: 'Demasiadas peticiones desde esta IP, por favor inténtalo de nuevo más tarde.'
});
app.use(limiter);


// Archivos estáticos
app.use('/uploads', express.static('storage'));     // Cuando el usuario mete uploads en la URL, se mete en la carpeta storage del servidor


/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check de la API
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: El servidor está funcionando correctamente
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
app.use('/api', routes);

// Documentación de la API (Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 3000;

let server: ReturnType<typeof app.listen> | null = null;

const startServer = async () => {
  console.log(`Intentando conectar a: ${process.env.MONGO_URL} (Base de datos: ${process.env.DB_NAME || 'default'})`);
  await dbConnect();
  server = app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
  });
};

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`${signal} recibido. Cerrando servidor...`);

  if (server) {
    // Si el servidor existe y ha petado, cerramos la conexión con Mongo
    server.close(() => {
      console.log('Servidor HTTP cerrado');
      mongoose.connection.close().then(() => {
        console.log('MongoDB desconectado');
        process.exit(0);
      }).catch((closeErr) => {
        console.error('Error cerrando MongoDB:', closeErr);
        process.exit(1);
      });
    });
  } else {
    // Si el servidor no existe también cerramos la conexión con Mongo
    console.log('No hay servidor HTTP en ejecución. Cerrando conexiones de BD.');
    try {
      await mongoose.connection.close();
      console.log('MongoDB desconectado');
      process.exit(0);
    } catch (closeErr) {
      console.error('Error cerrando MongoDB:', closeErr);
      process.exit(1);
    }
  }

  // Forzar cierre después de 10s
  setTimeout(() => {
    console.error('Forzando cierre');
    process.exit(1);
  }, 10000);
};

// Aquí llamamos al graceful shutdown cuando peta
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;