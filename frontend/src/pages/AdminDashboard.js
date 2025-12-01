import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await adminAPI.getAllDoctors();
      setDoctors(response.data.data);
    } catch (err) {
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (doctorId, isApproved) => {
    try {
      await adminAPI.approveDoctor(doctorId, isApproved);
      toast.success(`Doctor ${isApproved ? 'approved' : 'rejected'} successfully`);
      fetchDoctors();
    } catch (err) {
      toast.error('Failed to update doctor status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="dashboard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Admin Dashboard</h1>
          <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
        <p style={{ color: '#666' }}>Logged in as: {user?.email}</p>
        <h2>Doctor Approval Management</h2>
        <p>Total: {doctors.length} | Pending: {doctors.filter(d => !d.isApproved).length} | Approved: {doctors.filter(d => d.isApproved).length}</p>
        {doctors.length === 0 ? (
          <p>No doctors registered yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#667eea', color: 'white' }}>
                <th style={{ padding: '15px' }}>Name</th>
                <th style={{ padding: '15px' }}>Doctor ID</th>
                <th style={{ padding: '15px' }}>Email</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor._id} style={{ borderBottom: '1px solid #e1e8ed' }}>
                  <td style={{ padding: '15px' }}>{doctor.name}</td>
                  <td style={{ padding: '15px' }}>{doctor.doctorId}</td>
                  <td style={{ padding: '15px' }}>{doctor.email}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ padding: '5px 15px', borderRadius: '20px', background: doctor.isApproved ? '#4caf50' : '#ff9800', color: 'white' }}>
                      {doctor.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    {!doctor.isApproved ? (
                      <>
                        <button onClick={() => handleApprove(doctor._id, true)} style={{ marginRight: '10px', padding: '8px 15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => handleApprove(doctor._id, false)} style={{ padding: '8px 15px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Reject</button>
                      </>
                    ) : (
                      <button onClick={() => handleApprove(doctor._id, false)} style={{ padding: '8px 15px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Revoke</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;