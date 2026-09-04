const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');

// POST /api/upload - Single file upload
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Success response - Cloudinary ka public URL frontend ko wapas milta hai
    res.json({
      message: 'File uploaded successfully',
      fileUrl: req.file.path,
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

module.exports = router;