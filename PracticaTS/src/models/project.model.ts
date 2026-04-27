import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
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
        name: String,
        projectCode: {
            type: String,
            unique: true,
            required: true
        },
        address: {
            street: String,
            number: String,
            postal: String,
            city: String,
            province: String
        },
        email: {
            type: String,
            unique: true,
            required: true
        },
        notes: String,
        active: Boolean,
        deleted: Boolean,
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export interface ProjectInterface extends mongoose.Document {
    user: mongoose.Types.ObjectId;
    company: mongoose.Types.ObjectId;
    client: mongoose.Types.ObjectId;
    name: string;
    projectCode?: string;
    address?: {
        street?: string;
        number?: string;
        postal?: string;
        city?: string;
        province?: string;
    };
    email?: string;
    notes?: string;
    active: boolean;
    deleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const Project = mongoose.model<ProjectInterface>('Project', projectSchema);