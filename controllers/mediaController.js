// controllers/mediaController.js
const { cloudinary } = require('../config/cloudinary');
const { MediaContent } = require('../models/Content');

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Create media content record
        const mediaContent = new MediaContent({
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            url: req.file.path, // Cloudinary URL
            publicId: req.file.filename, // Cloudinary public ID
            createdBy: req.user.userId
        });

        await mediaContent.save();

        return res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: req.file.path,
                publicId: req.file.filename,
                id: mediaContent._id
            }
        });

    } catch (error) {
        console.error('Image upload error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload image'
        });
    }
};

exports.deleteImage = async (req, res) => {
    try {
        const { publicId } = req.params;

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(publicId);

        // Delete from database
        await MediaContent.findOneAndDelete({ publicId });

        return res.json({
            success: true,
            message: 'Image deleted successfully'
        });

    } catch (error) {
        console.error('Image deletion error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete image'
        });
    }
};

exports.getImages = async (req, res) => {
    try {
        const images = await MediaContent.find()
            .sort({ createdAt: -1 })
            .limit(20);

        return res.json({
            success: true,
            data: images
        });

    } catch (error) {
        console.error('Get images error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get images'
        });
    }
};