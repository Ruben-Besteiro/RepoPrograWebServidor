import { jest, describe, expect, it, beforeEach } from '@jest/globals';
import { AppError } from '../src/utils/AppError.js';

// Mocks
jest.unstable_mockModule('../src/models/company.model.js', () => ({
    Company: {
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        find: jest.fn(),
        findByIdAndDelete: jest.fn()
    }
}));
jest.unstable_mockModule('../src/utils/cloudinary.js', () => ({
    uploadToCloudinary: jest.fn()
}));

const { createCompany, updateCompany, getCompanies, deleteCompany, editLogo } = await import('../src/controllers/company.controller.js');
const { Company } = await import('../src/models/company.model.js');
const { uploadToCloudinary } = await import('../src/utils/cloudinary.js');

describe('Company Controller', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            user: {},
            file: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('createCompany', () => {
        it('debe crear una compañía correctamente', async () => {
            req.body = { name: 'Empresa Test', cif: 'B123456' };
            const mockCompany = { ...req.body, save: jest.fn() };
            (Company.create as any).mockResolvedValue(mockCompany);

            await createCompany(req, res);

            expect(Company.create).toHaveBeenCalledWith(req.body);
            expect(mockCompany.isFreelance).toBe(false);
            expect(mockCompany.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ data: mockCompany });
        });

        it('debe lanzar AppError.internal si hay error y es atrapado en el catch', async () => {
            (Company.create as any).mockRejectedValue(new Error('Mongoose Error'));
            try {
                await createCompany(req, res);
                throw new Error('No debió resolverse');
            } catch (err) {
                expect(err).toBeInstanceOf(AppError);
            }
        });
    });

    describe('updateCompany', () => {
        it('debe actualizar la compañía', async () => {
            req.params.id = '123';
            req.body = { name: 'Nuevo nombre' };
            (Company.findByIdAndUpdate as any).mockResolvedValue(req.body);

            await updateCompany(req, res);

            expect(Company.findByIdAndUpdate).toHaveBeenCalledWith('123', req.body, { new: true, runValidators: true });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ data: req.body });
        });

        it('debe lanzar AppError en la actualización si falla la BD', async () => {
            (Company.findByIdAndUpdate as any).mockRejectedValue(new Error('Mongoose Error'));
            try {
                await updateCompany(req, res);
                throw new Error('Expected to throw');
            } catch (e) {
                expect(e).toBeInstanceOf(AppError);
            }
        });
    });

    describe('getCompanies', () => {
        it('debe devolver la lista de compañías', async () => {
            const arr = [{ name: 'Test1' }];
            (Company.find as any).mockResolvedValue(arr);

            await getCompanies(req, res);

            expect(Company.find).toHaveBeenCalledWith({ deleted: false });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ data: arr });
        });

        it('debe lanzar error interno en el catch', async () => {
            (Company.find as any).mockRejectedValue(new Error('Mongoose Error'));
            try {
                await getCompanies(req, res);
                throw new Error('Expected to throw');
            } catch (e) {
                expect(e).toBeInstanceOf(AppError);
            }
        });
    });

    describe('deleteCompany', () => {
        it('debe borrar una compañía por ID', async () => {
            req.params.id = '123';
            (Company.findByIdAndDelete as any).mockResolvedValue({ _id: '123' });

            await deleteCompany(req, res);

            expect(Company.findByIdAndDelete).toHaveBeenCalledWith('123');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debe atrapar error en delete', async () => {
            (Company.findByIdAndDelete as any).mockRejectedValue(new Error('Mongoose Error'));
            try {
                await deleteCompany(req, res);
                throw new Error('Expected to throw');
            } catch (e) {
                expect(e).toBeInstanceOf(AppError);
            }
        });
    });

    describe('editLogo', () => {
        const PUBLIC_URL = 'http://localhost:3000';
        beforeEach(() => {
            process.env.PUBLIC_URL = PUBLIC_URL;
        });

        it('debe fallar si no hay archivo subido', async () => {
            req.file = null;
            try {
                await editLogo(req, res);
                throw new Error('Expected to throw');
            } catch (e) {
                expect(e).toBeInstanceOf(AppError);
            }
        });

        it('debe fallar si el usuario no tiene compañía asociada', async () => {
            req.file = { filename: 'dummy.png' };
            req.user = { company: null };
            try {
                await editLogo(req, res);
                throw new Error('Expected to throw');
            } catch (e) {
                expect(e).toBeInstanceOf(AppError);
            }
        });

        it('debe subir el archivo y actualizar la compañía', async () => {
            req.file = { filename: 'dummy.png', buffer: Buffer.from('dummy') };
            req.user = { company: { _id: 'company123' } };
            const expectedUrl = `${PUBLIC_URL}/uploads/dummy.png`;
            (uploadToCloudinary as any).mockResolvedValue({ secure_url: expectedUrl });
            (Company.findByIdAndUpdate as any).mockResolvedValue({ logo: expectedUrl });

            await editLogo(req, res);

            expect(Company.findByIdAndUpdate).toHaveBeenCalledWith(
                'company123',
                { logo: expectedUrl },
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'LOGO_UPDATED', data: { logo: expectedUrl } });
        });

        it('debe fallar si hay excepción en la actualización', async () => {
            req.file = { filename: 'dummy.png', buffer: Buffer.from('dummy') };
            req.user = { company: { _id: 'company123' } };
            (uploadToCloudinary as any).mockResolvedValue({ secure_url: `${PUBLIC_URL}/uploads/dummy.png` });
            (Company.findByIdAndUpdate as any).mockRejectedValue(new Error('Mongoose Error'));
            try {
                await editLogo(req, res);
                throw new Error('Expected to throw');
            } catch (e) {
                expect(e).toBeInstanceOf(AppError);
            }
        });
    });
});
