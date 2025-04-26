import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define the upload directory
const uploadDir = path.join(process.cwd(), 'public', 'temp');

// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Replace spaces with underscores to avoid URL issues
    const safeFilename = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeFilename}`);
  },
});

// Initialize Multer
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, GIF, and WEBP images are allowed!'), false);
    }
    cb(null, true);
  },
});

export { upload };