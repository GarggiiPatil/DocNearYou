const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Admin = require('../models/Admin');

// Generate JWT Token
const generateToken = (id, type) => {
  return jwt.sign(
    { id, type }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

// Protect routes - general authentication
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check user type and fetch appropriate user
      if (decoded.type === 'doctor') {
        req.user = await Doctor.findById(decoded.id).select('-password');
      } else if (decoded.type === 'patient') {
        req.user = await Patient.findById(decoded.id).select('-password');
      } else if (decoded.type === 'admin') {
        req.user = await Admin.findById(decoded.id).select('-password');
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      req.userType = decoded.type;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userType)) {
      return res.status(403).json({
        success: false,
        message: `User type ${req.userType} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { 
  protect, 
  authorize, 
  generateToken 
};