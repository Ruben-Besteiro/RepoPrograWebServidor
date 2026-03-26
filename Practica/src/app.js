// src/app.js
import express from 'express';
import cors from 'cors';
import dbConnect from './config/index.js';
import routes from './routes/index.js';
import 'dotenv/config';
//import { errorHandler, notFound } from './middleware/error.middleware.js';

const app = express();

// Middleware globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos
app.use('/uploads', express.static('storage'));     // Cuando el usuario mete uploads en la URL, se mete en la carpeta storage del servidor



// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Rutas de la API
app.use('/api', routes);

// Manejo de errores
//app.use(notFound);
//app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    console.log("Intentando conectar a:", process.env.DB_URI);
    await dbConnect();
    app.listen(PORT, () => {
        console.log(`🚀 Servidor en http://localhost:${PORT}`);
    });
};

startServer();