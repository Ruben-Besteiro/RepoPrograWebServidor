import { jest, describe, it, beforeEach, expect } from '@jest/globals';

// Mocks de modelos
const MockClient: any = jest.fn();
MockClient.create = jest.fn();
MockClient.find = jest.fn();
MockClient.findById = jest.fn();
MockClient.findOneAndUpdate = jest.fn();
MockClient.deleteOne = jest.fn();

jest.unstable_mockModule('../src/models/client.model.js', () => ({
    Client: MockClient
}));

// Mock de AppError
jest.unstable_mockModule('../src/utils/AppError.js', () => ({
    AppError: class AppError extends Error {
        statusCode: number;
        constructor(message: string, statusCode: number) {
            super(message);
            this.statusCode = statusCode;
        }
        static internal(msg: string) { return new AppError(msg, 500); }
    }
}));

const { createClient, updateClient, getAllClients, getClientById, deleteClient, archiveClient, restoreClient, getArchivedClients } = await import('../src/controllers/client.controller.js');
const { Client } = await import('../src/models/client.model.js');
const { AppError } = await import('../src/utils/AppError.js');

describe('Client Controller', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        req = {
            params: {},
            body: {},
            user: { _id: 'user123', company: 'company123' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('createClient', () => {
        it('debería crear un cliente con éxito', async () => {
            req.body = { name: 'Cliente Test', email: 'test@client.com' };
            const saveMock = (jest.fn() as any).mockResolvedValue(true);

            // @ts-expect-error mock static Client model implementation
            Client.mockImplementation(() => ({
                ...req.body,
                save: saveMock,
                toJSON: () => req.body
            }));

            await createClient(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(saveMock).toHaveBeenCalled();
        });
    });

    describe('updateClient', () => {
        it('debería actualizar un cliente si existe y no está archivado', async () => {
            req.params.id = 'client123';
            req.body = { name: 'Nuevo Nombre' };

            const clientMock = {
                _id: 'client123',
                save: (jest.fn() as any).mockResolvedValue(true)
            };
            (Client.findOneAndUpdate as any).mockResolvedValue(clientMock);

            await updateClient(req, res);

            expect(Client.findOneAndUpdate).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debería lanzar error si el cliente no existe o está archivado', async () => {
            req.params.id = 'invalid';
            (Client.findOneAndUpdate as any).mockResolvedValue(null);

            await expect(updateClient(req, res)).rejects.toThrow('ERROR_CLIENT_NOT_FOUND_OR_ARCHIVED');
        });
    });

    describe('getAllClients', () => {
        it('debería retornar todos los clientes no borrados', async () => {
            const mockClients = [{ name: 'C1' }, { name: 'C2' }];
            (Client.find as any).mockResolvedValue(mockClients);

            await getAllClients(req, res);

            expect(Client.find).toHaveBeenCalledWith({ deleted: false });
            expect(res.json).toHaveBeenCalledWith(mockClients);
        });
    });

    describe('getClientById', () => {
        it('debería retornar un cliente si existe', async () => {
            req.params.id = 'c1';
            const mockClient = { _id: 'c1', deleted: false };
            (Client.findById as any).mockResolvedValue(mockClient);

            await getClientById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockClient);
        });

        it('debería lanzar error si está archivado', async () => {
            req.params.id = 'c1';
            (Client.findById as any).mockResolvedValue({ _id: 'c1', deleted: true });

            await expect(getClientById(req, res)).rejects.toThrow('ERROR_CLIENT_IS_ARCHIVED');
        });
    });

    describe('deleteClient', () => {
        it('debería borrar físicamente el cliente', async () => {
            req.params.id = 'c1';
            (Client.findById as any).mockResolvedValue({ _id: 'c1' });
            (Client.deleteOne as any).mockResolvedValue({ deletedCount: 1 });

            await deleteClient(req, res);

            expect(Client.deleteOne).toHaveBeenCalledWith({ _id: 'c1' });
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('archiveClient', () => {
        it('debería marcar el cliente como deleted: true', async () => {
            req.params.id = 'c1';
            const saveMock = (jest.fn() as any).mockResolvedValue(true);
            (Client.findById as any).mockResolvedValue({ _id: 'c1', deleted: false, save: saveMock });

            await archiveClient(req, res);

            expect(saveMock).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debería lanzar error si ya está archivado', async () => {
            req.params.id = 'c1';
            (Client.findById as any).mockResolvedValue({ _id: 'c1', deleted: true });
            await expect(archiveClient(req, res)).rejects.toThrow('ERROR_CLIENT_ALREADY_ARCHIVED');
        });

        it('debería lanzar error si no existe', async () => {
            req.params.id = 'none';
            (Client.findById as any).mockResolvedValue(null);
            await expect(archiveClient(req, res)).rejects.toThrow('ERROR_CLIENT_NOT_FOUND');
        });
    });

    describe('restoreClient', () => {
        it('debería restaurar un cliente archivado', async () => {
            req.params.id = 'c1';
            const saveMock = (jest.fn() as any).mockResolvedValue(true);
            (Client.findById as any).mockResolvedValue({ _id: 'c1', deleted: true, save: saveMock });

            await restoreClient(req, res);

            expect(saveMock).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debería lanzar error si no está archivado', async () => {
            req.params.id = 'c1';
            (Client.findById as any).mockResolvedValue({ _id: 'c1', deleted: false });
            await expect(restoreClient(req, res)).rejects.toThrow('ERROR_CLIENT_NOT_ARCHIVED');
        });
    });

    describe('getArchivedClients', () => {
        it('debería retornar clientes archivados', async () => {
            (Client.find as any).mockResolvedValue([{ name: 'Archived' }]);
            await getArchivedClients(req, res);
            expect(Client.find).toHaveBeenCalledWith({ deleted: true });
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('Errors and Catch blocks', () => {
        it('getClientById falla si no existe', async () => {
            (Client.findById as any).mockResolvedValue(null);
            await expect(getClientById(req, res)).rejects.toThrow('ERROR_CLIENT_NOT_FOUND');
        });

        it('deleteClient falla si no existe', async () => {
            (Client.findById as any).mockResolvedValue(null);
            await expect(deleteClient(req, res)).rejects.toThrow('ERROR_CLIENT_NOT_FOUND');
        });

        it('updateClient falla en el catch', async () => {
            (Client.findOneAndUpdate as any).mockRejectedValue(new Error('DB Error'));
            await expect(updateClient(req, res)).rejects.toThrow('ERROR_UPDATE_CLIENT');
        });
    });
});
