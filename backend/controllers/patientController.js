const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { generateToken } = require('../middleware/auth');

// K-Means Clustering Algorithm
class KMeansClustering {
  constructor(k = 3) {
    this.k = k;
  }

  euclideanDistance(point1, point2) {
    const [lat1, lon1] = point1;
    const [lat2, lon2] = point2;
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
  }

  cluster(points) {
    if (points.length <= this.k) {
      return points.map((point, idx) => ({ ...point, cluster: idx }));
    }

    let centroids = points
      .sort(() => Math.random() - 0.5)
      .slice(0, this.k)
      .map(p => p.coordinates);

    let clusters = [];
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
      clusters = points.map(point => {
        const distances = centroids.map(centroid =>
          this.euclideanDistance(point.coordinates, centroid)
        );
        const clusterIdx = distances.indexOf(Math.min(...distances));
        return { ...point, cluster: clusterIdx, distance: distances[clusterIdx] };
      });

      const newCentroids = [];
      for (let i = 0; i < this.k; i++) {
        const clusterPoints = clusters.filter(p => p.cluster === i);
        if (clusterPoints.length > 0) {
          const avgLat = clusterPoints.reduce((sum, p) => sum + p.coordinates[0], 0) / clusterPoints.length;
          const avgLon = clusterPoints.reduce((sum, p) => sum + p.coordinates[1], 0) / clusterPoints.length;
          newCentroids.push([avgLat, avgLon]);
        } else {
          newCentroids.push(centroids[i]);
        }
      }

      const converged = centroids.every((c, i) =>
        this.euclideanDistance(c, newCentroids[i]) < 0.0001
      );

      if (converged) break;
      centroids = newCentroids;
      iterations++;
    }

    return clusters;
  }
}

// Helper function - Haversine distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// @desc    Register patient
// @route   POST /api/patients/register
// @access  Public
exports.registerPatient = async (req, res) => {
  try {
    const { name, email, password, dateOfBirth } = req.body;

    if (!name || !email || !password || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const patientExists = await Patient.findOne({ email });
    if (patientExists) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this email already exists'
      });
    }

    const patient = await Patient.create({
      name,
      email,
      password,
      dateOfBirth
    });

    const token = generateToken(patient._id, 'patient');

    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      token,
      data: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this email already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error registering patient',
      error: error.message
    });
  }
};

// @desc    Login patient
// @route   POST /api/patients/login
// @access  Public
exports.loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const patient = await Patient.findOne({ email }).select('+password');
    if (!patient) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordMatch = await patient.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(patient._id, 'patient');

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: patient._id,
        name: patient.name,
        email: patient.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get patient profile
// @route   GET /api/patients/profile
// @access  Private (Patient)
exports.getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user._id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// @desc    Update patient profile
// @route   PUT /api/patients/profile
// @access  Private (Patient)
exports.updatePatientProfile = async (req, res) => {
  try {
    const { name, phone, address, medicalHistory } = req.body;
    
    const patient = await Patient.findByIdAndUpdate(
      req.user._id,
      { name, phone, address, medicalHistory },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: patient
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Change patient password
// @route   PUT /api/patients/change-password
// @access  Private (Patient)
exports.changePatientPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const patient = await Patient.findById(req.user._id).select('+password');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const isMatch = await patient.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    patient.password = newPassword;
    await patient.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// @desc    Get all doctors/hospitals for booking
// @route   GET /api/patients/doctors
// @access  Private (Patient)
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isApproved: true, isActive: true })
      .select('-faceDescriptor -faceImage -password');
    
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

// // @desc    Get nearby doctors with K-Means clustering
// // @route   GET /api/patients/doctors/nearby
// // @access  Private (Patient)
// exports.getNearbyDoctors = async (req, res) => {
//   try {
//     const { latitude, longitude, maxDistance = 50000 } = req.query;

//     if (!latitude || !longitude) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide latitude and longitude'
//       });
//     }

//     const userLocation = [parseFloat(latitude), parseFloat(longitude)];

//     // Get all approved doctors
//     const doctors = await Doctor.find({
//       isApproved: true,
//       isActive: true
//     }).select('-faceDescriptor -faceImage -password');

//     // Filter doctors within max distance and prepare for clustering
//     const doctorsWithDistance = doctors
//       .filter(doc => doc.location && doc.location.coordinates && doc.location.coordinates.length === 2)
//       .map(doc => {
//         const distance = calculateDistance(
//           userLocation[0],
//           userLocation[1],
//           doc.location.coordinates[1],
//           doc.location.coordinates[0]
//         );
//         return {
//           ...doc.toObject(),
//           distance,
//           coordinates: [doc.location.coordinates[1], doc.location.coordinates[0]]
//         };
//       })
//       .filter(doc => doc.distance <= maxDistance)
//       .sort((a, b) => a.distance - b.distance);

//     // Apply K-Means clustering
//     const kmeans = new KMeansClustering(3);
//     const clusteredDoctors = kmeans.cluster(doctorsWithDistance);

//     return res.status(200).json({
//       success: true,
//       count: clusteredDoctors.length,
//       userLocation: {
//         latitude: userLocation[0],
//         longitude: userLocation[1]
//       },
//       data: clusteredDoctors,
//       clusters: {
//         total: Math.min(3, clusteredDoctors.length),
//         doctors: clusteredDoctors
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching nearby doctors:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error fetching nearby doctors',
//       error: error.message
//     });
//   }
// };

// Add this to your existing patient controller

// Get nearby healthcare facilities using OpenStreetMap Overpass API
exports.getNearbyHealthcare = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000, type = 'all' } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseInt(radius);

    // Define search types
    const searchTypes = type === 'all' 
      ? ['hospital', 'clinic', 'doctors'] 
      : [type];

    let allPlaces = [];

    // Fetch from OpenStreetMap Overpass API
    for (const searchType of searchTypes) {
      const query = `
        [out:json];
        (
          node["amenity"="${searchType}"](around:${rad},${lat},${lng});
          way["amenity"="${searchType}"](around:${rad},${lat},${lng});
          node["healthcare"="${searchType}"](around:${rad},${lat},${lng});
          way["healthcare"="${searchType}"](around:${rad},${lat},${lng});
        );
        out center;
      `;

      try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
          headers: { 'Content-Type': 'text/plain' }
        });

        const data = await response.json();
        
        if (data.elements) {
          const formattedPlaces = data.elements
            .map(place => ({
              id: place.id,
              name: place.tags?.name || `${searchType.charAt(0).toUpperCase() + searchType.slice(1)}`,
              type: searchType,
              latitude: place.lat || place.center?.lat,
              longitude: place.lon || place.center?.lon,
              address: place.tags?.['addr:street'] || 'Address not available',
              phone: place.tags?.phone || place.tags?.['contact:phone'] || 'N/A',
              opening_hours: place.tags?.opening_hours || 'Not specified',
              website: place.tags?.website || place.tags?.['contact:website'],
              distance: calculateDistance(
                lat, lng,
                place.lat || place.center?.lat,
                place.lon || place.center?.lon
              )
            }))
            .filter(p => p.latitude && p.longitude);

          allPlaces = [...allPlaces, ...formattedPlaces];
        }
      } catch (error) {
        console.error(`Error fetching ${searchType}:`, error);
      }
    }

    // Also fetch registered doctors from your database
    const Doctor = require('../models/Doctor');
    const registeredDoctors = await Doctor.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: rad
        }
      }
    }).select('name specialization hospital location phone');

    // Add registered doctors to the list
    const formattedDoctors = registeredDoctors.map(doctor => ({
      id: doctor._id,
      name: doctor.name,
      type: 'doctors',
      latitude: doctor.location.coordinates[1],
      longitude: doctor.location.coordinates[0],
      address: doctor.location.address || 'Address not available',
      phone: doctor.phone || 'N/A',
      specialization: doctor.specialization,
      hospital: doctor.hospital,
      distance: calculateDistance(
        lat, lng,
        doctor.location.coordinates[1],
        doctor.location.coordinates[0]
      ),
      isRegistered: true
    }));

    allPlaces = [...allPlaces, ...formattedDoctors];

    // Sort by distance
    allPlaces.sort((a, b) => a.distance - b.distance);

    res.status(200).json({
      success: true,
      count: allPlaces.length,
      data: allPlaces,
      userLocation: { latitude: lat, longitude: lng },
      radius: rad
    });

  } catch (error) {
    console.error('Error in getNearbyHealthcare:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby healthcare facilities',
      error: error.message
    });
  }
};

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}