// src/controllers/books.controller.js
import { prisma } from '../config/prisma.js';

export const createBookCtrl = async (req, res) => {
    try {
        const { isbn, title, author, genre, description, publishedYear, copies, availableCopies } = req.body;
        const book = await prisma.book.create({
            data: {
                isbn,
                title,
                author,
                genre,
                description,
                publishedYear,
                copies,
                availableCopies
            }
        });
        res.status(201).json(book);
    } catch (error) {
        console.error('Error creating book:', error);
        res.status(500).json({ error: `ERROR: Error al crear el libro: ${error.message}` });
    }
};

export const getAllBooksCtrl = async (req, res) => {
    try {
        // Paginación
        const { genre, author, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const query = {};
        if (genre) query.genre = genre;
        if (author) query.author = author;

        // Consultar total de libros con el filtro aplicado
        const total = await prisma.book.count({ where: query });
        const books = await prisma.book.findMany({
            where: query,
            skip,
            take
        });

        res.status(200).json({
            data: books,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting books:', error);
        res.status(500).json({ error: `ERROR: Error al obtener los libros: ${error.message}` });
    }
};

export const getBookCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const book = await prisma.book.findUnique({
            where: { id: parseInt(id) }
        });
        if (!book) {
            return res.status(404).json({ error: 'ERROR: Libro no encontrado' });
        }
        res.status(200).json(book);
    } catch (error) {
        console.error('Error getting book:', error);
        res.status(500).json({ error: `ERROR: Error al obtener el libro: ${error.message}` });
    }
};

export const updateBookCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const { isbn, title, author, genre, description, publishedYear, copies, availableCopies } = req.body;
        const book = await prisma.book.update({
            where: { id: parseInt(id) },
            data: {
                isbn,
                title,
                author,
                genre,
                description,
                publishedYear,
                copies,
                availableCopies
            }
        });
        res.status(200).json(book);
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({ error: `ERROR: Error al actualizar el libro: ${error.message}` });
    }
};

export const deleteBookCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const book = await prisma.book.delete({
            where: { id: parseInt(id) }
        });
        res.status(200).json(book);
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ error: `ERROR: Error al eliminar el libro: ${error.message}` });
    }
};

export const getMostRentedBooksCtrl = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const books = await prisma.book.findMany({
            orderBy: {
                timesRented: 'desc'
            },
            take: parseInt(limit)
        });
        res.status(200).json(books);
    } catch (error) {
        console.error('Error getting most rented books:', error);
        res.status(500).json({ error: `ERROR: Error al obtener los libros más alquilados: ${error.message}` });
    }
};

export const getBestRatedBooksCtrl = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const books = await prisma.book.findMany({
            orderBy: {
                avgReview: 'desc'
            },
            take: parseInt(limit)
        });
        res.status(200).json(books);
    } catch (error) {
        console.error('Error getting best rated books:', error);
        res.status(500).json({ error: `ERROR: Error al obtener los libros mejor valorados: ${error.message}` });
    }
};