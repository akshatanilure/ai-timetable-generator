import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiCpu, FiArrowRight } from 'react-icons/fi';
import '../styles/home.css';

const NewLogo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_0_8px_rgba(0,242,254,0.5)]">
    <defs>
      <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00f2fe" />
        <stop offset="50%" stopColor="#7f00ff" />
        <stop offset="100%" stopColor="#ff007f" />
      </linearGradient>
      <linearGradient id="popGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff007f" />
        <stop offset="100%" stopColor="#7f00ff" />
      </linearGradient>
      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Velocity lines on the left */}
    <path d="M10 40 L24 40" stroke="url(#cyberGrad)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    <path d="M6 50 L20 50" stroke="url(#cyberGrad)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
    <path d="M12 60 L22 60" stroke="url(#cyberGrad)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
    <path d="M8 70 L16 70" stroke="url(#cyberGrad)" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    
    {/* Calendar Outer Border */}
    <rect x="30" y="24" width="50" height="44" rx="8" stroke="url(#cyberGrad)" strokeWidth="3.5" fill="#0b0f19" />
    
    {/* Hangers */}
    <rect x="39" y="16" width="6" height="12" rx="3" fill="url(#cyberGrad)" />
    <rect x="65" y="16" width="6" height="12" rx="3" fill="url(#cyberGrad)" />
    
    {/* Calendar Grids */}
    <rect x="38" y="36" width="8" height="6" rx="1.5" fill="#1f2937" />
    <rect x="51" y="36" width="8" height="6" rx="1.5" fill="#1f2937" />
    <rect x="64" y="36" width="8" height="6" rx="1.5" fill="#1f2937" />
    
    <rect x="38" y="46" width="8" height="6" rx="1.5" fill="#1f2937" />
    {/* Highlighted active grid slot */}
    <rect x="51" y="46" width="8" height="6" rx="1.5" fill="url(#popGrad)" filter="url(#neonGlow)" />
    <rect x="64" y="46" width="8" height="6" rx="1.5" fill="#1f2937" />
    
    <rect x="38" y="56" width="8" height="6" rx="1.5" fill="#1f2937" />
    <rect x="51" y="56" width="8" height="6" rx="1.5" fill="#1f2937" />

    {/* Clock Overlapping on bottom right */}
    <circle cx="68" cy="66" r="21" fill="#0b0f19" stroke="url(#cyberGrad)" strokeWidth="3.5" filter="url(#neonGlow)" />
    <circle cx="68" cy="66" r="17" fill="#0b0f19" />
    
    {/* Clock Hands */}
    <path d="M68 66 L78 66" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M68 66 L60 54" stroke="#ff007f" strokeWidth="2" strokeLinecap="round" />
    
    {/* Clock Center Hub */}
    <circle cx="68" cy="66" r="2.5" fill="#ffffff" />
  </svg>
);

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="nav-logo">
          <NewLogo />
          <span>AI</span> Timetable
        </Link>

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-item" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link to="/about" className="nav-item" onClick={() => setIsMenuOpen(false)}>About</Link>
          <Link to="/contact" className="nav-item" onClick={() => setIsMenuOpen(false)}>Contact</Link>

          {/* Login Dropdown */}
          <div className="dropdown">
            <div className="dropdown-toggle">
              Login <FiChevronDown size={14} />
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
              Register <FiChevronDown size={14} />
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
          <div className="hero-tagline-badge">
            <span className="hero-tagline">⚡ Smart Scheduling Powered by Genetic AI</span>
          </div>
          <h1 className="hero-title">
            Optimize Your Campus with <span>Intelligent</span> Timetables
          </h1>
          <p className="hero-description">
            Say goodbye to scheduling conflicts. Our AI-driven engine coordinates complex 
            teacher availabilities, student sections, workload caps, and room spaces in seconds.
          </p>
          <div className="hero-cta">
            <Link to="/register?role=teacher" className="btn btn-primary">
              Get Started Free <FiArrowRight />
            </Link>
          </div>
        </div>

        {/* Calendar + Clock Hero Illustration */}
        <div className="hero-image flex items-center justify-center">
          <svg width="100%" height="auto" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-[380px] filter drop-shadow-[0_0_20px_rgba(0,242,254,0.3)] animate-pulse-slow">
            <defs>
              <linearGradient id="cyberGradHero" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="50%" stopColor="#7f00ff" />
                <stop offset="100%" stopColor="#ff007f" />
              </linearGradient>
              <linearGradient id="popGradHero" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff007f" />
                <stop offset="100%" stopColor="#7f00ff" />
              </linearGradient>
              <filter id="neonGlowHero" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            
            {/* Speed/Velocity stripes on the left */}
            <path d="M25 100 L65 100" stroke="url(#cyberGradHero)" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
            <path d="M15 125 L55 125" stroke="url(#cyberGradHero)" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
            <path d="M30 150 L60 150" stroke="url(#cyberGradHero)" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
            <path d="M20 175 L45 175" stroke="url(#cyberGradHero)" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
            
            {/* Calendar Body */}
            <rect x="80" y="60" width="120" height="105" rx="18" stroke="url(#cyberGradHero)" strokeWidth="8" fill="#090d16" />
            
            {/* Calendar Hangers/Rings */}
            <rect x="102" y="40" width="14" height="28" rx="7" fill="url(#cyberGradHero)" />
            <rect x="164" y="40" width="14" height="28" rx="7" fill="url(#cyberGradHero)" />
            
            {/* Calendar Grid Cells */}
            <rect x="100" y="88" width="18" height="14" rx="4" fill="#1f2937" />
            <rect x="131" y="88" width="18" height="14" rx="4" fill="#1f2937" />
            <rect x="162" y="88" width="18" height="14" rx="4" fill="#1f2937" />
            
            <rect x="100" y="112" width="18" height="14" rx="4" fill="#1f2937" />
            {/* Highlighted active cell */}
            <rect x="131" y="112" width="18" height="14" rx="4" fill="url(#popGradHero)" filter="url(#neonGlowHero)" />
            <rect x="162" y="112" width="18" height="14" rx="4" fill="#1f2937" />
            
            <rect x="100" y="136" width="18" height="14" rx="4" fill="#1f2937" />
            <rect x="131" y="136" width="18" height="14" rx="4" fill="#1f2937" />

            {/* Overlapping Clock */}
            {/* Outer ring */}
            <circle cx="170" cy="165" r="50" fill="#090d16" stroke="url(#cyberGradHero)" strokeWidth="8" filter="url(#neonGlowHero)" />
            {/* Inner face */}
            <circle cx="170" cy="165" r="41" fill="#090d16" />
            
            {/* Clock ticks / indicators */}
            <circle cx="170" cy="132" r="2.5" fill="#4b5563" />
            <circle cx="203" cy="165" r="2.5" fill="#4b5563" />
            <circle cx="170" cy="198" r="2.5" fill="#4b5563" />
            <circle cx="137" cy="165" r="2.5" fill="#4b5563" />
            
            {/* Clock Hands */}
            {/* Hour hand */}
            <path d="M170 165 L192 165" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
            {/* Minute hand */}
            <path d="M170 165 L152 138" stroke="#ff007f" strokeWidth="5.5" strokeLinecap="round" />
            
            {/* Center pin */}
            <circle cx="170" cy="165" r="6" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* FontAwesome Link */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
    </div>
  );
};

export default Home;
