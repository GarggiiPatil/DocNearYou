// ============================================
// src/pages/PatientLogin.js
// ============================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { patientAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PatientLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await patientAPI.login({
        email: formData.email,
        password: formData.password
      });

      // Store auth data
      login(response.data.data, response.data.token, 'patient');
      
      // Show success message
      toast.success('Login successful!');
      
      // Redirect to patient dashboard
      navigate('/patient/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Patient Login</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="patient@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="link-text">
          Don't have an account? <Link to="/patient/register">Register here</Link>
        </div>
        <div className="link-text">
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default PatientLogin;