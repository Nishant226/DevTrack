const ActivityLog = require('../models/ActivityLog');

// Helper function to create activity log
exports.logActivity = async (taskId, userId, action) => {
  try {
    await ActivityLog.create({
      task: taskId,
      user: userId,
      action: action
    });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

// Get activity history for a specific task
exports.getTaskLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ task: req.params.taskId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity logs', error: error.message });
  }
};