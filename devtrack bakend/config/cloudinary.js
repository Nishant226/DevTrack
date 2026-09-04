const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Cloudinary Credentials Configure karna
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Storage Engine Setup (Files direct Cloudinary par upload hongi)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'devtrack_attachments',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'logs'],
  },
});

// 3. Multer Middleware Export
const upload = multer({ storage });

module.exports = { cloudinary, upload };