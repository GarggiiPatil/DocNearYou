import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css'; // Make sure to import the CSS

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Animated medical background */}
      <div className="medical-background">
        <div className="medical-overlay"></div>
        <div className="floating-icons">
          <span className="medical-icon">⚕️</span>
          <span className="medical-icon">🏥</span>
          <span className="medical-icon">💊</span>
          <span className="medical-icon">🩺</span>
          <span className="medical-icon">❤️</span>
          <span className="medical-icon">💉</span>
          <span className="medical-icon">🧬</span>
          <span className="medical-icon">🔬</span>
        </div>
      </div>

      <div className="home-content">
        <div className="home-header">
          <h1 className="home-title">DOCNEARYOU</h1>
          <p className="home-subtitle">Your Trusted Healthcare Partner</p>
        </div>
        
        <div className="home-options">
          <div className="home-card doctor-card">
            <div className="card-icon">👨‍⚕️</div>
            <h2>Doctor</h2>
            <p>Manage appointments, write blogs, and connect with patients</p>
            <div className="card-buttons">
              <button className="btn btn-primary" onClick={() => navigate('/doctor/login')}>
                Doctor Login
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/doctor/register')}>
                Doctor Register
              </button>
            </div>
          </div>

          <div className="home-card patient-card">
            <div className="card-icon">🧑‍⚕️</div>
            <h2>Patient</h2>
            <p>Book appointments, find nearby doctors, and read health blogs</p>
            <div className="card-buttons">
              <button className="btn btn-primary" onClick={() => navigate('/patient/login')}>
                Patient Login
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/patient/register')}>
                Patient Register
              </button>
            </div>
          </div>

          <div className="home-card admin-card">
            <div className="card-icon">🔐</div>
            <h2>Admin</h2>
            <p>Monitor doctor activities and manage approvals</p>
            <div className="card-buttons">
              <button className="btn btn-primary" onClick={() => navigate('/admin/login')}>
                Admin Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;