import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/home.css';
// import heroImage from '../assets/hero-image.png';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="nav-logo">
          <span style={{ color: '#00d2d3' }}>AI</span> Timetable
        </Link>

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-item" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link to="/about" className="nav-item" onClick={() => setIsMenuOpen(false)}>About</Link>
          <Link to="/contact" className="nav-item" onClick={() => setIsMenuOpen(false)}>Contact</Link>

          {/* Login Dropdown */}
          <div className="dropdown">
            <div className="dropdown-toggle">
              Login <i className="fas fa-chevron-down" style={{ fontSize: '10px', marginLeft: '5px' }}></i>
            </div>
            <div className="dropdown-menu">
              <Link to="/login?role=admin" className="dropdown-item">Admin Login</Link>
              <Link to="/login?role=teacher" className="dropdown-item">Teacher Login</Link>
              <Link to="/login?role=student" className="dropdown-item">Student Login</Link>
            </div>
          </div>

          {/* Register Dropdown */}
          <div className="dropdown">
            <div className="dropdown-toggle">
              Register <i className="fas fa-chevron-down" style={{ fontSize: '10px', marginLeft: '5px' }}></i>
            </div>
            <div className="dropdown-menu">
              <Link to="/register?role=teacher" className="dropdown-item">Teacher Register</Link>
              <Link to="/register?role=student" className="dropdown-item">Student Register</Link>
            </div>
          </div>
        </div>

        <button className="menu-btn" onClick={toggleMenu}>
          <span style={{ transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}></span>
          <span style={{ opacity: isMenuOpen ? 0 : 1 }}></span>
          <span style={{ transform: isMenuOpen ? 'rotate(-45deg) translate(7px, -7px)' : 'none' }}></span>
        </button>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tagline">Smart Scheduling Powered by AI</span>
          <h1 className="hero-title">
            Optimize Your Campus with <span>Intelligent</span> Timetables
          </h1>
          <p className="hero-description">
            Say goodbye to scheduling conflicts. Our AI-driven generator creates optimal,
            conflict-free timetables for teachers and students in seconds.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary">Get Started Free</Link>
            <Link to="/about" className="btn btn-outline">Learn More</Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-placeholder">
            AI Timetable Illustration
          </div>
        </div>
      </section>

      {/* Optional: Add FontAwesome for icons if not present */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </div>
  );
};

export default Home;
