import { jest, it, expect, describe, beforeEach } from '@jest/globals';
// Mocks de modelos
const MockDeliveryNote = jest.fn();
MockDeliveryNote.create = jest.fn();
MockDeliveryNote.find = jest.fn();
MockDeliveryNote.findById = jest.fn();
MockDeliveryNote.findByIdAndUpdate = jest.fn();
MockDeliveryNote.findByIdAndDelete = jest.fn();
MockDeliveryNote.deleteOne = jest.fn();
jest.unstable_mockModule('../src/models/deliveryNote.model.js', () => ({
    DeliveryNote: MockDeliveryNote
}));
jest.unstable_mockModule('../src/models/project.model.js', () => ({
    Project: {
        findById: jest.fn()
    }
}));
jest.unstable_mockModule('../src/models/client.model.js', () => ({
    Client: {
        findById: jest.fn()
    }
}));
// Mock de AppError
jest.unstable_mockModule('../src/utils/AppError.js', () => ({
    AppError: class AppError extends Error {
        statusCode;
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
        static internal(msg) { return new AppError(msg, 500); }
    }
}));
const { createDeliveryNote, signDeliveryNote, getAllDeliveryNotes, getDeliveryNoteById, deleteDeliveryNote } = await import('../src/controllers/deliveryNote.controller.js');
const { DeliveryNote } = await import('../src/models/deliveryNote.model.js');
const { Project } = await import('../src/models/project.model.js');
const { Client } = await import('../src/models/client.model.js');
const { AppError } = await import('../src/utils/AppError.js');
describe('DeliveryNote Controller', () => {
    let req;
    let res;
    beforeEach(() => {
        req = {
            params: {},
            query: {},
            body: {},
            user: { _id: 'user123', company: 'company123' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });
    describe('createDeliveryNote', () => {
        it('debería crear un albarán si proyecto y cliente son válidos', async () => {
            req.body = { project: 'p1', client: 'c1', format: 'hours' };
            Project.findById.mockResolvedValue({ _id: 'p1', deleted: false });
            Client.findById.mockResolvedValue({ _id: 'c1', deleted: false });
            const saveMock = jest.fn().mockResolvedValue(true);
            // @ts-expect-error mock static DeliveryNote model implementation
            DeliveryNote.mockImplementation(() => ({
                ...req.body,
                save: saveMock
            }));
            await createDeliveryNote(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(saveMock).toHaveBeenCalled();
        });
        it('debería lanzar error si el proyecto está archivado', async () => {
            req.body = { project: 'p1', client: 'c1' };
            Project.findById.mockResolvedValue({ _id: 'p1', deleted: true });
            await expect(createDeliveryNote(req, res)).rejects.toThrow('ERROR_PROJECT_IS_ARCHIVED');
        });
        it('debería lanzar error si el proyecto no existe', async () => {
            req.body = { project: 'p1', client: 'c1' };
            Project.findById.mockResolvedValue(null);
            await expect(createDeliveryNote(req, res)).rejects.toThrow('ERROR_PROJECT_NOT_FOUND');
        });
        it('debería lanzar error si el cliente no existe', async () => {
            req.body = { project: 'p1', client: 'c1' };
            Project.findById.mockResolvedValue({ _id: 'p1', deleted: false });
            Client.findById.mockResolvedValue(null);
            await expect(createDeliveryNote(req, res)).rejects.toThrow('ERROR_CLIENT_NOT_FOUND');
        });
        it('debería lanzar error si el cliente está archivado', async () => {
            req.body = { project: 'p1', client: 'c1' };
            Project.findById.mockResolvedValue({ _id: 'p1', deleted: false });
            Client.findById.mockResolvedValue({ _id: 'c1', deleted: true });
            await expect(createDeliveryNote(req, res)).rejects.toThrow('ERROR_CLIENT_IS_ARCHIVED');
        });
    });
    describe('signDeliveryNote', () => {
        it('debería marcar el albarán como firmado', async () => {
            req.params.id = 'dn1';
            DeliveryNote.findByIdAndUpdate.mockResolvedValue({ _id: 'dn1', signed: true });
            await signDeliveryNote(req, res);
            expect(DeliveryNote.findByIdAndUpdate).toHaveBeenCalledWith('dn1', expect.objectContaining({ signed: true }));
            expect(res.status).toHaveBeenCalledWith(200);
        });
        it('debería lanzar error si no existe', async () => {
            req.params.id = 'dn1';
            DeliveryNote.findByIdAndUpdate.mockResolvedValue(null);
            await expect(signDeliveryNote(req, res)).rejects.toThrow('ERROR_DELIVERY_NOTE_NOT_FOUND');
        });
    });
    describe('getAllDeliveryNotes', () => {
        it('debería retornar todos los albaranes activos', async () => {
            DeliveryNote.find.mockResolvedValue([{ _id: 'dn1' }]);
            await getAllDeliveryNotes(req, res);
            expect(DeliveryNote.find).toHaveBeenCalledWith({ deleted: false });
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
    describe('getDeliveryNoteById', () => {
        it('debería retornar un albarán si existe', async () => {
            req.params.id = 'dn1';
            const mockPopulate = jest.fn().mockResolvedValue({ _id: 'dn1' });
            DeliveryNote.findById.mockReturnValue({ populate: mockPopulate });
            await getDeliveryNoteById(req, res);
            expect(mockPopulate).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
        it('debería lanzar error si no existe', async () => {
            req.params.id = 'dn1';
            const mockPopulate = jest.fn().mockResolvedValue(null);
            DeliveryNote.findById.mockReturnValue({ populate: mockPopulate });
            await expect(getDeliveryNoteById(req, res)).rejects.toThrow('ERROR_DELIVERY_NOTE_NOT_FOUND');
        });
    });
    describe('deleteDeliveryNote', () => {
        it('debería borrar si no está firmado', async () => {
            req.params.id = 'dn1';
            DeliveryNote.findById.mockResolvedValue({ _id: 'dn1', signed: false });
            DeliveryNote.deleteOne.mockResolvedValue({ deletedCount: 1 });
            await deleteDeliveryNote(req, res);
            expect(DeliveryNote.deleteOne).toHaveBeenCalledWith({ _id: 'dn1' });
            expect(res.status).toHaveBeenCalledWith(200);
        });
        it('debería lanzar error si ya está firmado', async () => {
            req.params.id = 'dn1';
            DeliveryNote.findById.mockResolvedValue({ _id: 'dn1', signed: true });
            await expect(deleteDeliveryNote(req, res)).rejects.toThrow('ERROR_DELIVERY_NOTE_IS_SIGNED');
        });
        it('debería lanzar error si no existe', async () => {
            req.params.id = 'dn1';
            DeliveryNote.findById.mockResolvedValue(null);
            await expect(deleteDeliveryNote(req, res)).rejects.toThrow('ERROR_DELIVERY_NOTE_NOT_FOUND');
        });
    });
});
