import { jest, describe, it, beforeEach, expect } from '@jest/globals';

// Mocks de modelos
const MockClient: any = jest.fn();
MockClient.find = jest.fn();

jest.unstable_mockModule('../src/models/client.model.js', () => ({
    Client: MockClient
}));

// Mock de AppError (necesario por las importaciones)
jest.unstable_mockModule('../src/utils/AppError.js', () => ({
    AppError: class AppError extends Error {
        statusCode: number;
        constructor(message: string, statusCode: number) {
            super(message);
            this.statusCode = statusCode;
        }
    }
}));

const { getAllClients } = await import('../src/controllers/client.controller.js');
const { Client } = await import('../src/models/client.model.js');

describe('Multi-tenant Isolation Test', () => {
    let res: any;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    it('debería retornar solo clientes de la Compañía A para el Usuario A', async () => {
        const reqA: any = {
            user: { _id: 'userA', company: 'companyA' }
        };
        const clientsA = [{ name: 'Cliente A1', company: 'companyA' }];
        (Client.find as any).mockResolvedValue(clientsA);

        await getAllClients(reqA, res);

        // Verificamos que el filtro de Mongoose incluya la compañía A
        expect(Client.find).toHaveBeenCalledWith({ company: 'companyA', deleted: false });
        expect(res.json).toHaveBeenCalledWith(clientsA);
    });

    it('debería retornar solo clientes de la Compañía B para el Usuario B', async () => {
        const reqB: any = {
            user: { _id: 'userB', company: 'companyB' }
        };
        const clientsB = [{ name: 'Cliente B1', company: 'companyB' }];
        (Client.find as any).mockResolvedValue(clientsB);

        await getAllClients(reqB, res);

        // Verificamos que el filtro de Mongoose incluya la compañía B
        expect(Client.find).toHaveBeenCalledWith({ company: 'companyB', deleted: false });
        expect(res.json).toHaveBeenCalledWith(clientsB);
    });

    it('el Usuario A NO debería poder ver nunca datos de la Compañía B', async () => {
        const reqA: any = {
            user: { _id: 'userA', company: 'companyA' }
        };

        await getAllClients(reqA, res);

        // Verificamos que NO se haya llamado con la compañía B
        const lastCall: any = (Client.find as jest.Mock).mock.calls[0][0];
        expect(lastCall.company).toBe('companyA');
        expect(lastCall.company).not.toBe('companyB');
    });
});
