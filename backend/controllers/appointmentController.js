const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const blockchain = require('../utils/blockchain');

// Simple Q-Learning for appointment scheduling
class AppointmentScheduler {
  constructor() {
    this.qTable = {};
    this.learningRate = 0.1;
    this.discountFactor = 0.9;
    this.epsilon = 0.1;
  }

  getState(date, time, doctorLoad) {
    return `${date}_${time}_${doctorLoad}`;
  }

  getOptimalTimeSlot(doctorId, date, existingAppointments) {
    const timeSlots = [
      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ];

    const slotScores = timeSlots.map(time => {
      const state = this.getState(date, time, existingAppointments.length);
      const qValue = this.qTable[state] || 0;
      
      const isBooked = existingAppointments.some(apt => 
        apt.appointmentTime === time && 
        apt.appointmentDate.toISOString().split('T')[0] === date
      );

      return {
        time,
        score: isBooked ? -Infinity : qValue,
        available: !isBooked
      };
    });

    return slotScores
      .filter(slot => slot.available)
      .sort((a, b) => b.score - a.score);
  }

  updateQValue(state, reward) {
    const currentQ = this.qTable[state] || 0;
    this.qTable[state] = currentQ + this.learningRate * (reward - currentQ);
  }
}

const scheduler = new AppointmentScheduler();

/* ===========================================
   CREATE APPOINTMENT  (BLOCKCHAIN LOGGING ADDED)
   =========================================== */
exports.createAppointment = async (req, res) => {
  try {
    const { doctor, appointmentDate, appointmentTime, reason } = req.body;

    if (!doctor || !appointmentDate || !appointmentTime || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const doctorExists = await Doctor.findOne({ _id: doctor, isApproved: true });
    if (!doctorExists) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not approved'
      });
    }

    const existingAppointments = await Appointment.find({
      doctor,
      appointmentDate: new Date(appointmentDate),
      status: { $in: ['pending', 'approved'] }
    });

    const slotTaken = existingAppointments.some(
      apt => apt.appointmentTime === appointmentTime
    );

    if (slotTaken) {
      const alternatives = scheduler.getOptimalTimeSlot(
        doctor,
        appointmentDate,
        existingAppointments
      );

      return res.status(400).json({
        success: false,
        message: 'Time slot not available',
        suggestedSlots: alternatives.slice(0, 3).map(s => s.time)
      });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor,
      appointmentDate,
      appointmentTime,
      reason,
      status: 'pending'
    });

    // Q-learning update
    const state = scheduler.getState(appointmentDate, appointmentTime, existingAppointments.length);
    scheduler.updateQValue(state, 1);

    // BLOCKCHAIN LOGGING
    blockchain.addBlock({
      action: 'CREATE_APPOINTMENT',
      appointmentId: appointment._id.toString(),
      patient: req.user._id.toString(),
      doctor,
      date: appointmentDate,
      time: appointmentTime,
      reason,
      status: 'pending'
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'name email specialization hospital location')
      .populate('patient', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Appointment request sent. Waiting for doctor confirmation.',
      data: populatedAppointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message
    });
  }
};

/* ===========================================
   GET SUGGESTED SLOTS
   =========================================== */
exports.getSuggestedSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: new Date(date),
      status: { $in: ['pending', 'approved'] }
    });

    const suggestedSlots = scheduler.getOptimalTimeSlot(
      doctorId,
      date,
      existingAppointments
    );

    return res.status(200).json({
      success: true,
      data: suggestedSlots.slice(0, 5)
    });
  } catch (error) {
    console.error('Error getting suggested slots:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting suggested slots',
      error: error.message
    });
  }
};

/* ===========================================
   GET PATIENT APPOINTMENTS
   =========================================== */
exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name email specialization hospital location')
      .sort('-createdAt');

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

/* ===========================================
   GET DOCTOR APPOINTMENTS
   =========================================== */
exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user._id })
      .populate('patient', 'name email phone dateOfBirth medicalHistory')
      .sort('-createdAt');

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

/* ===========================================
   UPDATE APPOINTMENT STATUS (BLOCKCHAIN LOGGING)
   =========================================== */
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, rejectionReason, notes } = req.body;
    
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: req.user._id
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = status;
    if (rejectionReason) appointment.rejectionReason = rejectionReason;
    if (notes) appointment.notes = notes;

    await appointment.save();

    // Q-Learning update
    const state = scheduler.getState(
      appointment.appointmentDate.toISOString().split('T')[0],
      appointment.appointmentTime,
      0
    );
    scheduler.updateQValue(state, status === 'approved' ? 1 : -0.5);

    // BLOCKCHAIN LOGGING
    blockchain.addBlock({
      action: 'UPDATE_STATUS',
      appointmentId: appointment._id.toString(),
      doctor: req.user._id.toString(),
      newStatus: status,
      rejectionReason,
      notes,
      timestamp: new Date()
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email')
      .populate('doctor', 'name email');

    return res.status(200).json({
      success: true,
      message: `Appointment ${status} successfully`,
      data: populatedAppointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating appointment status',
      error: error.message
    });
  }
};

/* ===========================================
   CANCEL APPOINTMENT (BLOCKCHAIN LOGGING)
   =========================================== */
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // BLOCKCHAIN LOGGING
    blockchain.addBlock({
      action: 'CANCEL_APPOINTMENT',
      appointmentId: appointment._id.toString(),
      patient: req.user._id.toString(),
      timestamp: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error cancelling appointment',
      error: error.message
    });
  }
};