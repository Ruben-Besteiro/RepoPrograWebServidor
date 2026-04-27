
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/user.model.js';
import { Company } from '../src/models/company.model.js';
import { Client } from '../src/models/client.model.js';
import { Project } from '../src/models/project.model.js';
import { DeliveryNote } from '../src/models/deliveryNote.model.js';
import 'dotenv/config';

const seed = async () => {
    try {
        const MONGO_URL = process.env.MONGO_URL;
        const DB_NAME = process.env.DB_NAME;

        if (!MONGO_URL) throw new Error('MONGO_URL not found');

        await mongoose.connect(MONGO_URL, { dbName: DB_NAME });
        console.log('✅ Connected to MongoDB for seeding');

        // Clean existing data
        await Promise.all([
            User.deleteMany({}),
            Company.deleteMany({}),
            Client.deleteMany({}),
            Project.deleteMany({}),
            DeliveryNote.deleteMany({})
        ]);
        console.log('🗑️  Cleaned existing collections');

        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Create a Company
        const company = await Company.create({
            name: 'Acme Corp',
            cif: 'B12345678',
            address: {
                street: 'Main St',
                number: '1',
                postal: '28001',
                city: 'Madrid',
                province: 'Madrid'
            },
            isFreelance: false,
            deleted: false
        });

        // 2. Create Users
        const admin = await User.create({
            email: 'admin@acme.com',
            password: hashedPassword,
            name: 'Admin',
            lastName: 'User',
            nif: '12345678A',
            role: 'admin',
            status: 'verified',
            company: company._id,
            verificationAttempts: 0,
            deleted: false
        });

        const guest = await User.create({
            email: 'guest@acme.com',
            password: hashedPassword,
            name: 'Guest',
            lastName: 'User',
            nif: '87654321B',
            role: 'guest',
            status: 'verified',
            company: company._id,
            verificationAttempts: 0,
            deleted: false
        });

        // Update company owner
        company.owner = admin._id;
        await company.save();

        // 3. Create Clients
        const client1 = await Client.create({
            user: admin._id,
            company: company._id,
            name: 'Globex Corporation',
            cif: 'A99999999',
            email: 'contact@globex.com',
            phone: '911223344',
            address: {
                street: 'Side St',
                number: '10',
                postal: '28005',
                city: 'Madrid',
                province: 'Madrid'
            },
            deleted: false
        });

        const client2 = await Client.create({
            user: admin._id,
            company: company._id,
            name: 'Initech',
            cif: 'A88888888',
            email: 'billing@initech.com',
            phone: '912345678',
            address: {
                street: 'Office Park',
                number: '5',
                postal: '08001',
                city: 'Barcelona',
                province: 'Barcelona'
            },
            deleted: false
        });

        // 4. Create Projects
        const project1 = await Project.create({
            user: admin._id,
            company: company._id,
            client: client1._id,
            name: 'Project Alpha',
            projectCode: 'ALPHA-001',
            email: 'alpha@globex.com',
            active: true,
            deleted: false
        });

        const project2 = await Project.create({
            user: admin._id,
            company: company._id,
            client: client2._id,
            name: 'Project Beta',
            projectCode: 'BETA-002',
            email: 'beta@initech.com',
            active: true,
            deleted: false
        });

        // 5. Create Delivery Notes
        await DeliveryNote.create({
            user: admin._id,
            company: company._id,
            client: client1._id,
            project: project1._id,
            format: 'hours',
            description: 'Consulting services',
            workDate: new Date(),
            hours: 8,
            workers: [{ name: 'Admin User', hours: 8 }],
            signed: false,
            deleted: false
        });

        await DeliveryNote.create({
            user: admin._id,
            company: company._id,
            client: client2._id,
            project: project2._id,
            format: 'material',
            description: 'Server installation',
            workDate: new Date(),
            material: 'Server Rack',
            quantity: 2,
            unit: 'units',
            signed: true,
            signedAt: new Date(),
            deleted: false
        });

        console.log('🌱 Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seed();
