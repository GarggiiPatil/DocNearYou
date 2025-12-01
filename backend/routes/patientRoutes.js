const express = require('express');
const router = express.Router();
const {
  registerPatient,
  loginPatient,
  getPatientProfile,
  updatePatientProfile,
  changePatientPassword,
  getDoctors,
  getNearbyHealthcare
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', registerPatient);
router.post('/login', loginPatient);

// Protected routes (Patient only)
router.get('/profile', protect, authorize('patient'), getPatientProfile);
router.put('/profile', protect, authorize('patient'), updatePatientProfile);
router.put('/change-password', protect, authorize('patient'), changePatientPassword);
router.get('/doctors', protect, authorize('patient'), getDoctors);
router.get('/nearby-healthcare', protect, authorize('patient'), getNearbyHealthcare);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const {
//   registerPatient,
//   loginPatient,
//   getPatientProfile,
//   updatePatientProfile,
//   changePatientPassword,
//   getDoctors,
//   getNearbyDoctors
// } = require('../controllers/patientController');
// const { protect, authorize } = require('../middleware/auth');

// // Public routes
// router.post('/register', registerPatient);
// router.post('/login', loginPatient);

// // Protected routes (Patient only)
// router.get('/profile', protect, authorize('patient'), getPatientProfile);
// router.put('/profile', protect, authorize('patient'), updatePatientProfile);
// router.put('/change-password', protect, authorize('patient'), changePatientPassword);
// router.get('/doctors', protect, authorize('patient'), getDoctors);
// // router.get('/doctors/nearby', protect, authorize('patient'), getNearbyDoctors);
// router.get('/nearby-healthcare', protect, getNearbyHealthcare);


// module.exports = router;