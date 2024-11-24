// // utils/storage.js
// const path = require('path');
// const fs = require('fs').promises;
// const { v4: uuidv4 } = require('uuid');

// // Configure storage path
// const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// // Ensure upload directory exists
// const initStorage = async () => {
//   try {
//     await fs.access(UPLOAD_DIR);
//   } catch {
//     await fs.mkdir(UPLOAD_DIR, { recursive: true });
//   }
// };

// // Initialize storage on startup
// initStorage().catch(console.error);

// const storage = {
//   // Upload file to local storage
//   uploadToStorage: async (file) => {
//     const filename = `${uuidv4()}${path.extname(file.originalname)}`;
//     const filepath = path.join(UPLOAD_DIR, filename);
    
//     await fs.writeFile(filepath, file.buffer);
    
//     // Return the URL path to access the file
//     return `/uploads/${filename}`;
//   },

//   // Delete file from storage
//   deleteFromStorage: async (filename) => {
//     const filepath = path.join(UPLOAD_DIR, filename);
//     try {
//       await fs.unlink(filepath);
//       return true;
//     } catch {
//       return false;
//     }
//   },

//   // Get file from storage
//   getFile: async (filename) => {
//     const filepath = path.join(UPLOAD_DIR, filename);
//     try {
//       const file = await fs.readFile(filepath);
//       return file;
//     } catch {
//       return null;
//     }
//   }
// };

// module.exports = storage;