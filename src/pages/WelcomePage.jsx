import React from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import './WelcomePage.css';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      {/* NAVBAR */}
      <NavBar />

      {/* HERO SECTION */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Expert Auto Body Repair</h1>
          <p className="hero-subtitle">Professional service, precision work, and peace of mind</p>
          <div className="hero-buttons">
            <button className="hero-btn primary-btn" onClick={() => navigate('/track')}>
              Track My Vehicle
            </button>
            <button className="hero-btn secondary-btn" onClick={() => window.location.href = 'tel:+1234567890'}>
              Call Us Now
            </button>
          </div>
          <div className="hero-features">
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Certified Technicians</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Quality Guaranteed</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Insurance Approved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;