import { Company } from '../models/company.model.js';
import { handleHttpError } from '../utils/handleError.js';

export const createCompany = async (req, res) => {
    try {
        const company = await Company.create(req.body);
        company.isFreelance = false;
        await company.save();
        res.status(201).json({ data: company });
    } catch (err) {
        handleHttpError(res, 'ERROR_CREATE_COMPANY', 500);
    }
};

export const updateCompany = async (req, res) => {
    try {
        const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ data: company });
    } catch (err) {
        handleHttpError(res, 'ERROR_UPDATE_COMPANY', 500);
    }
};

export const getCompanies = async (req, res) => {
    try {
        const companies = await Company.find({ deleted: false });
        res.status(200).json({ data: companies });
    } catch (err) {
        handleHttpError(res, 'ERROR_GET_COMPANIES', 500);
    }
};

export const deleteCompany = async (req, res) => {
    try {
        const company = await Company.findByIdAndDelete(req.params.id);
        res.status(200).json({ data: company });
    } catch (err) {
        handleHttpError(res, 'ERROR_DELETE_COMPANY', 500);
    }
};

export const editLogo = async (req, res) => {
    try {
        const file = req.file;
        const user = req.user;

        // Comprobar si multer subió un archivo
        if (!file) {
            handleHttpError(res, 'NO_IMAGE_UPLOADED', 400);
            return;
        }

        // Comprobar si el usuario tiene una compañía
        if (!user.company) {
            handleHttpError(res, 'USER_HAS_NO_COMPANY', 403);
            return;
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

        res.status(200).json({ message: 'LOGO_UPDATED', data: { logo: company.logo } });
    } catch (err) {
        handleHttpError(res, 'ERROR_UPDATE_LOGO', 500);
    }
};