const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getSuggestedSlots
} = require('../controllers/appointmentController');

const { protect, authorize } = require('../middleware/auth');
const blockchain = require('../utils/blockchain');

// PATIENT ROUTES
router.post('/', protect, authorize('patient'), createAppointment);
router.get('/patient', protect, authorize('patient'), getPatientAppointments);
router.put('/:id/cancel', protect, authorize('patient'), cancelAppointment);
router.get('/suggested-slots/:doctorId/:date', protect, authorize('patient'), getSuggestedSlots);

// DOCTOR ROUTES
router.get('/doctor', protect, authorize('doctor'), getDoctorAppointments);
router.put('/:id/status', protect, authorize('doctor'), updateAppointmentStatus);

// ADMIN — VIEW BLOCKCHAIN HISTORY
router.get('/blockchain/history', protect, authorize('admin'), (req, res) => {
  return res.status(200).json({
    success: true,
    chainValid: blockchain.verifyChain(),
    length: blockchain.getHistory().length,
    data: blockchain.getHistory()
  });
});

module.exports = router;