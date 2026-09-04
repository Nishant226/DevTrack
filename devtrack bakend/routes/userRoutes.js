const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware'); // 'admin' ki jagah 'authorize' import kiya

// Saare users ki list lane ke liye (Sirf Admin ke liye)
router.get('/', protect, authorize('Admin'), getUsers);

// Kisi user ka role update karne ke liye (Sirf Admin ke liye)
router.put('/:id/role', protect, authorize('Admin'), updateUserRole);

module.exports = router;