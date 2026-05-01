// src/docs/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'API de Práctica - Documentación Final',
            version: '1.0.0',
            description: 'API REST robusta desarrollada con node.js, express y mongoose, implementando seguridad avanzada y rate limiting.',
        },
        servers: [
            {
                url: 'https://repoprograwebservidor-production.up.railway.app',
                description: 'Servidor de producción (Railway)'
            },
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
                RefreshTokenInput: {
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                        refreshToken: { type: 'string', example: 'a1b2c3d4e5f6g7h8i9j0' }
                    }
                },
                TokenPairResponse: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                        refreshToken: { type: 'string', example: 'a1b2c3d4e5f6g7h8i9j0' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'error' },
                        message: { type: 'string', example: 'Descripción detallada del error' }
                    }
                },
                Client: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109cc' },
                        name: { type: 'string', example: 'Cliente S.A.' },
                        cif: { type: 'string', example: 'A12345678' },
                        email: { type: 'string', format: 'email', example: 'cliente@mail.com' },
                        phone: { type: 'string', example: '912345678' },
                        deleted: { type: 'boolean', example: false }
                    }
                },
                Project: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109cd' },
                        name: { type: 'string', example: 'Proyecto Web' },
                        projectCode: { type: 'string', example: 'PRJ-001' },
                        active: { type: 'boolean', example: true },
                        deleted: { type: 'boolean', example: false }
                    }
                },
                DeliveryNote: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109ce' },
                        format: { type: 'string', enum: ['material', 'hours'] },
                        description: { type: 'string' },
                        workDate: { type: 'string', format: 'date' },
                        signed: { type: 'boolean', example: false }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.ts', './dist/routes/*.js', './src/app.ts', './dist/app.js']
};

export default swaggerJsdoc(options);
