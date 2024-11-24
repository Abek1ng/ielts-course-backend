// scripts/migrateProgress.js
require('dotenv').config();
const mongoose = require('mongoose');
const UserProgress = require('../models/UserProgress');

const migrateProgress = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const progress = await UserProgress.find();
        
        for (let p of progress) {
            // Add any missing fields
            if (!p.module) p.module = null;
            if (!p.lesson) p.lesson = null;
            if (!p.completedSections) p.completedSections = {};
            if (!p.lastActive) p.lastActive = new Date();
            
            await p.save();
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
    }
};

migrateProgress();