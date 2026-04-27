import mongoose from "mongoose";

// El MODELO sirve para interactuar con la base de datos
// El ESQUEMA sirve para definir la estructura de los documentos
const clientSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company'
        },
        name: String,
        cif: {
            type: String,
            unique: true
        },
        email: {
            type: String,
            unique: true
        },
        phone: {
            type: String,
            unique: true
        },
        address: {
            street: String,
            number: String,
            postal: String,
            city: String,
            province: String
        },
        deleted: Boolean,
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// La INTERFAZ sirve para tipar cada apartado de una petición
// y definir cuáles son opcionales
export interface ClientInterface extends mongoose.Document {
    user: mongoose.Types.ObjectId;
    company: mongoose.Types.ObjectId;
    name: string;
    cif?: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        number?: string;
        postal?: string;
        city?: string;
        province?: string;
    };
    deleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const Client = mongoose.model<ClientInterface>('Client', clientSchema);