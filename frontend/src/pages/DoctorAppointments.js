import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { appointmentAPI } from '../services/api';

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionData, setActionData] = useState({ notes: '', rejectionReason: '' });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getDoctorAppointments();
      setAppointments(response.data.data);
    } catch (err) {
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appointmentId) => {
    try {
      await appointmentAPI.updateStatus(appointmentId, {
        status: 'approved',
        notes: actionData.notes
      });
      toast.success('Appointment approved successfully');
      setSelectedAppointment(null);
      setActionData({ notes: '', rejectionReason: '' });
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to approve appointment');
    }
  };

  const handleReject = async (appointmentId) => {
    if (!actionData.rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await appointmentAPI.updateStatus(appointmentId, {
        status: 'rejected',
        rejectionReason: actionData.rejectionReason
      });
      toast.success('Appointment rejected');
      setSelectedAppointment(null);
      setActionData({ notes: '', rejectionReason: '' });
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to reject appointment');
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      approved: '#4caf50',
      rejected: '#f44336',
      cancelled: '#9e9e9e',
      completed: '#2196f3'
    };
    return colors[status] || '#666';
  };

  if (loading) return <div className="loading">Loading appointments...</div>;

  return (
    <div className="container">
      <div className="dashboard">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1>Scheduled Appointments!</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/doctor/dashboard')}>Back</button>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['all', 'pending', 'approved', 'rejected', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                background: filter === status ? '#667eea' : '#f5f5f5',
                color: filter === status ? 'white' : '#333',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {status} ({appointments.filter(a => status === 'all' || a.status === status).length})
            </button>
          ))}
        </div>

        {filteredAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f5f5f5', borderRadius: '10px' }}>
            <h3>No {filter} appointments</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filteredAppointments.map(apt => (
              <div key={apt._id} style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                border: '2px solid #e1e8ed',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: getStatusColor(apt.status),
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {apt.status.toUpperCase()}
                </div>

                <h3 style={{ color: '#667eea', marginBottom: '15px' }}>{apt.patient.name}</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                  <div><strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleDateString()}</div>
                  <div><strong>Time:</strong> {apt.appointmentTime}</div>
                  <div><strong>Email:</strong> {apt.patient.email}</div>
                  <div><strong>Phone:</strong> {apt.patient.phone || 'N/A'}</div>
                </div>

                <div style={{ marginBottom: '15px', background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
                  <strong>Reason for Visit:</strong>
                  <p style={{ margin: '5px 0 0 0' }}>{apt.reason}</p>
                </div>

                {apt.patient.medicalHistory && (
                  <div style={{ marginBottom: '15px', background: '#e3f2fd', padding: '15px', borderRadius: '8px' }}>
                    <strong>Medical History:</strong>
                    <p style={{ margin: '5px 0 0 0' }}>{apt.patient.medicalHistory}</p>
                  </div>
                )}

                {apt.status === 'pending' && (
                  selectedAppointment === apt._id ? (
                    <div style={{ marginTop: '15px', background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes (Optional):</label>
                        <textarea
                          value={actionData.notes}
                          onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                          placeholder="Add any notes for the patient..."
                          rows="3"
                          style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '2px solid #e1e8ed' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleApprove(apt._id)}
                          style={{ padding: '10px 20px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Please provide a reason for rejection:');
                            if (reason) {
                              setActionData({ ...actionData, rejectionReason: reason });
                              handleReject(apt._id);
                            }
                          }}
                          style={{ padding: '10px 20px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                          ✗ Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAppointment(null);
                            setActionData({ notes: '', rejectionReason: '' });
                          }}
                          style={{ padding: '10px 20px', background: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedAppointment(apt._id)}
                      style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                      Take Action
                    </button>
                  )
                )}

                {apt.notes && (
                  <div style={{ marginTop: '15px', background: '#e3f2fd', padding: '15px', borderRadius: '8px' }}>
                    <strong>Your Notes:</strong>
                    <p style={{ margin: '5px 0 0 0' }}>{apt.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;