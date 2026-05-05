import multer from 'multer';

// Se utiliza Multer para guardar el archivo en memoria de forma temporal
// Esto se añade como middleware en las rutas
// Y luego en los controladores se llama a la función uploadToCloudinary
// Esta función está en cloudinary.ts
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});
