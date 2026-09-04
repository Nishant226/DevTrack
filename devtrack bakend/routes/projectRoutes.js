const express = require('express');
const router = express.Router();
const { 
  createProject, 
  getProjects, 
  addMember, 
  deleteProject // <-- Controller function import kiya hai
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get user projects (Any logged-in user)
router.get('/', protect, getProjects);

// Create project (Admin & Project Manager only)
router.post('/', protect, authorize('Admin', 'Project Manager'), createProject);

// Add member to project (Admin & Project Manager only)
router.put('/:id/add-member', protect, authorize('Admin', 'Project Manager'), addMember);

// DELETE project (Admin & Project Manager only)
router.delete('/:id', protect, authorize('Admin', 'Project Manager'), deleteProject);

module.exports = router;