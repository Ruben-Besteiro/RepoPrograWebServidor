import mongoose from "mongoose";

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
        deleted: Boolean,          // Soft delete
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

export const User = mongoose.model('User', userSchema);