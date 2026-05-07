import { Request, Response } from 'express';
import { Client } from '../models/client.model.js';
import { AppError } from '../utils/AppError.js';

export const createClient = async (req: Request, res: Response) => {
    const { name, email, phone, cif, address } = req.body;
    const company = req.user!.company;      // La misma compañía que el usuario que lo creó
    const user = req.user!._id;         // El ID de Mongo del usuario que lo creó
    const client = new Client({ name, email, phone, cif, address, company, user });
    client.deleted = false;
    await client.save();        // Para añadir el objeto actual a la base de datos
    res.status(201).json(client);
};

export const updateClient = async (req: Request, res: Response) => {
    // Extraemos solo los campos seguros
    const { name, email, phone, cif, address } = req.body;
    const updateData: any = { name, email, phone, cif, address };

    // Eliminamos las propiedades undefined
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const client = await Client.findOneAndUpdate(
        { _id: req.params.id, deleted: false },     // Solo si no está borrado
        updateData,
        { new: true, runValidators: true }
    );

    if (!client) {
        throw new AppError('ERROR_CLIENT_NOT_FOUND_OR_ARCHIVED', 404);
    }

    client.updatedAt = new Date();
    await client.save();
    res.status(200).json(client);
};

export const getAllClients = async (req: Request, res: Response) => {
    const clients = await Client.find({ company: req.user!.company, deleted: false });
    //clients.forEach(client => client.populate('User', 'Company'));
    res.status(200).json(clients);
};

export const getClientById = async (req: Request, res: Response) => {
    const client = await Client.findById(req.params.id);

    if (!client) {
        throw new AppError('ERROR_CLIENT_NOT_FOUND', 404);
    }

    if (client.deleted === true) {
        throw new AppError('ERROR_CLIENT_IS_ARCHIVED', 400);
    }

    res.status(200).json(client);
};

export const deleteClient = async (req: Request, res: Response) => {
    const client = await Client.findById(req.params.id);

    if (!client) {
        throw new AppError('ERROR_CLIENT_NOT_FOUND', 404);
    }

    await Client.deleteOne({ _id: req.params.id });
    res.status(200).json(client);
};

export const archiveClient = async (req: Request, res: Response) => {
    const client = await Client.findById(req.params.id);

    if (!client) {
        throw new AppError('ERROR_CLIENT_NOT_FOUND', 404);
    }

    if (client.deleted === true) {
        throw new AppError('ERROR_CLIENT_ALREADY_ARCHIVED', 400);
    }

    client.deleted = true;
    await client.save();
    res.status(200).json(client);
};

export const restoreClient = async (req: Request, res: Response) => {
    const client = await Client.findById(req.params.id);

    if (!client) {
        throw new AppError('ERROR_CLIENT_NOT_FOUND', 404);
    }

    if (client.deleted === false) {
        throw new AppError('ERROR_CLIENT_NOT_ARCHIVED', 400);
    }

    client.deleted = false;
    await client.save();
    res.status(200).json(client);
};

export const getArchivedClients = async (req: Request, res: Response) => {
    const clients = await Client.find({ company: req.user!.company, deleted: true });
    res.status(200).json(clients);
};