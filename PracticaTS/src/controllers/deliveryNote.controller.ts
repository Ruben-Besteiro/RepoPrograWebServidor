import { Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import { DeliveryNote } from '../models/deliveryNote.model.js';
import { Project } from '../models/project.model.js';
import { Client } from '../models/client.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';


export const createDeliveryNote = async (req: Request, res: Response) => {
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
};

export const signDeliveryNote = async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
        throw new AppError('ERROR_SIGNATURE_REQUIRED', 400);
    }

    // Subir la firma a Cloudinary
    const publicId = `signature-${req.params.id}-${Date.now()}`;
    const { secure_url: signatureUrl } = await uploadToCloudinary(
        file.buffer,
        'signatures',
        publicId
    );

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
};

export const getAllDeliveryNotes = async (req: Request, res: Response) => {
    const filter: any = { deleted: false };

    // Filtros

    if (req.query.signed) {
        filter.signed = req.query.signed === 'true';
    } else if (req.query.signed != null && !req.query.signed) {
        filter.signed = req.query.signed === 'false';
    }

    if (req.query.company) {
        filter.company = req.query.company;
    }

    if (req.query.project) {
        filter.project = req.query.project;
    }

    if (req.query.client) {
        filter.client = req.query.client;
    }

    if (req.query.startDate) {
        filter.workDate = { $gte: new Date(req.query.startDate as string) };
    }

    if (req.query.endDate) {
        const end = new Date(req.query.endDate as string);
        end.setHours(23, 59, 59, 999);
        if (filter.workDate) {
            filter.workDate.$lte = end;
        } else {
            filter.workDate = { $lte: end };
        }
    }

    if (req.query.search) {
        filter.description = { $regex: req.query.search, $options: 'i' };
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
};

export const getDeliveryNoteById = async (req: Request, res: Response) => {
    const deliveryNote = await DeliveryNote.findById(req.params.id).populate(['project', 'client', 'user']);
    if (!deliveryNote) {
        throw new AppError('ERROR_DELIVERY_NOTE_NOT_FOUND', 404);
    }
    res.status(200).json({ data: deliveryNote });
};

export const deleteDeliveryNote = async (req: Request, res: Response) => {
    const deliveryNote = await DeliveryNote.findById(req.params.id);

    if (!deliveryNote) {
        throw new AppError('ERROR_DELIVERY_NOTE_NOT_FOUND', 404);
    }

    if (deliveryNote.signed === true) {
        throw new AppError('ERROR_DELIVERY_NOTE_IS_SIGNED', 400);
    }

    await DeliveryNote.deleteOne({ _id: req.params.id });

    res.status(200).json({ data: deliveryNote });
};

const saveDeliveryNotePDFFile = async (deliveryNote: any) => {
    const doc = new PDFDocument({ margin: 50 });

    // Ensure storage directory exists
    const storageDir = path.join(process.cwd(), 'storage');
    if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
    }

    const filename = `delivery_note_${deliveryNote._id}.pdf`;
    const outputPath = path.join(storageDir, filename);

    const fileStream = fs.createWriteStream(outputPath);
    doc.pipe(fileStream);

    // --- Header Section ---
    const company: any = deliveryNote.company;
    if (company && company.logo) {
        const logoFilename = company.logo.split('/').pop();
        const logoPath = path.join(process.cwd(), 'storage', logoFilename);
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 50 });
        }
    }

    doc.fontSize(20).text('ALBARÁN DE TRABAJO', { align: 'right' });
    doc.fontSize(10).text(`ID: ${deliveryNote._id}`, { align: 'right' });
    doc.moveDown(2);

    const startY = doc.y;

    doc.fontSize(12).text('DE:', 50, startY, { underline: true });
    doc.moveDown(0.5);
    if (company) {
        doc.fontSize(11).text(company.name || 'Empresa no especificada');
        if (company.cif) doc.text(`CIF: ${company.cif}`);
        if (company.address) {
            const addr = company.address;
            doc.text(`${addr.street || ''} ${addr.number || ''}`);
            doc.text(`${addr.postal || ''} ${addr.city || ''}`);
            doc.text(`${addr.province || ''}`);
        }
    } else {
        doc.text('Información de empresa no disponible');
    }

    const client: any = deliveryNote.client;
    doc.fontSize(12).text('PARA:', 300, startY, { underline: true });
    doc.moveDown(0.5);
    if (client) {
        doc.fontSize(11).text(client.name || 'Cliente no especificado', 300);
        if (client.cif) doc.text(`CIF: ${client.cif}`, 300);
        if (client.address) {
            const addr = client.address;
            doc.text(`${addr.street || ''} ${addr.number || ''}`, 300);
            doc.text(`${addr.postal || ''} ${addr.city || ''}`, 300);
            doc.text(`${addr.province || ''}`, 300);
        }
    } else {
        doc.text('Información de cliente no disponible', 300);
    }

    doc.moveDown(2);

    const project: any = deliveryNote.project;
    doc.fontSize(12).text('PROYECTO:', 50, doc.y, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(project?.name || 'N/A');
    if (project?.projectCode) doc.text(`Código: ${project.projectCode}`);
    doc.text(`Fecha de trabajo: ${deliveryNote.workDate ? new Date(deliveryNote.workDate).toLocaleDateString() : 'N/A'}`);
    doc.moveDown();

    doc.rect(50, doc.y, 500, 20).fill('#f0f0f0').stroke('#cccccc');
    doc.fillColor('black').fontSize(11).text('Descripción', 60, doc.y + 5);
    doc.text(deliveryNote.format === 'material' ? 'Cantidad' : 'Horas', 450, doc.y, { width: 90, align: 'right' });
    doc.moveDown(1.5);

    const contentY = doc.y;
    doc.fontSize(10).text(deliveryNote.description || 'Sin descripción', 60, contentY, { width: 380 });

    if (deliveryNote.format === 'material') {
        doc.text(`${deliveryNote.quantity || 0} ${deliveryNote.unit || ''}`, 450, contentY, { width: 90, align: 'right' });
        if (deliveryNote.material) {
            doc.moveDown();
            doc.fontSize(9).text(`Material: ${deliveryNote.material}`, 60);
        }
    } else {
        doc.text(`${deliveryNote.hours || 0} h`, 450, contentY, { width: 90, align: 'right' });
        if (deliveryNote.workers && deliveryNote.workers.length > 0) {
            doc.moveDown();
            doc.fontSize(9).text('Trabajadores:', 60);
            deliveryNote.workers.forEach((w: any) => {
                doc.text(`- ${w.name}: ${w.hours}h`, 70);
            });
        }
    }

    doc.moveDown(3);

    if (deliveryNote.signed) {
        doc.fontSize(12).text('FIRMA DEL CLIENTE:', 50, doc.y, { underline: true });
        doc.fontSize(9).text(`Firmado el: ${deliveryNote.signedAt ? new Date(deliveryNote.signedAt).toLocaleString() : 'N/A'}`);
        doc.moveDown(0.5);

        if (deliveryNote.signatureUrl) {
            const signatureFilename = deliveryNote.signatureUrl.split('/').pop();
            const signaturePath = path.join(process.cwd(), 'storage', signatureFilename || '');

            if (fs.existsSync(signaturePath)) {
                doc.image(signaturePath, { width: 150 });
            } else {
                doc.text('Firma disponible en: ' + deliveryNote.signatureUrl);
            }
        }
    } else {
        doc.fillColor('red').fontSize(12).text('PENDIENTE DE FIRMA', { align: 'center' });
        doc.fillColor('black');
    }

    const footerY = doc.page.height - 70;
    doc.fontSize(8)
        .fillColor('#888888')
        .text('Este documento es un comprobante de los trabajos realizados.', 50, footerY, { align: 'center', width: 500 })
        .text(`Documento generado por el sistema el ${new Date().toLocaleString()}`, { align: 'center', width: 500 });

    await new Promise<void>((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
        doc.end();
    });

    return { filename, outputPath };
};

export const downloadDeliveryNotePDF = async (req: Request, res: Response) => {
    const deliveryNote = await DeliveryNote.findById(req.params.id)
        .populate('company')
        .populate('project')
        .populate('client')
        .populate('user');

    if (!deliveryNote) {
        throw new AppError('ERROR_DELIVERY_NOTE_NOT_FOUND', 404);
    }

    const { filename, outputPath } = await saveDeliveryNotePDFFile(deliveryNote);

    res.download(outputPath, filename, (downloadErr) => {
        if (downloadErr) {
            console.error('Error sending PDF download:', downloadErr);
            if (!res.headersSent) {
                res.status(500).send('ERROR_DOWNLOAD_DELIVERY_NOTE');
            }
        }
    });
};