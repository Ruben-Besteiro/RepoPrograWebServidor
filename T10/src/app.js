// src/app.js
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import dbConnect from './config/db.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
//import morganBody from 'morgan-body';
import swaggerUi from 'swagger-ui-express';
//import swaggerSpecs from './config/swagger.js';
import { initSocket } from './socket/index.js';

const app = express();
const httpServer = createServer(app);

// Inicializar Socket.IO
initSocket(httpServer);

// Middleware globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta public
const __dirname = import.meta.dirname;
app.use(express.static(path.join(__dirname, '../public')));

// Morgan Body - Para reportar errores a Slack
/*morganBody(app, {
  noColors: true,
  stream: loggerStream,
  skip: (req, res) => res.statusCode < 400
});*/

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Swagger documentation
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Rutas de la API
app.use('/api', routes);

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  console.log("Intentando conectar a MongoDB...");
  await dbConnect();
  httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
    console.log(`💬 Chat listo para usar`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;