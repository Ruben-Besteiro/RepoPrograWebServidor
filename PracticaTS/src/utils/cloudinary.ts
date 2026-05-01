import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube un buffer de imagen a Cloudinary.
 * @param buffer   - Buffer del archivo (proveniente de multer memoryStorage)
 * @param folder   - Carpeta de destino en Cloudinary (p. ej. "logos", "signatures")
 * @param filename - Nombre base del archivo (sin extensión)
 */
export const uploadToCloudinary = (
    buffer: Buffer,
    folder: string,
    filename: string
): Promise<{ secure_url: string; public_id: string }> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: filename,
                overwrite: true,
                resource_type: 'auto',
            },
            (error, result) => {
                if (error || !result) {
                    return reject(error ?? new Error('Cloudinary upload failed'));
                }
                resolve({ secure_url: result.secure_url, public_id: result.public_id });
            }
        );
        uploadStream.end(buffer);
    });
};
