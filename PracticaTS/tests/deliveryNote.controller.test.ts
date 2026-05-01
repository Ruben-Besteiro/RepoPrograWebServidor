import { jest, it, expect, describe, beforeEach } from '@jest/globals';

// Mocks de modelos
const MockDeliveryNote: any = jest.fn();
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

const uploadToCloudinaryMock = jest.fn<(...args: any[]) => Promise<{ secure_url: string }>>()
    .mockResolvedValue({ secure_url: 'https://mocked.signature/url' });

jest.unstable_mockModule('../src/utils/cloudinary.js', () => ({
    uploadToCloudinary: uploadToCloudinaryMock
}));

let fileStreamFinishCallback: (() => void) | null = null;
const mockFileStream: any = {
    on: jest.fn((event: string, cb: () => void) => {
        console.log('[debug] fileStream.on called', event);
        if (event === 'finish') fileStreamFinishCallback = cb;
        return mockFileStream;
    }),
    once: jest.fn((event: string, cb: () => void) => {
        console.log('[debug] fileStream.once called', event);
        if (event === 'finish') fileStreamFinishCallback = cb;
        return mockFileStream;
    }),
    emit: jest.fn((event: string) => {
        console.log('[debug] fileStream.emit called', event);
        if (event === 'finish' && fileStreamFinishCallback) {
            console.log('[debug] fileStream emitting finish');
            fileStreamFinishCallback();
        }
        return mockFileStream;
    })
};

const createWriteStreamMock = jest.fn<(path: string) => any>().mockImplementation((path: string) => {
    console.log('[debug] createWriteStream called with', path);
    return mockFileStream;
});
const existsSyncMock = jest.fn<(path: string) => boolean>();
const mkdirSyncMock = jest.fn<(path: string, options: { recursive: boolean }) => void>();

const mockPdfDoc: any = {
    pipe: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    image: jest.fn().mockReturnThis(),
    page: { height: 800 },
    end: jest.fn().mockImplementation(() => {
        console.log('[debug] mockPdfDoc.end called');
        if (fileStreamFinishCallback) {
            console.log('[debug] finishing file stream');
            fileStreamFinishCallback();
        }
    })
};

jest.unstable_mockModule('pdfkit', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockPdfDoc)
}));

jest.unstable_mockModule('fs', () => ({
    __esModule: true,
    default: {
        existsSync: existsSyncMock,
        mkdirSync: mkdirSyncMock,
        createWriteStream: createWriteStreamMock
    },
    existsSync: existsSyncMock,
    mkdirSync: mkdirSyncMock,
    createWriteStream: createWriteStreamMock
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

const { createDeliveryNote, signDeliveryNote, getAllDeliveryNotes, getDeliveryNoteById, deleteDeliveryNote, downloadDeliveryNotePDF } = await import('../src/controllers/deliveryNote.controller.js');
const { DeliveryNote } = await import('../src/models/deliveryNote.model.js');
const { Project } = await import('../src/models/project.model.js');
const { Client } = await import('../src/models/client.model.js');
const { AppError } = await import('../src/utils/AppError.js');
const { uploadToCloudinary } = await import('../src/utils/cloudinary.js');

describe('DeliveryNote Controller', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        fileStreamFinishCallback = null;
        req = {
            params: {},
            query: {},
            body: {},
            user: { _id: 'user123', company: 'company123' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('createDeliveryNote', () => {
        it('debería crear un albarán si proyecto y cliente son válidos', async () => {
            req.body = { project: 'p1', client: 'c1', format: 'hours' };
            (Project.findById as any).mockResolvedValue({ _id: 'p1', deleted: false });
            (Client.findById as any).mockResolvedValue({ _id: 'c1', deleted: false });

            const saveMock = (jest.fn() as any).mockResolvedValue(true);
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
            (Project.findById as any).mockResolvedValue({ _id: 'p1', deleted: true });

            await expect(createDeliveryNote(req, res)).rejects.toThrow('ERROR_PROJECT_IS_ARCHIVED');
        });

        it('debería lanzar error si el proyecto no existe', async () => {
            req.body = { project: 'p1', client: 'c1' };
            (Project.findById as any).mockResolvedValue(null);
            await expect(createDeliveryNote(req, res)).rejects.toThrow('ERROR_PROJECT_NOT_FOUND');
        });

        it('debería lanzar error si el cliente no existe', async () => {
            req.body = { project: 'p1', client: 'c1' };
            (Project.findById as any).mockResolvedValue({ _id: 'p1', deleted: false });
            (Client.findById as any).mockResolvedValue(null);
            await expect(createDeliveryNote(req, res)).rejects.toThrow('ERROR_CLIENT_NOT_FOUND');
        });

        it('debería lanzar error si el cliente está archivado', async () => {
            req.body = { project: 'p1', client: 'c1' };
            (Project.findById as any).mockResolvedValue({ _id: 'p1', deleted: false });
            (Client.findById as any).mockResolvedValue({ _id: 'c1', deleted: true });
            await expect(createDeliveryNote(req, res)).rejects.toThrow('ERROR_CLIENT_IS_ARCHIVED');
        });

        it('debería lanzar error si el usuario no tiene compañía', async () => {
            req.user = { _id: 'user1', company: null };
            req.body = { project: 'p1', client: 'c1' };

            await expect(createDeliveryNote(req, res)).rejects.toThrow('ERROR_USER_HAS_NO_COMPANY');
        });
    });

    describe('signDeliveryNote', () => {        it('debería fallar si no hay archivo', async () => {
            req.params.id = 'dn1';
            req.file = null;
            await expect(signDeliveryNote(req, res)).rejects.toThrow('ERROR_SIGNATURE_REQUIRED');
        });
        it('debería marcar el albarán como firmado', async () => {
            req.params.id = 'dn1';
            req.file = { buffer: Buffer.from('fake-signature') };
            (DeliveryNote.findByIdAndUpdate as any).mockResolvedValue({ _id: 'dn1', signed: true });

            await signDeliveryNote(req, res);

            expect(DeliveryNote.findByIdAndUpdate).toHaveBeenCalledWith('dn1', expect.objectContaining({ signed: true }), { new: true });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debería lanzar error si no existe', async () => {
            req.params.id = 'dn1';
            req.file = { buffer: Buffer.from('fake-signature') };
            (DeliveryNote.findByIdAndUpdate as any).mockResolvedValue(null);
            await expect(signDeliveryNote(req, res)).rejects.toThrow('ERROR_DELIVERY_NOTE_NOT_FOUND');
        });
    });

    describe('getAllDeliveryNotes', () => {
        it('debería retornar todos los albaranes activos', async () => {
            const chainMock: any = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue([{ _id: 'dn1' }])
            };
            (DeliveryNote.find as any).mockReturnValue(chainMock);
            await getAllDeliveryNotes(req, res);
            expect(DeliveryNote.find).toHaveBeenCalledWith({ deleted: false });
            expect(chainMock.sort).toHaveBeenCalledWith({ createdAt: -1 });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debería aplicar filtros avanzados y paginar resultados', async () => {
            req.query = {
                signed: false,
                company: 'c1',
                project: 'p1',
                client: 'c2',
                startDate: '2026-01-01',
                endDate: '2026-01-31',
                search: 'test',
                page: '2',
                limit: '5'
            };
            const chainMock: any = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue([{ _id: 'dn2' }])
            };
            (DeliveryNote.find as any).mockReturnValue(chainMock);

            await getAllDeliveryNotes(req, res);

            const filterArg = ((DeliveryNote.find as jest.Mock).mock.calls[0][0]) as any;
            expect(filterArg.deleted).toBe(false);
            expect(filterArg.signed).toBe(false);
            expect(filterArg.company).toBe('c1');
            expect(filterArg.project).toBe('p1');
            expect(filterArg.client).toBe('c2');
            expect(filterArg.description).toEqual({ $regex: 'test', $options: 'i' });
            expect(filterArg.workDate).toEqual(expect.objectContaining({ $gte: expect.any(Date), $lte: expect.any(Date) }));
            expect(chainMock.skip).toHaveBeenCalledWith(5);
            expect(chainMock.limit).toHaveBeenCalledWith(5);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getDeliveryNoteById', () => {
        it('debería retornar un albarán si existe', async () => {
            req.params.id = 'dn1';
            const mockPopulate = (jest.fn() as any).mockResolvedValue({ _id: 'dn1' });
            (DeliveryNote.findById as any).mockReturnValue({ populate: mockPopulate });

            await getDeliveryNoteById(req, res);

            expect(mockPopulate).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debería lanzar error si no existe', async () => {
            req.params.id = 'dn1';
            const mockPopulate = (jest.fn() as any).mockResolvedValue(null);
            (DeliveryNote.findById as any).mockReturnValue({ populate: mockPopulate });

            await expect(getDeliveryNoteById(req, res)).rejects.toThrow('ERROR_DELIVERY_NOTE_NOT_FOUND');
        });
    });

    describe('downloadDeliveryNotePDF', () => {
        it('debería descargar el PDF de un albarán pendiente de firma', async () => {
            req.params.id = 'dn1';
            const deliveryNote: any = {
                _id: 'dn1',
                company: {
                    name: 'Empresa Test',
                    cif: 'B12345678',
                    address: { street: 'Calle', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' }
                },
                client: {
                    name: 'Cliente Test',
                    cif: 'C12345678',
                    address: { street: 'Calle 2', number: '4', postal: '28002', city: 'Madrid', province: 'Madrid' }
                },
                project: { name: 'Proyecto X', projectCode: 'PX-001' },
                workDate: '2026-05-01',
                format: 'material',
                description: 'Descripción de prueba',
                quantity: 5,
                unit: 'uds',
                material: 'Material X',
                signed: false
            };
            const mockPopulate: any = {
                populate: jest.fn(function (this: any) { return this; }),
                then: jest.fn((resolve: any) => resolve(deliveryNote))
            };
            (DeliveryNote.findById as any).mockReturnValue(mockPopulate);
            existsSyncMock.mockReturnValue(false);
            const downloadMock = jest.fn((outputPath: string, filename: string, cb: any) => cb(null));
            res.download = downloadMock;

            await downloadDeliveryNotePDF(req, res);

            expect(DeliveryNote.findById).toHaveBeenCalledWith('dn1');
            expect(mockPopulate.populate).toHaveBeenCalledTimes(4);
            expect(createWriteStreamMock).toHaveBeenCalled();
            expect(res.download).toHaveBeenCalledWith(expect.stringContaining('storage'), 'delivery_note_dn1.pdf', expect.any(Function));
        });

        it('debería descargar el PDF con logo interno y firma si está firmado', async () => {
            req.params.id = 'dn1';
            const deliveryNote: any = {
                _id: 'dn1',
                company: {
                    name: 'Empresa Test',
                    logo: 'http://localhost/storage/logo.png',
                    cif: 'B12345678',
                    address: { street: 'Calle', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' }
                },
                client: {
                    name: 'Cliente Test',
                    cif: 'C12345678',
                    address: { street: 'Calle 2', number: '4', postal: '28002', city: 'Madrid', province: 'Madrid' }
                },
                project: { name: 'Proyecto X', projectCode: 'PX-001' },
                workDate: '2026-05-01',
                format: 'hours',
                description: 'Descripción de prueba',
                hours: 8,
                workers: [{ name: 'Juan', hours: 4 }, { name: 'Ana', hours: 4 }],
                signed: true,
                signedAt: '2026-05-01T10:00:00.000Z',
                signatureUrl: 'http://localhost/storage/signature.png'
            };
            const mockPopulate: any = {
                populate: jest.fn(function (this: any) { return this; }),
                then: jest.fn((resolve: any) => resolve(deliveryNote))
            };
            (DeliveryNote.findById as any).mockReturnValue(mockPopulate);
            existsSyncMock.mockImplementation((path: string) => path.includes('logo.png') || path.includes('signature.png'));
            const downloadMock = jest.fn((outputPath: string, filename: string, cb: any) => cb(null));
            res.download = downloadMock;

            await downloadDeliveryNotePDF(req, res);

            expect(createWriteStreamMock).toHaveBeenCalled();
            expect(mockPdfDoc.image).toHaveBeenCalled();
            expect(res.download).toHaveBeenCalledWith(expect.stringContaining('storage'), 'delivery_note_dn1.pdf', expect.any(Function));
        });

        it('debería enviar error 500 si res.download falla', async () => {
            req.params.id = 'dn1';
            const deliveryNote: any = {
                _id: 'dn1',
                company: { name: 'Empresa Test', logo: 'http://localhost/storage/logo.png' },
                client: { name: 'Cliente Test' },
                project: { name: 'Proyecto X' },
                workDate: '2026-05-01',
                format: 'hours',
                description: 'Descripción de prueba',
                hours: 8,
                signed: false
            };
            const mockPopulate: any = {
                populate: jest.fn(function (this: any) { return this; }),
                then: jest.fn((resolve: any) => resolve(deliveryNote))
            };
            (DeliveryNote.findById as any).mockReturnValue(mockPopulate);
            existsSyncMock.mockReturnValue(true);
            res.download = jest.fn((outputPath: string, filename: string, cb: any) => cb(new Error('download failed')));
            res.headersSent = false;

            await downloadDeliveryNotePDF(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('ERROR_DOWNLOAD_DELIVERY_NOTE');
        });

        it('debería lanzar error interno si ocurre un error inesperado', async () => {
            req.params.id = 'dn1';
            (DeliveryNote.findById as any).mockImplementation(() => { throw new Error('boom'); });

            await expect(downloadDeliveryNotePDF(req, res)).rejects.toThrow('ERROR_DOWNLOAD_DELIVERY_NOTE');
        });

        it('debería lanzar error si no existe el albarán', async () => {
            req.params.id = 'dn1';
            const mockPopulate: any = {
                populate: jest.fn(function (this: any) { return this; }),
                then: jest.fn((resolve: any) => resolve(null))
            };
            (DeliveryNote.findById as any).mockReturnValue(mockPopulate);

            await expect(downloadDeliveryNotePDF(req, res)).rejects.toThrow('ERROR_DELIVERY_NOTE_NOT_FOUND');
        });
    });

    describe('deleteDeliveryNote', () => {
        it('debería borrar si no está firmado', async () => {
            req.params.id = 'dn1';
            (DeliveryNote.findById as any).mockResolvedValue({ _id: 'dn1', signed: false });
            (DeliveryNote.deleteOne as any).mockResolvedValue({ deletedCount: 1 });

            await deleteDeliveryNote(req, res);

            expect(DeliveryNote.deleteOne).toHaveBeenCalledWith({ _id: 'dn1' });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debería lanzar error si ya está firmado', async () => {
            req.params.id = 'dn1';
            (DeliveryNote.findById as any).mockResolvedValue({ _id: 'dn1', signed: true });

            await expect(deleteDeliveryNote(req, res)).rejects.toThrow('ERROR_DELIVERY_NOTE_IS_SIGNED');
        });

        it('debería lanzar error si no existe', async () => {
            req.params.id = 'dn1';
            (DeliveryNote.findById as any).mockResolvedValue(null);
            await expect(deleteDeliveryNote(req, res)).rejects.toThrow('ERROR_DELIVERY_NOTE_NOT_FOUND');
        });
    });
});
