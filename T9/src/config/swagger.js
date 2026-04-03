// src/config/swagger.js
import swaggerJsDoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Biblioteca API',
            version: '1.0.0',
            description: 'API para la gestión de una biblioteca (libros, usuarios, préstamos y reseñas)'
        },
        servers: [
            {
                url: 'http://localhost:3000'
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
                    properties: {
                        id: { type: 'integer' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string' },
                        role: { type: 'string', enum: ['USER', 'LIBRARIAN', 'ADMIN'] }
                    }
                },
                Login: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', format: 'password' }
                    }
                },
                Book: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        isbn: { type: 'string' },
                        title: { type: 'string' },
                        author: { type: 'string' },
                        genre: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        publishedYear: { type: 'integer', nullable: true },
                        copies: { type: 'integer' },
                        availableCopies: { type: 'integer' }
                    }
                },
                Loan: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        bookId: { type: 'integer' },
                        userId: { type: 'integer' },
                        loanDate: { type: 'string', format: 'date-time' },
                        dueDate: { type: 'string', format: 'date-time' },
                        returnDate: { type: 'string', format: 'date-time', nullable: true },
                        status: { type: 'string', enum: ['ACTIVE', 'RETURNED', 'OVERDUE'] }
                    }
                },
                Review: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        bookId: { type: 'integer' },
                        userId: { type: 'integer' },
                        rating: { type: 'integer', minimum: 1, maximum: 5 },
                        comment: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'boolean', example: true },
                        message: { type: 'string' }
                    }
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        data: { type: 'array', items: { type: 'object' } },
                        meta: {
                            type: 'object',
                            properties: {
                                total: { type: 'integer' },
                                page: { type: 'integer' },
                                limit: { type: 'integer' },
                                totalPages: { type: 'integer' }
                            }
                        }
                    }
                }
            },
            responses: {
                Error: {
                    description: "Error genérico de la API",
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js']
};

const swaggerSpecs = swaggerJsDoc(options);
export default swaggerSpecs;
