import { Request, Response } from 'express';
import { Company } from '../models/company.model.js';
import { AppError } from '../utils/AppError.js';

export const createCompany = async (req: Request, res: Response) => {
    try {
        const company = await Company.create(req.body);
        company.isFreelance = false;
        await company.save();
        res.status(201).json({ data: company });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_CREATE_COMPANY');
    }
};

export const updateCompany = async (req: Request, res: Response) => {
    try {
        const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ data: company });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_UPDATE_COMPANY');
    }
};

export const getCompanies = async (req: Request, res: Response) => {
    try {
        const companies = await Company.find({ deleted: false });
        res.status(200).json({ data: companies });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_GET_COMPANIES');
    }
};

export const deleteCompany = async (req: Request, res: Response) => {
    try {
        const company = await Company.findByIdAndDelete(req.params.id);
        res.status(200).json({ data: company });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_DELETE_COMPANY');
    }
};

export const editLogo = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        const user = req.user;

        if (!user) {
            throw AppError.unauthorized('USER_NOT_FOUND');
        }

        // Comprobar si multer subió un archivo
        if (!file) {
            throw AppError.badRequest('NO_IMAGE_UPLOADED');
        }

        // Comprobar si el usuario tiene una compañía
        if (!user.company) {
            throw AppError.forbidden('USER_HAS_NO_COMPANY');
        }

        // Construir la URL completa del archivo base
        const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
        const logoUrl = `${PUBLIC_URL}/uploads/${file.filename}`;

        // Mongoose no guarda de forma automática campos de subdocumentos poblados
        // Hay que actualizar explícitamente el documento de Company
        const company = await Company.findByIdAndUpdate(
            user.company._id,
            { logo: logoUrl },
            { new: true }
        );

        if (!company) {
            throw AppError.notFound('COMPANY_NOT_FOUND');
        }

        res.status(200).json({ message: 'LOGO_UPDATED', data: { logo: company.logo } });
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw AppError.internal('ERROR_UPDATE_LOGO');
    }
};