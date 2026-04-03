// src/controllers/auth.controller.js
import { prisma } from '../config/prisma.js';
import { generateAccessToken } from '../utils/handleJwt.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const registerCtrl = async (req, res) => {
    try {
        const { email, name, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Aquí se crea el usuario
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role
            }
        });
        const token = generateAccessToken(user);
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
        res.status(500).json({ error: `ERROR: ${error.message}` });
    }
};

const loginCtrl = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ error: 'ERROR: Credenciales inválidas' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'ERROR: Credenciales inválidas' });
        }
        const token = generateAccessToken(user);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: `ERROR: ${error.message}` });
    }
};

const getMeCtrl = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: `ERROR: ${error.message}` });
    }
};

export { registerCtrl, loginCtrl, getMeCtrl };