// routes/mediaRoutes.js
const express = require('express');
const router = express.Router();
const { uploadImage, deleteImage, getImages } = require('../controllers/mediaController');
const { uploadMiddleware } = require('../config/cloudinary');
const auth = require('../middleware/auth');
const checkAdmin = require('../middleware/checkAdmin');

// Upload image - requires authentication
router.post('/upload', auth, uploadMiddleware.single('file'), uploadImage);

// Delete image - requires admin
router.delete('/:publicId', auth, checkAdmin, deleteImage);

// Get all images - requires admin
router.get('/', auth, checkAdmin, getImages);

module.exports = router;