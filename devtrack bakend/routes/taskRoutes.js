const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
  generateAISubtasks,
  uploadAttachment,
  deleteAttachment
} = require('../controllers/taskController');
const {
  getComments,
  addComment
} = require('../controllers/commentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// 1. Get all tasks (GET /api/tasks) AND project specific tasks
router.get('/', protect, getTasks);
router.get('/project/:projectId', protect, getTasks);

// 2. Get single task details
router.get('/:id', protect, getTaskById);

// 3. Create task (Admin & Project Manager only)
router.post('/', protect, authorize('Admin', 'Project Manager'), createTask);

// 4. Update status on drag-and-drop (All logged-in roles)
router.patch('/:id/status', protect, updateTaskStatus);

// 5. Update full task details (Admin & Project Manager only)
router.put('/:id', protect, authorize('Admin', 'Project Manager'), updateTask);

// 6. Delete task (Admin only)
router.delete('/:id', protect, authorize('Admin'), deleteTask);

// 7. Task Comments Routes (Get & Add comments)
router.route('/:taskId/comments')
  .get(protect, getComments)
  .post(protect, addComment);

// 8. Pillar 11: AI Subtask Generation Route
router.post('/ai-subtasks', protect, generateAISubtasks);

// 9. Pillar 2: Attachment Upload & Delete Routes
router.post('/:taskId/attachments', protect, upload.single('file'), uploadAttachment);
router.delete('/:taskId/attachments/:attachmentId', protect, deleteAttachment);

module.exports = router;