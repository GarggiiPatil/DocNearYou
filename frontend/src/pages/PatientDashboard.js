import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardCards = [
    {
      icon: '🏥',
      title: 'Book Appointment',
      description: 'Find and book doctors with AI-optimized scheduling',
      path: '/patient/book-appointment',
      color: '#667eea'
    },
    {
      icon: '📋',
      title: 'My Appointments',
      description: 'View your appointment status and history',
      path: '/patient/appointments',
      color: '#764ba2'
    },
    {
      icon: '📍',
      title: 'Nearby Doctors',
      description: 'Find doctors near you with smart clustering',
      path: '/patient/nearby-doctors',
      color: '#f093fb'
    },
    {
      icon: '💬',
      title: 'Health Assistant',
      description: 'Chat with AI for health information',
      path: '/patient/chatbot',
      color: '#4facfe'
    },
    {
      icon: '📚',
      title: 'Health Blogs',
      description: 'Read health articles from doctors',
      path: '/patient/health-blogs', // CORRECTED: Changed from /patient/blogs
      color: '#43e97b'
    },
    {
      icon: '👤',
      title: 'Profile',
      description: 'Update your information and settings',
      path: '/patient/profile',
      color: '#fa709a'
    }
  ];

  return (
    <div className="container">
      <div className="dashboard">
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <h1 style={{ marginBottom: '5px' }}>Welcome, {user?.name}! </h1>
            <p style={{ color: '#666', margin: 0 }}>Email: {user?.email}</p>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={handleLogout}
            style={{ height: 'fit-content' }}
          >
            Logout
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
                transition: 'all 0.3s ease',
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
              {/* Background decoration */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                fontSize: '80px',
                opacity: '0.2',
                pointerEvents: 'none'
              }}>
                {card.icon}
              </div>

              {/* Content */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                  {card.icon}
                </div>
                <h3 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  {card.title}
                </h3>
                <p style={{ 
                  margin: 0,
                  fontSize: '14px',
                  opacity: 0.95,
                  lineHeight: '1.4'
                }}>
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Welcome Message */}
        <div style={{ 
          marginTop: '30px', 
          padding: '25px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '15px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
        }}>
          <h3 style={{ marginTop: 0, fontSize: '22px' }}>Welcome to DOCNEARYOU!</h3>
          <p style={{ marginBottom: '15px', opacity: 0.95 }}>
            You have successfully logged into your patient account. Here's what you can do:
          </p>
          <ul style={{ 
            margin: 0,
            paddingLeft: '20px',
            lineHeight: '1.8'
          }}>
            <li>📅 Book appointments </li>
            <li>🗺️ Find doctors near you </li>
            <li>💬 Chat with our <strong>AI health assistant</strong></li>
            <li>📊 Track your appointment status in real-time</li>
            <li>📚 Read health blogs from verified doctors</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;