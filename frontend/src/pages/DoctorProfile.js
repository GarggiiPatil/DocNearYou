import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { doctorAPI } from '../services/api';

const DoctorProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    specialization: '',
    hospital: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await doctorAPI.getProfile();
      const data = response.data.data;
      setProfileData({
        name: data.name || '',
        specialization: data.specialization || '',
        hospital: data.hospital || '',
        phone: data.phone || ''
      });
    } catch (err) {
      toast.error('Failed to fetch profile');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await doctorAPI.updateProfile(profileData);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await doctorAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="dashboard">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1>👤 My Profile</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/doctor/dashboard')}>Back</button>
        </div>

        <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Account Information</h3>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Doctor ID:</strong> {user?.doctorId}</p>
          <p style={{ margin: 0 }}><strong>Account Status:</strong> <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✓ Approved</span></p>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'profile' ? '#667eea' : '#f5f5f5',
              color: activeTab === 'profile' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'password' ? '#667eea' : '#f5f5f5',
              color: activeTab === 'password' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Change Password
          </button>
        </div>

        <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileUpdate}>
              <h2>Update Profile Information</h2>
              
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  value={profileData.specialization}
                  onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                  placeholder="e.g., Cardiologist, Pediatrician"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>Hospital/Clinic</label>
                <input
                  type="text"
                  value={profileData.hospital}
                  onChange={(e) => setProfileData({ ...profileData, hospital: e.target.value })}
                  placeholder="e.g., City Hospital"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+1234567890"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordChange}>
              <h2>Change Password</h2>

              <div className="form-group">
                <label>Current Password *</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>New Password * (minimum 6 characters)</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength="6"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength="6"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;