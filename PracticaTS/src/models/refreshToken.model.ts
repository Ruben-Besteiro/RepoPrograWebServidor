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
refreshTokenSchema.methods.isActive = function (this: RefreshTokenInterface) {
    return !this.revoked && this.expiresAt > new Date();
};

// ???
// const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export interface RefreshTokenInterface extends mongoose.Document {
    token: string;
    user: mongoose.Types.ObjectId | any;
    expiresAt: Date;
    createdByIp: string;
    revoked: boolean;
    isActive(): boolean;
}

const RefreshToken = mongoose.model<RefreshTokenInterface>('RefreshToken', refreshTokenSchema);
export default RefreshToken;