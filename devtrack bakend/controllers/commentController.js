const Comment = require('../models/Comment');
const { logActivity } = require('./activityController');

// Add comment to a task
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const taskId = req.params.taskId;

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const comment = await Comment.create({
      task: taskId,
      user: req.user._id,
      text
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name email');

    // Activity log mein bhi record kar dete hain
    await logActivity(taskId, req.user._id, `Added a comment`);

    // Socket.io real-time update ke liye (Event name updated to 'commentAdded')
    const io = req.app.get('socketio');
    if (io) {
      io.emit('commentAdded', { taskId, comment: populatedComment });
    }

    res.status(201).json({ success: true, data: populatedComment });
  } catch (error) {
    next(error);
  }
};

// Get comments for a task
exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('user', 'name email')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};