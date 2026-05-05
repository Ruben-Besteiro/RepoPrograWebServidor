import { Request, Response } from 'express';
import { Company } from '../models/company.model.js';
import { AppError } from '../utils/AppError.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

export const createCompany = async (req: Request, res: Response) => {
    const company = await Company.create(req.body);
    company.isFreelance = false;
    await company.save();
    res.status(201).json({ data: company });
};

export const updateCompany = async (req: Request, res: Response) => {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ data: company });
};

export const getCompanies = async (req: Request, res: Response) => {
    const companies = await Company.find({ deleted: false });
    res.status(200).json({ data: companies });
};

export const deleteCompany = async (req: Request, res: Response) => {
    const company = await Company.findByIdAndDelete(req.params.id);
    res.status(200).json({ data: company });
};

export const editLogo = async (req: Request, res: Response) => {
    const file = req.file;
    const user = req.user;

    if (!user) {
        throw AppError.unauthorized('USER_NOT_FOUND');
    }

    if (!file) {
        throw AppError.badRequest('NO_IMAGE_UPLOADED');
    }

    // El usuario debe tener una compañía
    if (!user.company) {
        throw AppError.forbidden('USER_HAS_NO_COMPANY');
    }

    // Subir el buffer a Cloudinary
    const publicId = `logo-${user.company._id}-${Date.now()}`;
    const { secure_url: logoUrl } = await uploadToCloudinary(file.buffer, 'logos', publicId);

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
};