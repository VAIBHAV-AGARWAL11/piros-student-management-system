const express = require('express');
const { analyzeResume } = require('../controllers/resumeController');
const multer = require('multer');

// Configure multer to store file in memory buffer to pass directly to pdf-parse
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const router = express.Router();

router.post('/analyze', upload.single('resume'), analyzeResume);

module.exports = router;
