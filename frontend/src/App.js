import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';
import './App.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import Pages
import Home from './pages/Home';
import DoctorLogin from './pages/DoctorLogin';
import DoctorRegister from './pages/DoctorRegister';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientLogin from './pages/PatientLogin';
import PatientRegister from './pages/PatientRegister';
import PatientDashboard from './pages/PatientDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

// Patient Feature Pages
import BookAppointment from './pages/BookAppointment';
import MyAppointments from './pages/MyAppointments';
import NearbyDoctors from './pages/NearbyDoctors';
import HealthChatbot from './pages/HealthChatbot';
import PatientHealthBlogs from './pages/PatientHealthBlogs';
import PatientProfile from './pages/PatientProfile';

// Doctor Feature Pages
import DoctorAppointments from './pages/DoctorAppointments';
import DoctorBlogs from './pages/DoctorBlogs';
import DoctorProfile from './pages/DoctorProfile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Home Route */}
            <Route path="/" element={<Home />} />
            
            {/* Doctor Routes */}
            <Route path="/doctor/login" element={<DoctorLogin />} />
            <Route path="/doctor/register" element={<DoctorRegister />} />
            <Route 
              path="/doctor/dashboard" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/appointments" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <DoctorAppointments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/blogs" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <DoctorBlogs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor/profile" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <DoctorProfile />
                </ProtectedRoute>
              } 
            />
            
            {/* Patient Routes */}
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route path="/patient/register" element={<PatientRegister />} />
            <Route 
              path="/patient/dashboard" 
              element={
                <ProtectedRoute allowedRole="patient">
                  <PatientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/book-appointment" 
              element={
                <ProtectedRoute allowedRole="patient">
                  <BookAppointment />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/appointments" 
              element={
                <ProtectedRoute allowedRole="patient">
                  <MyAppointments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/nearby-doctors" 
              element={
                <ProtectedRoute allowedRole="patient">
                  <NearbyDoctors />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/chatbot" 
              element={
                <ProtectedRoute allowedRole="patient">
                  <HealthChatbot />
                </ProtectedRoute>
              } 
            />
            {/* <Route 
              path="/patient/health-blogs" 
              element={
                <ProtectedRoute allowedRole="patient">
                  <PatientHealthBlogs />
                </ProtectedRoute>
              } 
            /> */}
            <Route 
              path="/patient/profile" 
              element={
                <ProtectedRoute allowedRole="patient">
                  <PatientProfile />
                </ProtectedRoute>
              } 
            />
             <Route path="/patient/health-blogs" element={<PatientHealthBlogs />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;