const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  getAllDoctors,
  approveDoctor,
  getDoctorActivity
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/login', loginAdmin);

// Protected routes (Admin only)
router.get('/doctors', protect, authorize('admin'), getAllDoctors);
router.put('/doctors/:id/approve', protect, authorize('admin'), approveDoctor);
router.get('/doctors/:id/activity', protect, authorize('admin'), getDoctorActivity);

module.exports = router;