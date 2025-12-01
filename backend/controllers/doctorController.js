const Doctor = require('../models/Doctor');
const { generateToken } = require('../middleware/auth');

// Helper: Euclidean distance between two face descriptors
function calculateEuclideanDistance(desc1, desc2) {
  if (!desc1 || !desc2) return Infinity;
  if (desc1.length !== desc2.length) return Infinity;

  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }

  return Math.sqrt(sum);
}

/* ======================================================
   REGISTER DOCTOR (SAVE FACE DATA)
====================================================== */
exports.registerDoctor = async (req, res) => {
  try {
    const {
      name,
      doctorId,
      email,
      password,
      faceDescriptor,
      faceImage
    } = req.body;

    if (!name || !doctorId || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields'
      });
    }

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({
        success: false,
        message: 'Face descriptor missing or invalid'
      });
    }

    if (!faceImage) {
      return res.status(400).json({
        success: false,
        message: 'Face image missing'
      });
    }

    const exists = await Doctor.findOne({ $or: [{ email }, { doctorId }] });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Doctor with this email or doctor ID already exists'
      });
    }

    const doctor = await Doctor.create({
      name,
      doctorId,
      email,
      password,
      faceDescriptor,
      faceImage
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Waiting for admin approval.',
      data: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        doctorId: doctor.doctorId,
        isApproved: doctor.isApproved
      }
    });

  } catch (err) {
    console.error('Register Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error registering doctor',
      error: err.message
    });
  }
};

/* ======================================================
   LOGIN DOCTOR WITH FACE RECOGNITION
====================================================== */
exports.loginDoctor = async (req, res) => {
  try {
    const { email, password, faceDescriptor } = req.body;

    if (!email || !password || !faceDescriptor) {
      return res.status(400).json({
        success: false,
        message: 'Email, password and face data are required'
      });
    }

    const doctor = await Doctor.findOne({ email }).select('+password');

    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!doctor.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Account pending admin approval'
      });
    }

    // Compare password
    const match = await doctor.comparePassword(password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // FACE RECOGNITION CHECK
    const distance = calculateEuclideanDistance(
      doctor.faceDescriptor,
      faceDescriptor
    );

    console.log("FACE DISTANCE:", distance);

    const FACE_THRESHOLD = 0.55;

    if (distance > FACE_THRESHOLD) {
      return res.status(401).json({
        success: false,
        message: 'Face verification failed'
      });
    }

    // Generate Token
    const token = generateToken(doctor._id, 'doctor');

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        doctorId: doctor.doctorId,
        specialization: doctor.specialization,
        hospital: doctor.hospital
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: err.message
    });
  }
};

/* ======================================================
   GET DOCTOR PROFILE
====================================================== */
exports.getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user._id)
      .select('-password -faceDescriptor -faceImage');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor
    });

  } catch (err) {
    console.error('Profile Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: err.message
    });
  }
};

/* ======================================================
   UPDATE DOCTOR PROFILE
====================================================== */
exports.updateDoctorProfile = async (req, res) => {
  try {
    const { name, specialization, hospital, phone, location } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (specialization) updateData.specialization = specialization;
    if (hospital) updateData.hospital = hospital;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;

    const doctor = await Doctor.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -faceDescriptor -faceImage');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: doctor
    });

  } catch (err) {
    console.error('Update Profile Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: err.message
    });
  }
};

/* ======================================================
   CHANGE DOCTOR PASSWORD
====================================================== */
exports.changeDoctorPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const doctor = await Doctor.findById(req.user._id).select('+password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const isMatch = await doctor.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    doctor.password = newPassword;
    await doctor.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (err) {
    console.error('Password Change Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: err.message
    });
  }
};

/* ======================================================
   GET DOCTOR STATISTICS
====================================================== */
exports.getDoctorStatistics = async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    const Blog = require('../models/Blog');

    const appointments = await Appointment.find({ doctor: req.user._id });
    const blogs = await Blog.find({ author: req.user._id });

    const stats = {
      totalAppointments: appointments.length,
      pendingAppointments: appointments.filter(a => a.status === 'pending').length,
      approvedAppointments: appointments.filter(a => a.status === 'approved').length,
      completedAppointments: appointments.filter(a => a.status === 'completed').length,
      rejectedAppointments: appointments.filter(a => a.status === 'rejected').length,
      totalBlogs: blogs.length,
      publishedBlogs: blogs.filter(b => b.isPublished).length
    };

    return res.status(200).json({
      success: true,
      data: stats
    });

  } catch (err) {
    console.error('Statistics Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: err.message
    });
  }
};



// const Doctor = require('../models/Doctor');
// const { generateToken } = require('../middleware/auth');

// // Helper function for face recognition
// function calculateEuclideanDistance(descriptor1, descriptor2) {
//   if (!descriptor1 || !descriptor2) return Infinity;
//   if (descriptor1.length !== descriptor2.length) return Infinity;
  
//   let sum = 0;
//   for (let i = 0; i < descriptor1.length; i++) {
//     sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
//   }
//   return Math.sqrt(sum);
// }

// // @desc    Register doctor
// // @route   POST /api/doctors/register
// // @access  Public
// exports.registerDoctor = async (req, res) => {
//   try {
//     const { name, doctorId, email, password, faceDescriptor, faceImage } = req.body;

//     if (!name || !doctorId || !email || !password || !faceDescriptor || !faceImage) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide all required fields including face data'
//       });
//     }

//     const doctorExists = await Doctor.findOne({ $or: [{ email }, { doctorId }] });
//     if (doctorExists) {
//       return res.status(400).json({
//         success: false,
//         message: 'Doctor with this email or doctor ID already exists'
//       });
//     }

//     const doctor = await Doctor.create({
//       name,
//       doctorId,
//       email,
//       password,
//       faceDescriptor,
//       faceImage
//     });

//     return res.status(201).json({
//       success: true,
//       message: 'Doctor registered successfully. Waiting for admin approval.',
//       data: {
//         id: doctor._id,
//         name: doctor.name,
//         email: doctor.email,
//         doctorId: doctor.doctorId,
//         isApproved: doctor.isApproved
//       }
//     });
//   } catch (error) {
//     console.error('Doctor registration error:', error);

//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: 'Doctor with this email or doctor ID already exists'
//       });
//     }

//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({
//         success: false,
//         message: messages.join(', ')
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: 'Error registering doctor',
//       error: error.message
//     });
//   }
// };

// // @desc    Login doctor with face recognition
// // @route   POST /api/doctors/login
// // @access  Public
// exports.loginDoctor = async (req, res) => {
//   try {
//     const { email, password, faceDescriptor } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide email and password'
//       });
//     }

//     const doctor = await Doctor.findOne({ email }).select('+password');
//     if (!doctor) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials'
//       });
//     }

//     if (!doctor.isApproved) {
//       return res.status(403).json({
//         success: false,
//         message: 'Your account is pending admin approval. Please contact admin.'
//       });
//     }

//     const isPasswordMatch = await doctor.comparePassword(password);
//     if (!isPasswordMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials'
//       });
//     }

//     // Face recognition (relaxed for testing)
//     if (faceDescriptor && doctor.faceDescriptor) {
//       const distance = calculateEuclideanDistance(doctor.faceDescriptor, faceDescriptor);
//       if (distance > 0.6) {
//         console.warn('Face recognition distance too high, but allowing login');
//       }
//     }

//     const token = generateToken(doctor._id, 'doctor');

//     return res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       token,
//       data: {
//         id: doctor._id,
//         name: doctor.name,
//         email: doctor.email,
//         doctorId: doctor.doctorId,
//         specialization: doctor.specialization,
//         hospital: doctor.hospital
//       }
//     });
//   } catch (error) {
//     console.error('Doctor login error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error logging in',
//       error: error.message
//     });
//   }
// };

// // @desc    Get doctor profile
// // @route   GET /api/doctors/profile
// // @access  Private (Doctor)
// exports.getDoctorProfile = async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.user._id).select('-faceDescriptor -faceImage');
    
//     if (!doctor) {
//       return res.status(404).json({
//         success: false,
//         message: 'Doctor not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: doctor
//     });
//   } catch (error) {
//     console.error('Error fetching profile:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error fetching profile',
//       error: error.message
//     });
//   }
// };

// // @desc    Update doctor profile
// // @route   PUT /api/doctors/profile
// // @access  Private (Doctor)
// exports.updateDoctorProfile = async (req, res) => {
//   try {
//     const { name, specialization, hospital, phone, location } = req.body;
    
//     const updateData = {};
//     if (name) updateData.name = name;
//     if (specialization) updateData.specialization = specialization;
//     if (hospital) updateData.hospital = hospital;
//     if (phone) updateData.phone = phone;
//     if (location) updateData.location = location;

//     const doctor = await Doctor.findByIdAndUpdate(
//       req.user._id,
//       updateData,
//       { new: true, runValidators: true }
//     ).select('-faceDescriptor -faceImage -password');

//     if (!doctor) {
//       return res.status(404).json({
//         success: false,
//         message: 'Doctor not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Profile updated successfully',
//       data: doctor
//     });
//   } catch (error) {
//     console.error('Error updating profile:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error updating profile',
//       error: error.message
//     });
//   }
// };

// // @desc    Change doctor password
// // @route   PUT /api/doctors/change-password
// // @access  Private (Doctor)
// exports.changeDoctorPassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide current and new password'
//       });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: 'New password must be at least 6 characters'
//       });
//     }

//     const doctor = await Doctor.findById(req.user._id).select('+password');
    
//     if (!doctor) {
//       return res.status(404).json({
//         success: false,
//         message: 'Doctor not found'
//       });
//     }

//     const isMatch = await doctor.comparePassword(currentPassword);
//     if (!isMatch) {
//       return res.status(400).json({
//         success: false,
//         message: 'Current password is incorrect'
//       });
//     }

//     doctor.password = newPassword;
//     await doctor.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Password changed successfully'
//     });
//   } catch (error) {
//     console.error('Error changing password:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error changing password',
//       error: error.message
//     });
//   }
// };

// // @desc    Get doctor statistics
// // @route   GET /api/doctors/statistics
// // @access  Private (Doctor)
// exports.getDoctorStatistics = async (req, res) => {
//   try {
//     const Appointment = require('../models/Appointment');
//     const Blog = require('../models/Blog');

//     const appointments = await Appointment.find({ doctor: req.user._id });
//     const blogs = await Blog.find({ author: req.user._id });

//     const stats = {
//       totalAppointments: appointments.length,
//       pendingAppointments: appointments.filter(a => a.status === 'pending').length,
//       approvedAppointments: appointments.filter(a => a.status === 'approved').length,
//       completedAppointments: appointments.filter(a => a.status === 'completed').length,
//       rejectedAppointments: appointments.filter(a => a.status === 'rejected').length,
//       totalBlogs: blogs.length,
//       publishedBlogs: blogs.filter(b => b.isPublished).length
//     };

//     return res.status(200).json({
//       success: true,
//       data: stats
//     });
//   } catch (error) {
//     console.error('Error fetching statistics:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error fetching statistics',
//       error: error.message
//     });
//   }
// };