// src/app.js
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
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

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 100, // Límite de 100 peticiones por ventana de 15 min por IP
    message: 'Demasiadas peticiones desde esta IP, por favor inténtalo de nuevo más tarde.'
});
app.use(limiter);

// Archivos estáticos
app.use('/uploads', express.static('storage'));     // Cuando el usuario mete uploads en la URL, se mete en la carpeta storage del servidor



// Health check
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

const startServer = async () => {
    console.log("Intentando conectar a:", process.env.MONGO_URL);
    await dbConnect();
    app.listen(PORT, () => {
        console.log(`🚀 Servidor en http://localhost:${PORT}`);
    });
};

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

export default app;