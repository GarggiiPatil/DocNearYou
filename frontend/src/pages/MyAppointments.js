import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { appointmentAPI } from '../services/api';

const MyAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentAPI.getPatientAppointments();
      setAppointments(response.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentAPI.cancel(id);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to cancel appointment');
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

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      approved: '✓',
      rejected: '✗',
      cancelled: '🚫',
      completed: '✔️'
    };
    return icons[status] || '•';
  };

  if (loading) return <div className="loading">Loading appointments...</div>;

  return (
    <div className="container">
      <div className="dashboard">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1>My Appointments!</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/patient/dashboard')}>
            Back
          </button>
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
            <h3>No appointments found</h3>
            <p>Book your first appointment to get started!</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/patient/book-appointment')}
              style={{ marginTop: '20px' }}
            >
              Book Appointment
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filteredAppointments.map(apt => (
              <div
                key={apt._id}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '2px solid #e1e8ed',
                  position: 'relative'
                }}
              >
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
                  {getStatusIcon(apt.status)} {apt.status.toUpperCase()}
                </div>

                {/* SAFE DOCTOR NAME */}
                <h3 style={{ color: '#667eea', marginBottom: '15px' }}>
                  Dr. {apt?.doctor?.name || "Doctor Not Available"}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                  <div>
                    <strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Time:</strong> {apt.appointmentTime}
                  </div>
                  <div>
                    <strong>Specialization:</strong> {apt?.doctor?.specialization || 'General'}
                  </div>
                  <div>
                    <strong>Hospital:</strong> {apt?.doctor?.hospital || 'N/A'}
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <strong>Reason:</strong>
                  <p style={{ margin: '5px 0', color: '#666' }}>{apt.reason}</p>
                </div>

                {apt.notes && (
                  <div style={{ marginBottom: '15px', background: '#e3f2fd', padding: '10px', borderRadius: '5px' }}>
                    <strong>Doctor's Notes:</strong>
                    <p style={{ margin: '5px 0' }}>{apt.notes}</p>
                  </div>
                )}

                {apt.rejectionReason && (
                  <div style={{ marginBottom: '15px', background: '#ffebee', padding: '10px', borderRadius: '5px' }}>
                    <strong>Rejection Reason:</strong>
                    <p style={{ margin: '5px 0' }}>{apt.rejectionReason}</p>
                  </div>
                )}

                {apt.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(apt._id)}
                    style={{
                      padding: '8px 16px',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel Appointment
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;