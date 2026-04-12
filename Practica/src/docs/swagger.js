// src/docs/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'API de Práctica - Documentación',
            version: '1.0.0',
            description: 'API REST robusta desarrollada con node.js, express y mongoose, implementando seguridad avanzada y rate limiting.',
        },
        servers: [
            {
                url: 'http://localhost:{port}',
                description: 'Servidor de desarrollo local',
                variables: {
                    port: {
                        default: '3000',
                        description: 'Puerto de la API'
                    }
                }
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Introduce tu Access Token obtenido tras el login o register.'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                        email: { type: 'string', format: 'email', example: 'usuario@mail.com' },
                        name: { type: 'string', example: 'Juan' },
                        lastName: { type: 'string', example: 'Pérez' },
                        fullName: { type: 'string', example: 'Juan Pérez' },
                        nif: { type: 'string', example: '12345678A' },
                        role: { type: 'string', enum: ['admin', 'guest'], example: 'admin' },
                        status: { type: 'string', enum: ['pending', 'verified'], example: 'verified' },
                        address: {
                            type: 'object',
                            properties: {
                                street: { type: 'string', example: 'Calle Mayor' },
                                number: { type: 'string', example: '1A' },
                                postal: { type: 'string', example: '28001' },
                                city: { type: 'string', example: 'Madrid' },
                                province: { type: 'string', example: 'Madrid' }
                            }
                        },
                        company: { type: 'string', example: '60d0fe4f5311236168a109cb', description: 'ID de la compañía a la que pertenece' },
                        deleted: { type: 'boolean', example: false },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Company: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109cb' },
                        name: { type: 'string', example: 'Mi Empresa SL' },
                        cif: { type: 'string', example: 'B12345678' },
                        address: { type: 'string', example: 'Av. Empresa 123' },
                        isFreelance: { type: 'boolean', example: true },
                        owner: { type: 'string', example: '60d0fe4f5311236168a109ca', description: 'ID del User (Owner)' },
                        logo: { type: 'string', format: 'uri', example: 'http://localhost:3000/uploads/logo.png' },
                        deleted: { type: 'boolean', example: false },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                LoginInput: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'usuario@mail.com' },
                        password: { type: 'string', format: 'password', example: 'Secret123!' }
                    }
                },
                RegisterInput: {
                    type: 'object',
                    required: ['email', 'password', 'name', 'lastName'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'usuario@mail.com' },
                        password: { type: 'string', format: 'password', example: 'Secret123!' },
                        name: { type: 'string', example: 'Juan' },
                        lastName: { type: 'string', example: 'Pérez' },
                        nif: { type: 'string', example: '12345678A' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'error' },
                        message: { type: 'string', example: 'Descripción detallada del error' }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);
