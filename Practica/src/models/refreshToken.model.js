// src/models/refreshToken.model.js
import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index: MongoDB elimina automáticamente
    },
    createdByIp: String,
    revoked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Método para verificar si está activo
// Cuando llamamos al /refresh, el revoked es true y ese token ya no vale
refreshTokenSchema.methods.isActive = function () {
    return !this.revoked && this.expiresAt > new Date();
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;