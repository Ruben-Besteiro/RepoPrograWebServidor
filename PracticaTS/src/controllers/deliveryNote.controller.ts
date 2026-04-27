import { Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import { DeliveryNote } from '../models/deliveryNote.model.js';
import { Project } from '../models/project.model.js';
import { Client } from '../models/client.model.js';

export const createDeliveryNote = async (req: Request, res: Response) => {

    const user = req.user!;
    const company = user.company;

    const project = await Project.findById(req.body.project);
    if (!project) {
        throw new AppError('ERROR_PROJECT_NOT_FOUND', 404);
    }

    if (project.deleted === true) {
        throw new AppError('ERROR_PROJECT_IS_ARCHIVED', 400);
    }

    const client = await Client.findById(req.body.client);
    if (!client) {
        throw new AppError('ERROR_CLIENT_NOT_FOUND', 404);
    }

    if (client.deleted === true) {
        throw new AppError('ERROR_CLIENT_IS_ARCHIVED', 400);
    }

    const deliveryNote = new DeliveryNote({
        ...req.body,
        company,
        user,
        project,
        client,
        createdAt: new Date(),
        updatedAt: new Date(),
        deleted: false,
        signed: false,
    });

    await deliveryNote.save();
    res.status(201).json(deliveryNote);
};

export const signDeliveryNote = async (req: Request, res: Response) => {
    try {
        const deliveryNote = await DeliveryNote.findByIdAndUpdate(
            req.params.id,
            { signed: true, updatedAt: new Date() }
        );

        if (!deliveryNote) {
            throw new AppError('ERROR_DELIVERY_NOTE_NOT_FOUND', 404);
        }
        res.status(200).json({ data: deliveryNote });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_UPDATE_DELIVERY_NOTE');
    }
};

export const getAllDeliveryNotes = async (req: Request, res: Response) => {
    try {
        // Se debe crear un objeto con las preferencias de búsqueda
        const filter: any = { deleted: false };
        if (req.query.signed) {
            filter.signed = req.query.signed === 'true';
        }
        const deliveryNotes = await DeliveryNote.find(filter);

        res.status(200).json({ data: deliveryNotes });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_GET_DELIVERY_NOTES');
    }
};

export const getDeliveryNoteById = async (req: Request, res: Response) => {
    try {
        const deliveryNote = await DeliveryNote.findById(req.params.id).populate(['project', 'client', 'user']);
        if (!deliveryNote) {
            throw new AppError('ERROR_DELIVERY_NOTE_NOT_FOUND', 404);
        }
        res.status(200).json({ data: deliveryNote });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_GET_DELIVERY_NOTE');
    }
};

export const deleteDeliveryNote = async (req: Request, res: Response) => {
    try {
        const deliveryNote = await DeliveryNote.findById(req.params.id);

        if (!deliveryNote) {
            throw new AppError('ERROR_DELIVERY_NOTE_NOT_FOUND', 404);
        }

        if (deliveryNote.signed === true) {
            throw new AppError('ERROR_DELIVERY_NOTE_IS_SIGNED', 400);
        }

        await DeliveryNote.deleteOne({ _id: req.params.id });

        res.status(200).json({ data: deliveryNote });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_DELETE_DELIVERY_NOTE');
    }
};