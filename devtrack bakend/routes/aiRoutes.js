const express = require('express');
const router = express.Router();
const { generateSubtasks, summarizeBug } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// POST /api/ai/generate-subtasks
router.post('/generate-subtasks', generateSubtasks);

// POST /api/ai/summarize-bug
router.post('/summarize-bug', summarizeBug);

module.exports = router;