import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const PatientProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergencyContact: '',
    emergencyContactName: ''
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
      // TODO: Replace with actual API call
      // const response = await patientAPI.getProfile();
      // const data = response.data.data;
      
      // Sample data for now
      const nameParts = user?.name?.split(' ') || ['', ''];
      setProfileData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        bloodGroup: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        emergencyContact: '',
        emergencyContactName: ''
      });
    } catch (err) {
      toast.error('Failed to fetch profile');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // await patientAPI.updateProfile(profileData);
      
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
      // TODO: Replace with actual API call
      // await patientAPI.changePassword({
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword
      // });
      
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
          <button className="btn btn-secondary" onClick={() => navigate('/patient/dashboard')}>Back</button>
        </div>

        <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Account Information</h3>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Patient ID:</strong> {user?.patientId || 'P12345'}</p>
          <p style={{ margin: 0 }}><strong>Account Status:</strong> <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✓ Active</span></p>
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
                <label>First Name *</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  required
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

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  value={profileData.gender}
                  onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Blood Group</label>
                <select
                  value={profileData.bloodGroup}
                  onChange={(e) => setProfileData({ ...profileData, bloodGroup: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  placeholder="Street Address"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  placeholder="City"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={profileData.state}
                  onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                  placeholder="State"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={profileData.pincode}
                  onChange={(e) => setProfileData({ ...profileData, pincode: e.target.value })}
                  placeholder="Pincode"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  value={profileData.emergencyContactName}
                  onChange={(e) => setProfileData({ ...profileData, emergencyContactName: e.target.value })}
                  placeholder="Contact Name"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={profileData.emergencyContact}
                  onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
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

export default PatientProfile;