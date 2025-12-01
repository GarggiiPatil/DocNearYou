import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { patientAPI, appointmentAPI } from '../services/api';

const BookAppointment = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    reason: ''
  });
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await patientAPI.getDoctors();
      setDoctors(response.data.data);
    } catch (err) {
      toast.error('Failed to fetch doctors');
    }
  };

  const fetchSuggestedSlots = async (doctorId, date) => {
    try {
      const response = await appointmentAPI.getSuggestedSlots(doctorId, date);
      setSuggestedSlots(response.data.data);
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setSuggestedSlots([]);
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setFormData({ ...formData, appointmentDate: date });
    if (selectedDoctor && date) {
      fetchSuggestedSlots(selectedDoctor._id, date);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }
    setLoading(true);
    try {
      const response = await appointmentAPI.create({
        doctor: selectedDoctor._id,
        ...formData
      });
      toast.success(response.data.message);
      navigate('/patient/appointments');
    } catch (err) {
      if (err.response?.data?.suggestedSlots) {
        toast.warning('Time slot not available. Check suggested times.');
        setSuggestedSlots(err.response.data.suggestedSlots.map(time => ({ time, available: true })));
      } else {
        toast.error(err.response?.data?.message || 'Booking failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="dashboard">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1>Book Appointment!</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/patient/dashboard')}>
            Back
          </button>
        </div>

        {!selectedDoctor ? (
          <div>
            <h2>Select a Doctor</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
              {doctors.map(doctor => (
                <div
                  key={doctor._id}
                  onClick={() => handleDoctorSelect(doctor)}
                  style={{
                    padding: '20px',
                    background: 'white',
                    borderRadius: '10px',
                    border: '2px solid #e1e8ed',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#667eea'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#e1e8ed'}
                >
                  <h3 style={{ color: '#667eea', marginBottom: '10px' }}>{doctor.name}</h3>
                  <p><strong>Specialization:</strong> {doctor.specialization || 'General'}</p>
                  <p><strong>Hospital:</strong> {doctor.hospital || 'Not specified'}</p>
                  {/* <p><strong>Location:</strong> {doctor.location?.address || 'Not specified'}</p> */}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h3>Selected Doctor: {selectedDoctor.name}</h3>
              <p>Specialization: {selectedDoctor.specialization || 'General'}</p>
              <p>Hospital: {selectedDoctor.hospital || 'Not specified'}</p>
              <button
                onClick={() => setSelectedDoctor(null)}
                style={{ marginTop: '10px', padding: '8px 15px', background: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Change Doctor
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Appointment Date *</label>
                <input
                  type="date"
                  value={formData.appointmentDate}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '2px solid #e1e8ed' }}
                />
              </div>

              {suggestedSlots.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                    Suggested Time Slots (AI-Optimized):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                    {suggestedSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, appointmentTime: slot.time })}
                        style={{
                          padding: '10px',
                          background: formData.appointmentTime === slot.time ? '#667eea' : '#f5f5f5',
                          color: formData.appointmentTime === slot.time ? 'white' : '#333',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Or Enter Time Manually *</label>
                <input
                  type="text"
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                  placeholder="e.g., 10:00 AM"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>Reason for Visit *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows="4"
                  placeholder="Describe your symptoms or reason for visit..."
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Booking...' : 'Book Appointment'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;