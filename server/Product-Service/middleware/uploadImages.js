import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up storage configuration for multer
const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/images'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + ".jpeg");
    },
});

// Filter for only image files
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb(new Error("Unsupported file format"), false);
    }
};

// Configure multer
const uploadPhoto = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 2000000 }, // Limit file size to 2MB
});

// Middleware to resize images
const productImgResize = async (req, res, next) => {
    if (!req.files) {
        return next();
    }

    const uploadsDir = path.resolve(path.join(__dirname, '../public/images/products'));

    await Promise.all(req.files.map(async (file) => {
        // Sanitize the filename
        const sanitizedFilename = path.basename(file.filename);

        // Create a safe output path
        const safeOutputPath = path.join(uploadsDir, sanitizedFilename);

        // Ensure the output path is within the uploads directory
        if (!safeOutputPath.startsWith(uploadsDir)) {
            throw new Error('Attempted path traversal detected.');
        }

        // Resize the image and save it
        await sharp(file.path)
            .resize(300, 300)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(safeOutputPath);

        // Safely delete the original file
        const safeInputPath = path.resolve(file.path);
        if (safeInputPath.startsWith(path.resolve(path.join(__dirname, '../public/images')))) {
            fs.unlink(safeInputPath, (err) => {
                if (err) {
                    console.error(`Failed to delete original file: ${safeInputPath}`, err);
                }
            });
        } else {
            throw new Error('Attempted path traversal detected during file deletion.');
        }
    }));

    next();
};

export default {
    uploadPhoto,
    productImgResize,
};
