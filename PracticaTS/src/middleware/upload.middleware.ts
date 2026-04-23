import multer from 'multer';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATH_STORAGE = join(__dirname, '../../storage');

// Crear la carpeta si no existe
if (!fs.existsSync(PATH_STORAGE)) {
    fs.mkdirSync(PATH_STORAGE, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
        cb(null, PATH_STORAGE);
    },
    filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
        // Obtenemos la extensión del archivo respetando las que tengan varios puntos
        const ext = file.originalname.split('.').pop();
        // Generamos un nombre único
        const filename = `company-logo-${Date.now()}.${ext}`;
        cb(null, filename);
    }
});

export const uploadMiddleware = multer({ storage });
