// src/docs/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';

// Ajustes de Swagger
const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'API de Tracks - Express con Swagger',
            version: '1.0.0',
            description: 'API REST documentada con Swagger',
            license: {
                name: 'MIT',
                url: 'https://spdx.org/licenses/MIT.html'
            },
            contact: {
                name: 'Tu Nombre',
                email: 'tu@email.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor de desarrollo'
            }
        ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Juan Pérez' },
            email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
            password: { type: 'string', format: 'password', example: 'MiPassword123' },
            age: { type: 'integer', example: 25 },
            role: { type: 'string', enum: ['user', 'admin'], default: 'user' }
          }
        },
        Podcast: {
          type: 'object',
          required: ['title', 'description', 'category', 'duration'],
          properties: {
            _id: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
            title: { type: 'string', example: 'Título del Podcast' },
            description: { type: 'string', example: 'Descripción de más de 10 caracteres del podcast...' },
            author: { type: 'string', description: 'ID del autor (User)', example: '507f1f77bcf86cd799439011' },
            category: { type: 'string', enum: ['tech', 'science', 'history', 'comedy', 'news'], example: 'tech' },
            duration: { type: 'integer', example: 180, description: 'Duración en segundos' },
            episodes: { type: 'integer', example: 1 },
            published: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Login: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
            password: { type: 'string', format: 'password', example: 'MiPassword123' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Error message detail' }
          }
        }
      }
    }
    },
    apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);