import mongoose from "mongoose";

const deliveryNoteSchema = new mongoose.Schema(
    {
        // El campo ref sirve para crear relaciones
        // El valor del campo debe ser lo que haya en la última línea del modelo
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        format: {
            type: String,
            enum: ['material', 'hours'],
            required: true
        },
        description: String,
        workDate: Date,
        material: String,
        quantity: Number,
        unit: String,
        hours: Number,
        workers: [{
            name: String,
            hours: Number
        }],
        signed: Boolean,
        signedAt: Date,
        signatureUrl: String,
        pdfUrl: String,
        deleted: Boolean,
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export interface DeliveryNoteInterface extends mongoose.Document {
    user: mongoose.Types.ObjectId;
    company: mongoose.Types.ObjectId;
    client: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    format: 'material' | 'hours';
    description: string;
    workDate: Date;
    material?: string;
    quantity?: number;
    unit?: string;
    hours?: number;
    workers?: {
        name: string;
        hours: number;
    }[];
    signed: boolean;
    signedAt?: Date;
    signatureUrl?: string;
    pdfUrl?: string;
    deleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const DeliveryNote = mongoose.model<DeliveryNoteInterface>('DeliveryNote', deliveryNoteSchema);