// src/controllers/loans.controller.js
import { prisma } from '../config/prisma.js';

export const createLoanCtrl = async (req, res) => {
    try {
        const { bookId, loanDate, dueDate, returnedDate } = req.body;

        // Verificar si el libro existe y tiene copias disponibles
        const book = await prisma.book.findUnique({
            where: { id: parseInt(bookId) }
        });

        if (!book) {
            return res.status(404).json({ error: 'ERROR: El libro no existe' });
        }

        if (book.availableCopies <= 0) {
            return res.status(400).json({ error: 'ERROR: No hay copias disponibles para este libro' });
        }

        // Un usuario solo puede tener 3 préstamos activos a la vez
        const activeLoansCount = await prisma.loan.count({
            where: {
                userId: req.user.id,
                status: {
                    in: ['ACTIVE', 'OVERDUE']
                }
            }
        });

        if (activeLoansCount >= 3) {
            return res.status(400).json({ error: 'ERROR: No puedes tener más de 3 préstamos activos a la vez' });
        }

        // No se puede pedir prestado el mismo libro 2 veces (sin importar el estado del anterior préstamo)
        const previousLoan = await prisma.loan.findFirst({
            where: {
                userId: req.user.id,
                bookId: parseInt(bookId)
            }
        });

        if (previousLoan) {
            return res.status(400).json({ error: 'ERROR: Ya has pedido prestado este libro anteriormente' });
        }

        // Para editar las tablas hay que usar transacciones de Prisma
        const [loan] = await prisma.$transaction([
            prisma.loan.create({
                data: {
                    userId: req.user.id,
                    bookId: parseInt(bookId),
                    loanDate: loanDate ? new Date(loanDate) : undefined,
                    dueDate: new Date(dueDate),
                    returnDate: returnedDate ? new Date(returnedDate) : null
                }
            }),
            prisma.book.update({
                where: { id: parseInt(bookId) },
                data: { availableCopies: { decrement: 1 } }
            })
        ]);

        res.status(201).json(loan);
    } catch (error) {
        console.error('Error creating loan:', error);
        res.status(500).json({ error: `ERROR: Error al crear el préstamo: ${error.message}` });
    }
};

export const getMyLoansCtrl = async (req, res) => {
    try {
        // Paginación
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = { userId: req.user.id };
        const total = await prisma.loan.count({ where });
        const loans = await prisma.loan.findMany({
            where,
            skip,
            take
        });

        res.status(200).json({
            data: loans,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting loans:', error);
        res.status(500).json({ error: `ERROR: Error al obtener los préstamos: ${error.message}` });
    }
};

export const getAllLoansCtrl = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const total = await prisma.loan.count();
        const loans = await prisma.loan.findMany({
            skip,
            take
        });

        res.status(200).json({
            data: loans,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
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

        // Verificamos si el préstamo existe
        if (!loan_) {
            return res.status(404).json({ error: 'ERROR: Préstamo no encontrado' });
        }

        // Si el préstamo ya ha sido devuelto, no se puede devolver de nuevo
        if (loan_.status === 'RETURNED') {
            return res.status(409).json({ error: 'ERROR: El préstamo ya ha sido devuelto' });
        }

        // Usamos una transacción para actualizar el préstamo y aumentar el stock en la base de datos
        const [updatedLoan] = await prisma.$transaction([
            prisma.loan.update({
                where: { id: parseInt(id) },
                data: {
                    returnDate: new Date(),
                    status: 'RETURNED'
                }
            }),
            prisma.book.update({
                where: { id: loan_.bookId },
                data: { availableCopies: { increment: 1 } }
            })
        ]);

        res.status(200).json(updatedLoan);
    } catch (error) {
        console.error('Error returning loan:', error);
        res.status(500).json({ error: `ERROR: Error al devolver el préstamo: ${error.message}` });
    }
};