// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ielts-course/practice-exercises',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
        transformation: [{
            width: 1200,
            height: 1200,
            crop: 'limit',
            quality: 'auto'
        }]
    }
});

const uploadMiddleware = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

module.exports = {
    cloudinary,
    uploadMiddleware
};