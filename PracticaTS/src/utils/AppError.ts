// src/utils/AppError.js

export class AppError extends Error {
    public statusCode: number;
    public status: string;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message: string) {
        return new AppError(message, 400);
    }

    static unauthorized(message: string) {
        return new AppError(message, 401);
    }

    static forbidden(message: string) {
        return new AppError(message, 403);
    }

    static notFound(message: string) {
        return new AppError(message, 404);
    }

    static conflict(message: string) {
        return new AppError(message, 409);
    }

    static internal(message: string) {
        return new AppError(message, 500);
    }
}
