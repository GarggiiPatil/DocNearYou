import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { patientAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PatientRegister = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: ''
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
    if (!formData.name || !formData.email || !formData.dateOfBirth || !formData.password) {
      setError('Please fill all fields');
      toast.error('Please fill all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting registration with:', {
        name: formData.name,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth
      });

      const response = await patientAPI.register({
        name: formData.name,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        password: formData.password
      });

      console.log('Registration successful:', response.data);

      login(response.data.data, response.data.token, 'patient');
      toast.success('Registration successful!');
      setTimeout(() => {
        navigate('/patient/dashboard');
      }, 1000);
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.message || err.response.data?.error || errorMessage;
        console.error('Server error:', err.response.status, err.response.data);
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'Cannot connect to server. Please ensure backend is running on port 5000.';
        console.error('No response from server:', err.request);
      } else {
        // Error in request setup
        errorMessage = err.message;
        console.error('Request error:', err.message);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Patient Registration</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
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
            <label>Date of Birth *</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>Password * (minimum 6 characters)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              minLength="6"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              required
              minLength="6"
              autoComplete="new-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="link-text">
          Already have an account? <Link to="/patient/login">Login here</Link>
        </div>
        <div className="link-text">
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default PatientRegister;