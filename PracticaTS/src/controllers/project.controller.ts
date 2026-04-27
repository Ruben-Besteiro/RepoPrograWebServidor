import { Request, Response } from 'express';
import { Project } from '../models/project.model.js';
import { AppError } from '../utils/AppError.js';
import { Client } from '../models/client.model.js';

export const createProject = async (req: Request, res: Response) => {
    const client = await Client.findById(req.body.client);
    if (!client) {
        throw new AppError('ERROR_CLIENT_NOT_FOUND', 404);
    }

    if (client.deleted === true) {
        throw new AppError('ERROR_CLIENT_IS_ARCHIVED', 400);
    }

    const project = new Project({ ...req.body, user: req.user!._id, company: req.user!.company });
    project.active = true;
    project.deleted = false;
    project.createdAt = new Date();
    project.updatedAt = new Date();
    await project.save();
    res.status(201).json(project);
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        // Extraemos solo los campos que permitimos actualizar
        const { name, client, projectCode, address, email, notes, active } = req.body;
        const updateData: any = { name, client, projectCode, address, email, notes, active };

        // Eliminamos las propiedades undefined para no machacar datos existentes
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, deleted: false },
            updateData,
            { new: true, runValidators: true }
        );

        if (!project) {
            throw new AppError('ERROR_PROJECT_NOT_FOUND_OR_ARCHIVED', 404);
        }

        project.updatedAt = new Date();
        await project.save();
        res.status(200).json(project);
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw AppError.internal('ERROR_UPDATE_PROJECT');
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        throw new AppError('ERROR_PROJECT_NOT_FOUND', 404);
    }

    project.deleted = true;
    await project.save();
    res.status(200).json(project);
};

export const getAllProjects = async (req: Request, res: Response) => {
    const projects = await Project.find({ deleted: false });
    res.status(200).json(projects);
};

export const getProjectById = async (req: Request, res: Response) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        throw new AppError('ERROR_PROJECT_NOT_FOUND', 404);
    }

    if (project.deleted === true) {
        throw new AppError('ERROR_PROJECT_IS_ARCHIVED', 400);
    }

    res.status(200).json(project);
};

export const archiveProject = async (req: Request, res: Response) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        throw new AppError('ERROR_PROJECT_NOT_FOUND', 404);
    }

    if (project.deleted === true) {
        throw new AppError('ERROR_PROJECT_ALREADY_ARCHIVED', 400);
    }

    project.deleted = true;
    await project.save();
    res.status(200).json(project);
};

export const restoreProject = async (req: Request, res: Response) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        throw new AppError('ERROR_PROJECT_NOT_FOUND', 404);
    }

    project.deleted = false;
    await project.save();
    res.status(200).json(project);
};

export const getArchivedProjects = async (req: Request, res: Response) => {
    const projects = await Project.find({ deleted: true });
    res.status(200).json(projects);
};