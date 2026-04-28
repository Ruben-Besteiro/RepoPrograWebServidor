import { Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import { DeliveryNote } from '../models/deliveryNote.model.js';
import { Project } from '../models/project.model.js';
import { Client } from '../models/client.model.js';

export const createDeliveryNote = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const company = user.company;

        if (!company) {
            throw new AppError('ERROR_USER_HAS_NO_COMPANY', 400);
        }

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
    } catch (err: any) {
        if (err instanceof AppError) throw err;
        // Si es un error de validación de Mongoose, lo lanzamos con un 400
        if (err.name === 'ValidationError') {
            throw new AppError(err.message, 400);
        }
        throw AppError.internal(err.message || 'ERROR_CREATE_DELIVERY_NOTE');
    }
};

export const signDeliveryNote = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        if (!file) {
            throw new AppError('ERROR_SIGNATURE_REQUIRED', 400);
        }

        const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
        const signatureUrl = `${PUBLIC_URL}/uploads/${file.filename}`;

        const deliveryNote = await DeliveryNote.findByIdAndUpdate(
            req.params.id,
            {
                signed: true,
                signatureUrl,
                signedAt: new Date(),
                updatedAt: new Date()
            },
            { new: true }
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
        const filter: any = { deleted: false };

        // Verificar estado
        if (req.query.signed) {
            filter.signed = req.query.signed === 'true';
        } else if (req.query.signed != null && !req.query.signed) {
            filter.signed = req.query.signed === 'false';
        }

        // Verificar company (como ObjectId)
        if (req.query.company) {
            filter.company = req.query.company;
        }

        // Verificar project (como ObjectId)
        if (req.query.project) {
            filter.project = req.query.project;
        }

        // Verificar client (como ObjectId)
        if (req.query.client) {
            filter.client = req.query.client;
        }

        // Verificar rango de fechas (workDate)
        if (req.query.startDate) {
            filter.workDate = { $gte: new Date(req.query.startDate as string) };
        }

        if (req.query.endDate) {
            // Aseguramos que la fecha final incluya el día completo
            const end = new Date(req.query.endDate as string);
            end.setHours(23, 59, 59, 999);
            if (filter.workDate) {
                filter.workDate.$lte = end;
            } else {
                filter.workDate = { $lte: end };
            }
        }

        // Para "buscar texto" en description (LIKE)
        if (req.query.search) {
            // Usamos regex con 'i' para búsqueda insensibile a mayúsculas/minúsculas
            filter.description = { $regex: req.query.search as string, $options: 'i' };
        }

        // Para paginación
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const deliveryNotes = await DeliveryNote
            .find(filter)
            /*.populate('company')
            .populate('project')
            .populate('client')*/
            .sort({ createdAt: -1 }) // Ordenar por fecha descendente por defecto
            .skip(skip)
            .limit(limit);

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