const express = require('express');
const router = express.Router();
const {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  changeDoctorPassword,
  getDoctorStatistics
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', registerDoctor);
router.post('/login', loginDoctor);

// Protected routes (Doctor only)
router.get('/profile', protect, authorize('doctor'), getDoctorProfile);
router.put('/profile', protect, authorize('doctor'), updateDoctorProfile);
router.put('/change-password', protect, authorize('doctor'), changeDoctorPassword);
router.get('/statistics', protect, authorize('doctor'), getDoctorStatistics);

module.exports = router;