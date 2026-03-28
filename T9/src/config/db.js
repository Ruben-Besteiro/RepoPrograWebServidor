// src/config/db.js
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const dbConnect = async () => {
    try {
        await prisma.$connect();
        console.log("✅ Conectado a la base de datos");
    } catch (e) {
        console.error("❌ Error de conexión:", e);
        process.exit(1);
    }
};

export { prisma };
export default dbConnect;