// src/controllers/reviews.controller.js
import { prisma } from '../config/prisma.js';

export const createReviewCtrl = async (req, res) => {
    try {
        const { id: bookId } = req.params;
        const { id: userId } = req.user;
        const { rating, comment } = req.body;
        // Un usuario solo puede crear una reseña si leyó el libro (tiene un préstamo devuelto)
        const returnedLoan = await prisma.loan.findFirst({
            where: {
                userId: parseInt(userId),
                bookId: parseInt(bookId),
                status: 'RETURNED'
            }
        });

        if (!returnedLoan) {
            return res.status(403).json({ error: 'ERROR: Solo puedes escribir una reseña de un libro que hayas tomado prestado y devuelto' });
        }

        const review = await prisma.review.create({
            data: {
                bookId: parseInt(bookId),
                userId: parseInt(userId),
                rating,
                comment
            }
        });
        res.status(201).json(review);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Ya has escrito una reseña para este libro' });
        }
        console.error('Error creating review:', error);
        res.status(500).json({ error: `ERROR: Error al crear la reseña: ${error.message}` });
    }
};

export const getReviewsCtrl = async (req, res) => {
    try {
        // Paginación
        const { id: bookId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = bookId ? { bookId: parseInt(bookId) } : {};

        const total = await prisma.review.count({ where });
        const reviews = await prisma.review.findMany({
            where,
            skip,
            take
        });

        res.status(200).json({
            data: reviews,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting reviews:', error);
        res.status(500).json({ error: `ERROR: Error al obtener las reseñas: ${error.message}` });
    }
};

export const getReviewCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await prisma.review.findUnique({
            where: { id: parseInt(id) }
        });
        if (!review) {
            return res.status(404).json({ error: 'ERROR: Reseña no encontrada' });
        }
        res.status(200).json(review);
    } catch (error) {
        console.error('Error getting review:', error);
        res.status(500).json({ error: `ERROR: Error al obtener la reseña: ${error.message}` });
    }
};

export const updateReviewCtrl = async (req, res) => {
    try {
        const { id: bookId } = req.params;
        const { id: userId } = req.user;
        const { rating, comment } = req.body;
        const review = await prisma.review.update({
            where: {
                userId_bookId: {
                    userId: parseInt(userId),
                    bookId: parseInt(bookId)
                }
            },
            data: {
                rating,
                comment
            }
        });
        res.status(200).json(review);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'ERROR: No has escrito ninguna reseña para este libro' });
        }
        console.error('Error updating review:', error);
        res.status(500).json({ error: `ERROR: Error al actualizar la reseña: ${error.message}` });
    }
};

export const deleteReviewCtrl = async (req, res) => {
    try {
        const { id: bookId } = req.params;
        const { id: userId } = req.user;
        const review = await prisma.review.delete({
            where: {
                userId_bookId: {
                    userId: parseInt(userId),
                    bookId: parseInt(bookId)
                }
            }
        });
        res.status(200).json(review);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'ERROR: No has escrito ninguna reseña para este libro' });
        }
        console.error('Error deleting review:', error);
        res.status(500).json({ error: `ERROR: Error al eliminar la reseña: ${error.message}` });
    }
};