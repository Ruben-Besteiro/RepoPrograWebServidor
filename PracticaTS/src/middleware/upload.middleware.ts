import multer from 'multer';

// Usamos memoryStorage para tener el buffer disponible en req.file.buffer
// y poder subirlo a Cloudinary sin escribir en disco.
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
