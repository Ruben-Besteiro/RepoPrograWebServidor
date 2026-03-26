// src/controllers/tracks.controller.js
import Track from '../models/track.model.js';
import { handleHttpError } from '../utils/handleError.js';

/**
 * Obtener todos los tracks
 * GET /api/tracks
 */
export const getTracks = async (req, res) => {
    try {
        const tracks = await Track.find({})
            .populate('artist', 'name email')
            .populate('collaborators', 'name email');
        res.json({ data: tracks });
    } catch (err) {
        handleHttpError(res, 'ERROR_GET_TRACKS');
    }
};

/**
 * Obtener un track por ID
 * GET /api/tracks/:id
 */
export const getTrack = async (req, res) => {
    try {
        const { id } = req.params;
        const track = await Track.findById(id)
            .populate('artist', 'name email')
            .populate('collaborators', 'name email');

        if (!track) {
            handleHttpError(res, 'TRACK_NOT_FOUND', 404);
            return;
        }

        res.json({ data: track });
    } catch (err) {
        handleHttpError(res, 'ERROR_GET_TRACK');
    }
};

/**
 * Crear un track
 * POST /api/tracks
 */
export const createTrack = async (req, res) => {
    try {
        // El usuario viene del middleware de autenticación
        const user = req.user;

        // Crear track con el usuario como artista
        const track = await Track.create({
            ...req.body,
            artist: user._id
        });

        res.status(201).json({ data: track, createdBy: user.name });
    } catch (err) {
        handleHttpError(res, 'ERROR_CREATE_TRACK');
    }
};

/**
 * Actualizar un track
 * PUT /api/tracks/:id
 */
export const updateTrack = async (req, res) => {
    try {
        const { id } = req.params;
        const track = await Track.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        if (!track) {
            handleHttpError(res, 'TRACK_NOT_FOUND', 404);
            return;
        }

        res.json({ data: track });
    } catch (err) {
        handleHttpError(res, 'ERROR_UPDATE_TRACK');
    }
};

/**
 * Eliminar un track
 * DELETE /api/tracks/:id
 */
export const deleteTrack = async (req, res) => {
    try {
        const { id } = req.params;
        const track = await Track.findByIdAndDelete(id);

        if (!track) {
            handleHttpError(res, 'TRACK_NOT_FOUND', 404);
            return;
        }

        res.json({ data: track, message: 'Track eliminado' });
    } catch (err) {
        handleHttpError(res, 'ERROR_DELETE_TRACK');
    }
};