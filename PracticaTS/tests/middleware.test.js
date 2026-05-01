import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { AppError } from '../src/utils/AppError.js';
import { checkRole } from '../src/middleware/role.middleware.js';
import { notFound, errorHandler } from '../src/middleware/error.middleware.js';
describe('Middlewares', () => {
    describe('role.middleware.js', () => {
        let req;
        let res;
        let next;
        beforeEach(() => {
            req = { user: {} };
            res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            next = jest.fn();
        });
        it('debe lanzar unauthorized si no hay user', () => {
            req.user = undefined;
            const middleware = checkRole(['admin']);
            expect(() => middleware(req, res, next)).toThrow(AppError);
        });
        it('debe lanzar unauthorized si el rol no esta permitido', () => {
            req.user = { role: 'freelance' };
            const middleware = checkRole(['admin']);
            expect(() => middleware(req, res, next)).toThrow(AppError);
        });
        it('debe llamar a next() si el rol es válido', () => {
            req.user = { role: 'admin' };
            const middleware = checkRole(['admin', 'guest']);
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
    describe('error.middleware.js', () => {
        let req;
        let res;
        let next;
        beforeEach(() => {
            req = {};
            res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            next = jest.fn();
        });
        it('notFound debe crear un error 404', () => {
            req.originalUrl = '/ruta/falsa';
            notFound(req, res, next);
            expect(next).toHaveBeenCalled();
            const calledArg = next.mock.calls[0][0];
            expect(calledArg).toBeInstanceOf(Error);
        });
        it('errorHandler debe formatear AppError en dev', () => {
            process.env.NODE_ENV = 'development';
            const error = AppError.badRequest('Test message');
            errorHandler(error, req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'fail',
                message: 'Test message',
                stack: expect.any(String)
            }));
        });
        it('errorHandler debe ocultar detalles en production para errores genéricos', () => {
            process.env.NODE_ENV = 'production';
            const error = new Error('Generic internal error');
            errorHandler(error, req, res, next);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                status: 'error',
                message: 'Algo salió muy mal'
            });
        });
    });
});
