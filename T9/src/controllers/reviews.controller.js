// src/controllers/reviews.controller.js
import { prisma } from '../config/db.js';

export const createReviewCtrl = async (req, res) => {
    try {
        const { bookId, rating, comment } = req.body;
        const review = await prisma.review.create({
            data: {
                bookId,
                rating,
                comment
            }
        });
        res.status(201).json(review);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: `ERROR: Error al crear la reseña: ${error.message}` });
    }
};

export const getReviewsCtrl = async (req, res) => {
    try {
        const reviews = await prisma.review.findMany();
        res.status(200).json(reviews);
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
        const { id } = req.params;
        const { bookId, rating, comment } = req.body;
        const review = await prisma.review.update({
            where: { id: parseInt(id) },
            data: {
                bookId,
                rating,
                comment
            }
        });
        res.status(200).json(review);
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ error: `ERROR: Error al actualizar la reseña: ${error.message}` });
    }
};

export const deleteReviewCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await prisma.review.delete({
            where: { id: parseInt(id) }
        });
        res.status(200).json(review);
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: `ERROR: Error al eliminar la reseña: ${error.message}` });
    }
};