const Admin = require('../models/Admin');
const { generateToken } = require('../middleware/auth');

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('=== Admin Login Attempt ===');
    console.log('Email:', email);

    // Validate input
    if (!email || !password) {
      console.log('ERROR: Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      console.log('ERROR: Admin not found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Admin found:', {
      id: admin._id,
      email: admin.email,
      hasPassword: !!admin.password
    });

    // Check password
    const isPasswordMatch = await admin.comparePassword(password);
    
    console.log('Password match:', isPasswordMatch);

    if (!isPasswordMatch) {
      console.log('ERROR: Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(admin._id, 'admin');

    console.log('SUCCESS: Admin logged in successfully');

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('=== ADMIN LOGIN ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get all doctors
// @route   GET /api/admin/doctors
// @access  Private (Admin)
exports.getAllDoctors = async (req, res) => {
  try {
    const Doctor = require('../models/Doctor');
    const doctors = await Doctor.find().select('-faceDescriptor -password');
    
    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message
    });
  }
};

// @desc    Approve/Reject doctor
// @route   PUT /api/admin/doctors/:id/approve
// @access  Private (Admin)
exports.approveDoctor = async (req, res) => {
  try {
    const { isApproved } = req.body;
    const Doctor = require('../models/Doctor');
    
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    ).select('-faceDescriptor -password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Doctor ${isApproved ? 'approved' : 'rejected'} successfully`,
      data: doctor
    });
  } catch (error) {
    console.error('Error approving doctor:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating doctor status',
      error: error.message
    });
  }
};

// @desc    Get doctor activity
// @route   GET /api/admin/doctors/:id/activity
// @access  Private (Admin)
exports.getDoctorActivity = async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    const Blog = require('../models/Blog');

    const appointments = await Appointment.find({ doctor: req.params.id })
      .populate('patient', 'name email')
      .sort('-createdAt');

    const blogs = await Blog.find({ author: req.params.id })
      .sort('-createdAt');

    return res.status(200).json({
      success: true,
      data: {
        appointments: {
          total: appointments.length,
          data: appointments
        },
        blogs: {
          total: blogs.length,
          data: blogs
        }
      }
    });
  } catch (error) {
    console.error('Error fetching doctor activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching doctor activity',
      error: error.message
    });
  }
};