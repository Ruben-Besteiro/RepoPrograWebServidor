// src/controllers/podcasts.controller.js
import User from '../models/user.model.js';
import Podcast from '../models/podcast.model.js';
import { handleHttpError } from '../utils/handleError.js';
import { verifyAccessToken } from '../utils/handleJwt.js';

export const getPodcastsCtrl = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filter = { published: true };
        const podcasts = await Podcast.find(filter).skip(skip).limit(limit);
        const totalDocs = await Podcast.countDocuments(filter);
        const totalPages = Math.ceil(totalDocs / limit);

        res.json({
            docs: podcasts,
            totalDocs,
            totalPages,
            page,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        });
    } catch (err) {
        handleHttpError(res, 'ERROR_GET_PODCASTS', 500);
    }
};

export const getPodcastCtrl = async (req, res) => {
    try {
        const podcast = await Podcast.findById(req.params.id);
        if (!podcast) {
            return handleHttpError(res, 'PODCAST_NOT_FOUND', 404);
        }
        if (!podcast.published && req.user.role !== 'admin') {
            return handleHttpError(res, 'PODCAST_NOT_PUBLISHED', 403);
        }
        res.json(podcast);
    } catch (err) {
        handleHttpError(res, 'ERROR_GET_PODCAST', 500);
    }
};

export const createPodcastCtrl = async (req, res) => {
    try {
        const body = {
            ...req.body,
            author: req.user._id // Asignar el autor automáticamente desde el token
        };
        const podcast = await Podcast.create(body);
        res.status(201).json(podcast);
    } catch (err) {
        console.error(err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return handleHttpError(res, `VALIDATION_ERROR: ${messages.join(', ')}`, 400);
        }
        handleHttpError(res, 'ERROR_CREATE_PODCAST', 500);
    }
};

export const updatePodcastCtrl = async (req, res) => {
    try {
        const podcast = await Podcast.findById(req.params.id);

        // Solo si el usuario es el autor o es admin
        const isAuthor = podcast.author.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isAuthor && !isAdmin) {
            return handleHttpError(res, 'NOT_AUTHORIZED_TO_UPDATE', 403);
        }

        const updatedPodcast = await Podcast.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedPodcast);
    } catch (err) {
        handleHttpError(res, 'ERROR_UPDATE_PODCAST', 500);
    }
};

export const deletePodcastCtrl = async (req, res) => {
    try {
        const podcast = await Podcast.findByIdAndDelete(req.params.id);
        res.json(podcast);
    } catch (err) {
        handleHttpError(res, 'ERROR_DELETE_PODCAST', 500);
    }
};

export const getAllPodcastsCtrl = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const podcasts = await Podcast.find().skip(skip).limit(limit);
        const totalDocs = await Podcast.countDocuments();
        const totalPages = Math.ceil(totalDocs / limit);

        res.json({
            docs: podcasts,
            totalDocs,
            totalPages,
            page,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        });
    } catch (err) {
        handleHttpError(res, 'ERROR_GET_ALL_PODCASTS', 500);
    }
};

export const publishPodcastCtrl = async (req, res) => {
    try {
        const podcast = await Podcast.findByIdAndUpdate(req.params.id, { published: true }, { new: true });
        res.json(podcast);
    } catch (err) {
        handleHttpError(res, 'ERROR_PUBLISH_PODCAST', 500);
    }
};

export const unpublishPodcastCtrl = async (req, res) => {
    try {
        const podcast = await Podcast.findByIdAndUpdate(req.params.id, { published: false }, { new: true });
        res.json(podcast);
    } catch (err) {
        handleHttpError(res, 'ERROR_UNPUBLISH_PODCAST', 500);
    }
};