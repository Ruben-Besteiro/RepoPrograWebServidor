// src/controllers/loans.controller.js
import { prisma } from '../config/db.js';

export const createLoanCtrl = async (req, res) => {
    try {
        const { bookId, loanDate, dueDate, returnedDate } = req.body;

        // Si el usuario pide prestado un libro que ya tiene prestado, no se puede
        const existingLoan = await prisma.loan.findFirst({
            where: {
                userId: req.user.id,
                bookId: bookId,
                status: {
                    not: 'RETURNED'
                }
            }
        });

        if (existingLoan) {
            return res.status(400).json({ error: 'ERROR: Ya tienes este libro prestado y no ha sido devuelto' });
        }

        const loan = await prisma.loan.create({
            data: {
                userId: req.user.id,
                bookId,
                loanDate: loanDate ? new Date(loanDate) : undefined,
                dueDate: new Date(dueDate),
                returnDate: returnedDate ? new Date(returnedDate) : null
            }
        });
        res.status(201).json(loan);
    } catch (error) {
        console.error('Error creating loan:', error);
        res.status(500).json({ error: `ERROR: Error al crear el préstamo: ${error.message}` });
    }
};

export const getMyLoansCtrl = async (req, res) => {
    try {
        const loans = await prisma.loan.findMany({
            where: { userId: req.user.id }
        });
        res.status(200).json(loans);
    } catch (error) {
        console.error('Error getting loans:', error);
        res.status(500).json({ error: `ERROR: Error al obtener los préstamos: ${error.message}` });
    }
};

export const getAllLoansCtrl = async (req, res) => {
    try {
        const loans = await prisma.loan.findMany();
        res.status(200).json(loans);
    } catch (error) {
        console.error('Error getting loans:', error);
        res.status(500).json({ error: `ERROR: Error al obtener los préstamos: ${error.message}` });
    }
};

export const getLoanCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const loan = await prisma.loan.findUnique({
            where: { id: parseInt(id) }
        });
        if (!loan) {
            return res.status(404).json({ error: 'ERROR: Préstamo no encontrado' });
        }
        res.status(200).json(loan);
    } catch (error) {
        console.error('Error getting loan:', error);
        res.status(500).json({ error: `ERROR: Error al obtener el préstamo: ${error.message}` });
    }
};

export const updateLoanCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const { bookId, loanDate, dueDate, returnedDate, status } = req.body;

        // Si la fecha de vencimiento ya pasó y el préstamo está activo, se pone como vencido
        if (dueDate) {
            const currentDate = new Date();
            const due = new Date(dueDate);
            if (currentDate > due && (status === 'ACTIVE' || !status)) {
                status = 'OVERDUE';
            }
        }

        const loan = await prisma.loan.update({
            where: { id: parseInt(id) },
            data: {
                bookId,
                loanDate: loanDate ? new Date(loanDate) : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                returnDate: returnedDate ? new Date(returnedDate) : null,
            }
        });
        res.status(200).json(loan);
    } catch (error) {
        console.error('Error updating loan:', error);
        res.status(500).json({ error: `ERROR: Error al actualizar el préstamo: ${error.message}` });
    }
};

export const returnLoanCtrl = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscamos el préstamo específico en la base de datos para ver su estado
        const loan_ = await prisma.loan.findUnique({
            where: { id: parseInt(id) }
        });

        // Si el préstamo ya ha sido devuelto, no se puede devolver de nuevo
        if (loan_.status === 'RETURNED') {
            res.status(409).json({ error: 'ERROR: El préstamo ya ha sido devuelto' });
            return;
        }

        const updatedLoan = await prisma.loan.update({
            where: { id: parseInt(id) },
            data: {
                returnDate: new Date(),
                status: 'RETURNED'
            }
        });
        res.status(200).json(updatedLoan);
    } catch (error) {
        console.error('Error returning loan:', error);
        res.status(500).json({ error: `ERROR: Error al devolver el préstamo: ${error.message}` });
    }
};