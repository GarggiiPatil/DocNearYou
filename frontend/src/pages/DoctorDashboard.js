import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { doctorAPI } from '../services/api';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await doctorAPI.getStatistics();
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardCards = [
    {
      icon: '📅',
      title: 'Scheduled Appointments',
      description: 'View and manage appointments',
      path: '/doctor/appointments',
      color: '#667eea',
      count: stats?.pendingAppointments || 0,
      label: 'Pending'
    },
    {
      icon: '✍️',
      title: 'Write Blog',
      description: 'Create and manage blogs',
      path: '/doctor/blogs',
      color: '#764ba2',
      count: stats?.totalBlogs || 0,
      label: 'Total Blogs'
    },
    {
      icon: '👤',
      title: 'Profile',
      description: 'Update your information',
      path: '/doctor/profile',
      color: '#f093fb',
      count: null
    },
    // {
    //   icon: '📊',
    //   title: 'Statistics',
    //   description: 'View your metrics',
    //   path: '/doctor/dashboard',
    //   color: '#4facfe',
    //   count: stats?.totalAppointments || 0,
    //   label: 'Total Appointments'
    // }
  ];

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="container">
      <div className="dashboard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1>Welcome, Dr. {user?.name}! 👨‍⚕️</h1>
            <p style={{ color: '#666', margin: 0 }}>Email: {user?.email}</p>
            <p style={{ color: '#666', margin: 0 }}>Doctor ID: {user?.doctorId}</p>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              style={{
                background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`,
                padding: '25px',
                borderRadius: '15px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>{card.icon}</div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>{card.title}</h3>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.95 }}>{card.description}</p>
              {card.count !== null && (
                <div style={{ marginTop: '15px', fontSize: '24px', fontWeight: 'bold' }}>
                  {card.count} <span style={{ fontSize: '14px', opacity: 0.9 }}>{card.label}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {stats && (
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <h2>Quick Statistics</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
              marginTop: '20px'
            }}>
              <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '2px solid #ffc107' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>{stats.pendingAppointments}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Pending</div>
              </div>
              <div style={{ background: '#d4edda', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '2px solid #4caf50' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>{stats.approvedAppointments}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Approved</div>
              </div>
              <div style={{ background: '#d1ecf1', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '2px solid #2196f3' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196f3' }}>{stats.completedAppointments}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Completed</div>
              </div>
              <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '2px solid #f44336' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>{stats.rejectedAppointments}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Rejected</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;