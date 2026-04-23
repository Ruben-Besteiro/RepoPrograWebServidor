import mongoose from "mongoose";
import { optional } from "zod/index.cjs";

const userSchema = new mongoose.Schema(
    {
        email: { type: String, unique: true },             // Único (index: unique), validado con Zod
        password: String,          // Cifrada con bcrypt
        name: String,              // Nombre
        lastName: String,          // Apellidos
        nif: String,               // Documento de identidad
        role: { type: String, enum: ['admin', 'guest'], default: 'admin', index: true },
        status: { type: String, enum: ['pending', 'verified'], default: 'pending', index: true },
        verificationCode: String,  // Código aleatorio de 6 dígitos
        verificationAttempts: Number, // Intentos restantes (máximo 3)
        company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },         // ref: 'Company' — se asigna en el onboarding (index)
        address: {
            street: String,
            number: String,
            postal: String,
            city: String,
            province: String
        },
        deleted: { type: Boolean, default: false },          // Soft delete
        createdAt: Date,
        updatedAt: Date
    }
    , {
        timestamps: true,
        versionKey: false,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

// Virtual para el nombre completo
userSchema.virtual('fullName').get(function () {
    return `${this.name} ${this.lastName}`;
});

// Esto es como lo de arriba pero duplicado
export interface UserInterface {
    _id: mongoose.Types.ObjectId;
    email: string;
    password?: string;
    name: string;
    lastName: string;
    nif: string;
    role: 'admin' | 'guest';
    status: 'pending' | 'verified';
    verificationCode?: string | null;
    verificationAttempts: number;
    company?: mongoose.Types.ObjectId;
    address?: {
        street?: string;
        number?: string;
        postal?: string;
        city?: string;
        province?: string;
    };
    deleted: boolean;
    fullName?: string;
    createdAt?: Date;
    updatedAt?: Date;
    toObject: () => any;
    save: () => Promise<any>;
}

export const User = mongoose.model<UserInterface>('User', userSchema);