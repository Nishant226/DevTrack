const express = require('express');
const router = express.Router();
const { getTaskLogs } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

// Get activity logs for a task
router.get('/:taskId', protect, getTaskLogs);

module.exports = router;