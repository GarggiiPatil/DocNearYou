// ============================================
// src/pages/AdminLogin.js
// ============================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
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

    if (!formData.email || !formData.password) {
      setError('Please fill all fields');
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting admin login with:', { email: formData.email });

      const response = await adminAPI.login({
        email: formData.email,
        password: formData.password
      });

      console.log('Admin login successful:', response.data);

      login(response.data.data, response.data.token, 'admin');
      toast.success('Login successful!');
      
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 500);
    } catch (err) {
      console.error('Admin login error:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.response) {
        errorMessage = err.response.data?.message || err.response.data?.error || errorMessage;
        console.error('Server error:', err.response.status, err.response.data);
      } else if (err.request) {
        errorMessage = 'Cannot connect to server. Please ensure backend is running on port 5000.';
        console.error('No response from server');
      } else {
        errorMessage = err.message;
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
        <h2>Admin Login</h2>
        
        {error && <div className="error-message">{error}</div>}

        <div style={{ 
          background: '#e3f2fd', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #2196f3'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#0d47a1' }}>
            🔐 <strong>Admin Access:</strong> This area is restricted to administrators only.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@docnearyou.com"
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
              placeholder="Enter password"
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
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;