import { Company } from '../models/company.model.js';
import { handleHttpError } from '../utils/handleError.js';

export const createCompany = async (req, res) => {
    try {
        const company = await Company.create(req.body);
        res.status(201).json({ data: company });
    } catch (err) {
        handleHttpError(res, 'ERROR_CREATE_COMPANY', 500);
    }
};

export const updateCompany = async (req, res) => {
    try {
        const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ data: company });
    } catch (err) {
        handleHttpError(res, 'ERROR_UPDATE_COMPANY', 500);
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