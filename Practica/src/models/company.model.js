import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
    {
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        cif: String,
        address: {
            street: String,
            number: String,
            postal: String,
            city: String,
            province: String
        },
        logo: String,               // URL del logo (imagen subida con Multer)
        isFreelance: Boolean,       // true si es autónomo (1 sola persona)
        deleted: Boolean,           // Soft delete
        createdAt: Date,
        updatedAt: Date
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export const Company = mongoose.model('Company', companySchema);
