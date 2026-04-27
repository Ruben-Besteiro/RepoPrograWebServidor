import { jest, expect, it, beforeEach, afterEach, describe } from '@jest/globals';

// Mocks de modelos
const MockProject: any = jest.fn();
MockProject.create = jest.fn();
MockProject.find = jest.fn();
MockProject.findById = jest.fn();
MockProject.findOneAndUpdate = jest.fn();

jest.unstable_mockModule('../src/models/project.model.js', () => ({
    Project: MockProject
}));

jest.unstable_mockModule('../src/models/client.model.js', () => ({
    Client: {
        findById: jest.fn()
    }
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

const { createProject, updateProject, deleteProject, getAllProjects, getProjectById, archiveProject, restoreProject, getArchivedProjects } = await import('../src/controllers/project.controller.js');
const { Project } = await import('../src/models/project.model.js');
const { Client } = await import('../src/models/client.model.js');
const { AppError } = await import('../src/utils/AppError.js');

describe('Project Controller', () => {
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

    describe('createProject', () => {
        it('debería crear un proyecto si el cliente existe y no está archivado', async () => {
            req.body = { name: 'Proyecto A', client: 'client123' };
            (Client.findById as any).mockResolvedValue({ _id: 'client123', deleted: false });

            const saveMock = (jest.fn() as any).mockResolvedValue(true);
            // @ts-ignore
            Project.mockImplementation(() => ({
                ...req.body,
                save: saveMock
            }));

            await createProject(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(saveMock).toHaveBeenCalled();
        });

        it('debería lanzar error si el cliente está archivado', async () => {
            req.body = { client: 'client123' };
            (Client.findById as any).mockResolvedValue({ _id: 'client123', deleted: true });

            await expect(createProject(req, res)).rejects.toThrow('ERROR_CLIENT_IS_ARCHIVED');
        });
    });

    it('debería lanzar error si el cliente no existe', async () => {
        req.body = { client: 'none' };
        (Client.findById as any).mockResolvedValue(null);
        await expect(createProject(req, res)).rejects.toThrow('ERROR_CLIENT_NOT_FOUND');
    });

    describe('updateProject', () => {
        it('debería actualizar un proyecto activo', async () => {
            req.params.id = 'p123';
            req.body = { name: 'Nuevo Nombre' };
            const projectMock = { _id: 'p123', save: (jest.fn() as any).mockResolvedValue(true) };
            (Project.findOneAndUpdate as any).mockResolvedValue(projectMock);

            await updateProject(req, res);

            expect(Project.findOneAndUpdate).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debería lanzar error si no existe o está archivado', async () => {
            req.params.id = 'none';
            (Project.findOneAndUpdate as any).mockResolvedValue(null);
            await expect(updateProject(req, res)).rejects.toThrow('ERROR_PROJECT_NOT_FOUND_OR_ARCHIVED');
        });
    });

    describe('deleteProject', () => {
        it('debería marcar como borrado (soft delete)', async () => {
            req.params.id = 'p123';
            const saveMock = (jest.fn() as any).mockResolvedValue(true);
            (Project.findById as any).mockResolvedValue({ _id: 'p123', save: saveMock });

            await deleteProject(req, res);

            expect(saveMock).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debería lanzar error si no existe', async () => {
            req.params.id = 'none';
            (Project.findById as any).mockResolvedValue(null);
            await expect(deleteProject(req, res)).rejects.toThrow('ERROR_PROJECT_NOT_FOUND');
        });
    });

    describe('getAllProjects', () => {
        it('debería retornar proyectos no borrados', async () => {
            (Project.find as any).mockResolvedValue([{ name: 'P1' }]);
            await getAllProjects(req, res);
            expect(Project.find).toHaveBeenCalledWith({ deleted: false });
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getProjectById', () => {
        it('debería retornar el proyecto si existe', async () => {
            req.params.id = 'p123';
            (Project.findById as any).mockResolvedValue({ _id: 'p123', deleted: false });

            await getProjectById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debería lanzar error si el proyecto no existe', async () => {
            req.params.id = 'p123';
            (Project.findById as any).mockResolvedValue(null);

            await expect(getProjectById(req, res)).rejects.toThrow('ERROR_PROJECT_NOT_FOUND');
        });

        it('debería lanzar error si está archivado', async () => {
            req.params.id = 'p123';
            (Project.findById as any).mockResolvedValue({ _id: 'p123', deleted: true });
            await expect(getProjectById(req, res)).rejects.toThrow('ERROR_PROJECT_IS_ARCHIVED');
        });
    });

    describe('archive/restore/listArchived', () => {
        it('debería archivar un proyecto', async () => {
            req.params.id = 'p1';
            const saveMock = (jest.fn() as any).mockResolvedValue(true);
            (Project.findById as any).mockResolvedValue({ _id: 'p1', save: saveMock });
            await archiveProject(req, res);
            expect(saveMock).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debería restaurar un proyecto', async () => {
            req.params.id = 'p1';
            const saveMock = (jest.fn() as any).mockResolvedValue(true);
            (Project.findById as any).mockResolvedValue({ _id: 'p1', save: saveMock });
            await restoreProject(req, res);
            expect(saveMock).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debería listar archivados', async () => {
            (Project.find as any).mockResolvedValue([]);
            await getArchivedProjects(req, res);
            expect(Project.find).toHaveBeenCalledWith({ deleted: true });
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
