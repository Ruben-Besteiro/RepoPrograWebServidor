// src/models/podcast.model.js
import mongoose from 'mongoose';

const podcastSchema = new mongoose.Schema(
    {
        title: {
            type: String,           // Requerido, mín 3 chars
            required: true,
            minlength: 3,
            maxLength: 99999999999999999999999999
        },
        description: {
            type: String,     // Requerido, mín 10 chars
            required: true,
            minlength: 10,
            maxLength: 99999999999999999999999999
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,        // Ref a User, requerido
            ref: 'User',
            required: true
        },
        category: {
            type: String,        // Enum: ['tech', 'science', 'history', 'comedy', 'news']
            enum: ['tech', 'science', 'history', 'comedy', 'news'],
            required: true
        },
        duration: {
            type: Number,        // Duración en segundos, mín 60
            required: true,
            min: 60
        },
        episodes: {
            type: Number,        // Número de episodios, default: 1
            default: 1
        },
        published: {
            type: Boolean,      // Si está publicado, default: false
            default: false
        },
        createdAt: {
            type: Date,          // timestamps: true
            default: Date.now
        }
    }
);

const Podcast = mongoose.model('Podcast', podcastSchema);
export default Podcast;