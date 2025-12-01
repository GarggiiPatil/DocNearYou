import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Doctor APIs
export const doctorAPI = {
  register: (data) => api.post('/doctors/register', data),
  login: (data) => api.post('/doctors/login', data),
  getProfile: () => api.get('/doctors/profile'),
  updateProfile: (data) => api.put('/doctors/profile', data),
  changePassword: (data) => api.put('/doctors/change-password', data),
  getStatistics: () => api.get('/doctors/statistics')
};

// Patient APIs
export const patientAPI = {
  register: (data) => api.post('/patients/register', data),
  login: (data) => api.post('/patients/login', data),
  getProfile: () => api.get('/patients/profile'),
  updateProfile: (data) => api.put('/patients/profile', data),
  changePassword: (data) => api.put('/patients/change-password', data),
  getDoctors: () => api.get('/patients/doctors'),
  
  // Legacy endpoint for registered doctors only
  getNearbyDoctors: (latitude, longitude, maxDistance = 50000) => 
    api.get(`/patients/doctors/nearby?latitude=${latitude}&longitude=${longitude}&maxDistance=${maxDistance}`),
  
  // NEW: Enhanced endpoint for all healthcare facilities (hospitals, clinics, doctors)
  getNearbyHealthcare: (latitude, longitude, radius = 5000, type = 'all') => 
    api.get('/patients/nearby-healthcare', {
      params: { latitude, longitude, radius, type }
    }),
  
  // Helper method to get only specific types
  getNearbyHospitals: (latitude, longitude, radius = 5000) =>
    api.get('/patients/nearby-healthcare', {
      params: { latitude, longitude, radius, type: 'hospital' }
    }),
  
  getNearbyClinics: (latitude, longitude, radius = 5000) =>
    api.get('/patients/nearby-healthcare', {
      params: { latitude, longitude, radius, type: 'clinic' }
    }),
  
  getNearbyDoctorsOnly: (latitude, longitude, radius = 5000) =>
    api.get('/patients/nearby-healthcare', {
      params: { latitude, longitude, radius, type: 'doctors' }
    })
};

// Admin APIs
export const adminAPI = {
  login: (data) => api.post('/admin/login', data),
  getAllDoctors: () => api.get('/admin/doctors'),
  approveDoctor: (id, isApproved) => api.put(`/admin/doctors/${id}/approve`, { isApproved }),
  getDoctorActivity: (id) => api.get(`/admin/doctors/${id}/activity`)
};

// Appointment APIs
export const appointmentAPI = {
  create: (data) => api.post('/appointments', data),
  getPatientAppointments: () => api.get('/appointments/patient'),
  getDoctorAppointments: () => api.get('/appointments/doctor'),
  updateStatus: (id, data) => api.put(`/appointments/${id}/status`, data),
  cancel: (id) => api.put(`/appointments/${id}/cancel`),
  getSuggestedSlots: (doctorId, date) => api.get(`/appointments/suggested-slots/${doctorId}/${date}`)
};

// Blog APIs
export const blogAPI = {
  // Doctor blog management (authenticated)
  create: (data) => api.post('/blogs', data),
  getDoctorBlogs: () => api.get('/blogs/my-blogs'),
  update: (id, data) => api.put(`/blogs/${id}`, data),
  delete: (id) => api.delete(`/blogs/${id}`),
  
  // Patient blog viewing (public/authenticated)
  getPublishedBlogs: () => api.get('/blogs/published'),
  getBlogById: (id) => api.get(`/blogs/${id}`),
  incrementView: (id) => api.post(`/blogs/${id}/view`),
  
  // General methods
  getAll: () => api.get('/blogs')
};

// Chatbot APIs
export const chatbotAPI = {
  sendMessage: (message, conversationHistory = []) => 
    api.post('/chatbot/message', { message, conversationHistory }),
  getCommonQuestions: () => api.get('/chatbot/common-questions')
};

// NEW: Location/Maps APIs
export const locationAPI = {
  // Get current location coordinates
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      }
    });
  },
  
  // Calculate distance between two coordinates (in meters)
  calculateDistance: (lat1, lon1, lat2, lon2) => {
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
  },
  
  // Format distance for display
  formatDistance: (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(2)} km`;
    }
  },
  
  // Get directions URL for Google Maps
  getDirectionsUrl: (fromLat, fromLng, toLat, toLng) => {
    return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}`;
  },
  
  // Get place details URL for Google Maps
  getPlaceUrl: (lat, lng, placeName) => {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(placeName)}`;
  }
};

// Utility function to handle API errors
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      success: false,
      message: error.response.data.message || 'An error occurred',
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // Request made but no response
    return {
      success: false,
      message: 'No response from server. Please check your internet connection.',
      status: null,
      data: null
    };
  } else {
    // Error in request setup
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
      status: null,
      data: null
    };
  }
};

export default api;

// import axios from 'axios';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json'
//   }
// });

// // Add token to requests
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Doctor APIs
// export const doctorAPI = {
//   register: (data) => api.post('/doctors/register', data),
//   login: (data) => api.post('/doctors/login', data),
//   getProfile: () => api.get('/doctors/profile'),
//   updateProfile: (data) => api.put('/doctors/profile', data),
//   changePassword: (data) => api.put('/doctors/change-password', data),
//   getStatistics: () => api.get('/doctors/statistics')
// };

// // Patient APIs
// export const patientAPI = {
//   register: (data) => api.post('/patients/register', data),
//   login: (data) => api.post('/patients/login', data),
//   getProfile: () => api.get('/patients/profile'),
//   updateProfile: (data) => api.put('/patients/profile', data),
//   changePassword: (data) => api.put('/patients/change-password', data),
//   getDoctors: () => api.get('/patients/doctors'),
//   getNearbyDoctors: (latitude, longitude, maxDistance = 50000) => 
//     api.get(`/patients/doctors/nearby?latitude=${latitude}&longitude=${longitude}&maxDistance=${maxDistance}`)
// };

// // Admin APIs
// export const adminAPI = {
//   login: (data) => api.post('/admin/login', data),
//   getAllDoctors: () => api.get('/admin/doctors'),
//   approveDoctor: (id, isApproved) => api.put(`/admin/doctors/${id}/approve`, { isApproved }),
//   getDoctorActivity: (id) => api.get(`/admin/doctors/${id}/activity`)
// };

// // Appointment APIs
// export const appointmentAPI = {
//   create: (data) => api.post('/appointments', data),
//   getPatientAppointments: () => api.get('/appointments/patient'),
//   getDoctorAppointments: () => api.get('/appointments/doctor'),
//   updateStatus: (id, data) => api.put(`/appointments/${id}/status`, data),
//   cancel: (id) => api.put(`/appointments/${id}/cancel`),
//   getSuggestedSlots: (doctorId, date) => api.get(`/appointments/suggested-slots/${doctorId}/${date}`)
// };

// // Blog APIs
// export const blogAPI = {
//   // Doctor blog management (authenticated)
//   create: (data) => api.post('/blogs', data),
//   getDoctorBlogs: () => api.get('/blogs/my-blogs'), // FIXED: removed /doctor prefix
//   update: (id, data) => api.put(`/blogs/${id}`, data),
//   delete: (id) => api.delete(`/blogs/${id}`),
  
//   // Patient blog viewing (public/authenticated)
//   getPublishedBlogs: () => api.get('/blogs/published'),
//   getBlogById: (id) => api.get(`/blogs/${id}`),
//   incrementView: (id) => api.post(`/blogs/${id}/view`),
  
//   // General methods
//   getAll: () => api.get('/blogs')
// };

// // Chatbot APIs
// export const chatbotAPI = {
//   sendMessage: (message, conversationHistory = []) => 
//     api.post('/chatbot/message', { message, conversationHistory }),
//   getCommonQuestions: () => api.get('/chatbot/common-questions')
// };

// export default api;