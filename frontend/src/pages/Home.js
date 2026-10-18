import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronDown,
  FiArrowRight,
  FiCheckCircle,
  FiCpu,
  FiUsers,
  FiCalendar,
  FiLayers,
  FiSliders,
  FiDownload,
  FiShield,
  FiMenu,
  FiX,
  FiCheck,
  FiClock,
  FiBookOpen,
  FiLogIn,
  FiUserPlus
} from 'react-icons/fi';
import '../styles/home.css';

// Brand SVG Logo
const BrandLogo = () => (
  <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="50%" stopColor="#4f46e5" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    
    {/* Velocity/Speed accent lines */}
    <path d="M8 42 L22 42" stroke="url(#brandGrad)" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
    <path d="M4 52 L18 52" stroke="url(#brandGrad)" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
    <path d="M10 62 L20 62" stroke="url(#brandGrad)" strokeWidth="3.5" strokeLinecap="round" opacity="0.4" />
    
    {/* Calendar Outer Rounded Rect */}
    <rect x="28" y="24" width="52" height="46" rx="10" stroke="url(#brandGrad)" strokeWidth="4" fill="#ffffff" />
    
    {/* Hangers */}
    <rect x="38" y="16" width="6" height="12" rx="3" fill="url(#brandGrad)" />
    <rect x="66" y="16" width="6" height="12" rx="3" fill="url(#brandGrad)" />
    
    {/* Calendar Cells */}
    <rect x="36" y="36" width="8" height="6" rx="2" fill="#e2e8f0" />
    <rect x="49" y="36" width="8" height="6" rx="2" fill="#e2e8f0" />
    <rect x="62" y="36" width="8" height="6" rx="2" fill="#e2e8f0" />
    
    <rect x="36" y="46" width="8" height="6" rx="2" fill="#e2e8f0" />
    <rect x="49" y="46" width="8" height="6" rx="2" fill="url(#accentGrad)" />
    <rect x="62" y="46" width="8" height="6" rx="2" fill="#e2e8f0" />
    
    <rect x="36" y="56" width="8" height="6" rx="2" fill="#e2e8f0" />
    <rect x="49" y="56" width="8" height="6" rx="2" fill="#e2e8f0" />
    
    {/* Clock Hub Overlay */}
    <circle cx="68" cy="66" r="19" fill="#ffffff" stroke="url(#brandGrad)" strokeWidth="3.5" />
    <path d="M68 66 L76 66" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M68 66 L62 56" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="68" cy="66" r="2.5" fill="#4f46e5" />
  </svg>
);

// Sample Timetable Datasets for Hero Illustration & Examples
const timetablePresets = {
  cse: {
    name: 'B.Tech Computer Science & Engg (Sem IV)',
    dept: 'Computer Science',
    semester: 'Semester 4 • Room 302',
    slots: [
      {
        time: '9:00 AM',
        mon: { code: 'CS401', name: 'Design & Analysis of Algorithms', teacher: 'Dr. Sharma', room: 'Hall 302', color: 'blue' },
        tue: { code: 'CS402', name: 'Operating Systems', teacher: 'Prof. Ananya', room: 'Hall 302', color: 'purple' },
        wed: { code: 'CS403', name: 'Database Management Systems', teacher: 'Dr. Verma', room: 'Hall 302', color: 'emerald' },
        thu: { code: 'CS401', name: 'Design & Analysis of Algorithms', teacher: 'Dr. Sharma', room: 'Hall 302', color: 'blue' },
        fri: { code: 'CS404', name: 'Theory of Computation', teacher: 'Prof. Kulkarni', room: 'Hall 302', color: 'amber' },
      },
      {
        time: '10:00 AM',
        mon: { code: 'CS402', name: 'Operating Systems', teacher: 'Prof. Ananya', room: 'Hall 302', color: 'purple' },
        tue: { code: 'CS403', name: 'Database Management Systems', teacher: 'Dr. Verma', room: 'Hall 302', color: 'emerald' },
        wed: { code: 'CS401', name: 'Design & Analysis of Algorithms', teacher: 'Dr. Sharma', room: 'Hall 302', color: 'blue' },
        thu: { code: 'MA401', name: 'Discrete Mathematics', teacher: 'Dr. Raman', room: 'Hall 302', color: 'rose' },
        fri: { code: 'CS402', name: 'Operating Systems', teacher: 'Prof. Ananya', room: 'Hall 302', color: 'purple' },
      },
      {
        time: '11:00 AM',
        mon: { code: 'CS403', name: 'Database Management Systems', teacher: 'Dr. Verma', room: 'Hall 302', color: 'emerald' },
        tue: { code: 'CS404', name: 'Theory of Computation', teacher: 'Prof. Kulkarni', room: 'Hall 302', color: 'amber' },
        wed: { code: 'CS404', name: 'Theory of Computation', teacher: 'Prof. Kulkarni', room: 'Hall 302', color: 'amber' },
        thu: { code: 'CS403', name: 'Database Management Systems', teacher: 'Dr. Verma', room: 'Hall 302', color: 'emerald' },
        fri: { code: 'MA401', name: 'Discrete Mathematics', teacher: 'Dr. Raman', room: 'Hall 302', color: 'rose' },
      },
      {
        time: '12:00 PM',
        mon: { break: true, name: 'Lunch Break' },
        tue: { break: true, name: 'Lunch Break' },
        wed: { break: true, name: 'Lunch Break' },
        thu: { break: true, name: 'Lunch Break' },
        fri: { break: true, name: 'Lunch Break' },
      },
      {
        time: '1:00 PM',
        mon: { code: 'CS491', name: 'OS & System Programming Lab (Batch A)', teacher: 'Prof. Ananya', room: 'Lab 2A', color: 'purple' },
        tue: { code: 'CS492', name: 'DBMS & SQL Hands-on Lab (Batch B)', teacher: 'Dr. Verma', room: 'Lab 3B', color: 'emerald' },
        wed: { code: 'CS405', name: 'Computer Architecture', teacher: 'Dr. Gupta', room: 'Hall 302', color: 'blue' },
        thu: { code: 'CS493', name: 'Algorithms Practice Lab (Batch A)', teacher: 'Dr. Sharma', room: 'Lab 1', color: 'blue' },
        fri: { code: 'CS405', name: 'Computer Architecture', teacher: 'Dr. Gupta', room: 'Hall 302', color: 'blue' },
      },
      {
        time: '2:30 PM',
        mon: { code: 'CS491', name: 'OS & System Programming Lab (Contd.)', teacher: 'Prof. Ananya', room: 'Lab 2A', color: 'purple' },
        tue: { code: 'CS492', name: 'DBMS Lab (Contd.)', teacher: 'Dr. Verma', room: 'Lab 3B', color: 'emerald' },
        wed: { code: 'HS401', name: 'Professional Ethics & Seminar', teacher: 'Dr. Mehta', room: 'Auditorium', color: 'amber' },
        thu: { code: 'CS493', name: 'Algorithms Practice Lab (Contd.)', teacher: 'Dr. Sharma', room: 'Lab 1', color: 'blue' },
        fri: { code: 'OE401', name: 'Open Elective / Technical Club', teacher: 'Faculty Panel', room: 'Hall 201', color: 'rose' },
      }
    ]
  },
  ece: {
    name: 'B.Tech Electronics & Comm (Sem VI)',
    dept: 'Electronics & Comm',
    semester: 'Semester 6 • Room 104',
    slots: [
      {
        time: '9:00 AM',
        mon: { code: 'EC601', name: 'Digital Signal Processing', teacher: 'Dr. Iyer', room: 'Hall 104', color: 'blue' },
        tue: { code: 'EC602', name: 'VLSI Design & Architecture', teacher: 'Dr. Sen', room: 'Hall 104', color: 'purple' },
        wed: { code: 'EC603', name: 'Wireless & Mobile Comm', teacher: 'Prof. Nair', room: 'Hall 104', color: 'emerald' },
        thu: { code: 'EC601', name: 'Digital Signal Processing', teacher: 'Dr. Iyer', room: 'Hall 104', color: 'blue' },
        fri: { code: 'EC604', name: 'Microwave Engineering', teacher: 'Dr. Paul', room: 'Hall 104', color: 'amber' },
      },
      {
        time: '10:00 AM',
        mon: { code: 'EC602', name: 'VLSI Design & Architecture', teacher: 'Dr. Sen', room: 'Hall 104', color: 'purple' },
        tue: { code: 'EC603', name: 'Wireless & Mobile Comm', teacher: 'Prof. Nair', room: 'Hall 104', color: 'emerald' },
        wed: { code: 'EC601', name: 'Digital Signal Processing', teacher: 'Dr. Iyer', room: 'Hall 104', color: 'blue' },
        thu: { code: 'EC604', name: 'Microwave Engineering', teacher: 'Dr. Paul', room: 'Hall 104', color: 'amber' },
        fri: { code: 'EC602', name: 'VLSI Design & Architecture', teacher: 'Dr. Sen', room: 'Hall 104', color: 'purple' },
      },
      {
        time: '11:00 AM',
        mon: { code: 'EC603', name: 'Wireless & Mobile Comm', teacher: 'Prof. Nair', room: 'Hall 104', color: 'emerald' },
        tue: { code: 'EC604', name: 'Microwave Engineering', teacher: 'Dr. Paul', room: 'Hall 104', color: 'amber' },
        wed: { code: 'EC602', name: 'VLSI Design & Architecture', teacher: 'Dr. Sen', room: 'Hall 104', color: 'purple' },
        thu: { code: 'EC603', name: 'Wireless & Mobile Comm', teacher: 'Prof. Nair', room: 'Hall 104', color: 'emerald' },
        fri: { code: 'EC601', name: 'Digital Signal Processing', teacher: 'Dr. Iyer', room: 'Hall 104', color: 'blue' },
      },
      {
        time: '12:00 PM',
        mon: { break: true, name: 'Lunch Break' },
        tue: { break: true, name: 'Lunch Break' },
        wed: { break: true, name: 'Lunch Break' },
        thu: { break: true, name: 'Lunch Break' },
        fri: { break: true, name: 'Lunch Break' },
      },
      {
        time: '1:00 PM',
        mon: { code: 'EC691', name: 'DSP Simulation Lab (Batch A)', teacher: 'Dr. Iyer', room: 'DSP Lab', color: 'blue' },
        tue: { code: 'EC692', name: 'VLSI CAD Tools Lab (Batch B)', teacher: 'Dr. Sen', room: 'VLSI Lab', color: 'purple' },
        wed: { code: 'EC605', name: 'Optical Communication', teacher: 'Dr. Das', room: 'Hall 104', color: 'rose' },
        thu: { code: 'EC691', name: 'DSP Simulation Lab (Batch B)', teacher: 'Dr. Iyer', room: 'DSP Lab', color: 'blue' },
        fri: { code: 'EC692', name: 'VLSI CAD Lab (Batch A)', teacher: 'Dr. Sen', room: 'VLSI Lab', color: 'purple' },
      },
      {
        time: '2:30 PM',
        mon: { code: 'EC691', name: 'DSP Lab (Contd.)', teacher: 'Dr. Iyer', room: 'DSP Lab', color: 'blue' },
        tue: { code: 'EC692', name: 'VLSI Lab (Contd.)', teacher: 'Dr. Sen', room: 'VLSI Lab', color: 'purple' },
        wed: { code: 'EC605', name: 'Optical Communication', teacher: 'Dr. Das', room: 'Hall 104', color: 'rose' },
        thu: { code: 'EC691', name: 'DSP Lab (Contd.)', teacher: 'Dr. Iyer', room: 'DSP Lab', color: 'blue' },
        fri: { code: 'PR601', name: 'Minor Project Review', teacher: 'Committee', room: 'Conf Room', color: 'amber' },
      }
    ]
  },
  faculty: {
    name: 'Faculty Schedule: Dr. Sharma (Prof & Head - CSE)',
    dept: 'Faculty Agenda',
    semester: 'Teaching Workload: 16 hrs/week • 0 Clashes',
    slots: [
      {
        time: '9:00 AM',
        mon: { code: 'CS401', name: 'Algorithms (B.Tech Sem 4)', teacher: 'Lecture', room: 'Hall 302', color: 'blue' },
        tue: { code: 'OFF', name: 'Research & Office Hours', teacher: 'Faculty Cabin', room: 'Cabin 412', color: 'break' },
        wed: { code: 'MT101', name: 'Advanced Algorithms (M.Tech)', teacher: 'PG Lecture', room: 'PG Hall 1', color: 'purple' },
        thu: { code: 'CS401', name: 'Algorithms (B.Tech Sem 4)', teacher: 'Lecture', room: 'Hall 302', color: 'blue' },
        fri: { code: 'DEPT', name: 'Department Academic Council', teacher: 'HOD Meeting', room: 'Board Room', color: 'emerald' },
      },
      {
        time: '10:00 AM',
        mon: { code: 'OFF', name: 'Ph.D Scholar Guidance', teacher: 'Research Lab', room: 'AI Lab', color: 'break' },
        tue: { code: 'MT101', name: 'Advanced Algorithms (M.Tech)', teacher: 'PG Lecture', room: 'PG Hall 1', color: 'purple' },
        wed: { code: 'CS401', name: 'Algorithms (B.Tech Sem 4)', teacher: 'Lecture', room: 'Hall 302', color: 'blue' },
        thu: { code: 'OFF', name: 'Paper Evaluation / Office', teacher: 'Faculty Cabin', room: 'Cabin 412', color: 'break' },
        fri: { code: 'OFF', name: 'Office Hours', teacher: 'Student Consult', room: 'Cabin 412', color: 'break' },
      },
      {
        time: '11:00 AM',
        mon: { code: 'CS602', name: 'AI & Machine Learning (Sem 6)', teacher: 'Lecture', room: 'Hall 401', color: 'emerald' },
        tue: { code: 'CS602', name: 'AI & Machine Learning (Sem 6)', teacher: 'Lecture', room: 'Hall 401', color: 'emerald' },
        wed: { code: 'OFF', name: 'Grant Project Review', teacher: 'R&D Cell', room: 'Cabin 412', color: 'break' },
        thu: { code: 'CS602', name: 'AI & Machine Learning (Sem 6)', teacher: 'Lecture', room: 'Hall 401', color: 'emerald' },
        fri: { code: 'CS602', name: 'AI & Machine Learning (Sem 6)', teacher: 'Lecture', room: 'Hall 401', color: 'emerald' },
      },
      {
        time: '12:00 PM',
        mon: { break: true, name: 'Faculty Lunch Break' },
        tue: { break: true, name: 'Faculty Lunch Break' },
        wed: { break: true, name: 'Faculty Lunch Break' },
        thu: { break: true, name: 'Faculty Lunch Break' },
        fri: { break: true, name: 'Faculty Lunch Break' },
      },
      {
        time: '1:00 PM',
        mon: { code: 'OFF', name: 'Administrative Office Hours', teacher: 'Department Work', room: 'HOD Office', color: 'break' },
        tue: { code: 'OFF', name: 'Curriculum Revision Meet', teacher: 'Dean Academics', room: 'Dean Office', color: 'break' },
        wed: { code: 'CS493', name: 'Algorithms Lab (Batch A)', teacher: 'Lab Practical', room: 'Lab 1', color: 'blue' },
        thu: { code: 'CS493', name: 'Algorithms Lab (Batch B)', teacher: 'Lab Practical', room: 'Lab 1', color: 'blue' },
        fri: { code: 'SEMINAR', name: 'Guest Lecture & Industry Keynote', teacher: 'Host', room: 'Auditorium', color: 'amber' },
      },
      {
        time: '2:30 PM',
        mon: { code: 'OFF', name: 'Research Office Hours', teacher: 'Cabin', room: 'Cabin 412', color: 'break' },
        tue: { code: 'OFF', name: 'Weekly Staff Sync', teacher: 'HOD Office', room: 'CSE Lounge', color: 'break' },
        wed: { code: 'CS493', name: 'Algorithms Lab (Contd.)', teacher: 'Lab Practical', room: 'Lab 1', color: 'blue' },
        thu: { code: 'CS493', name: 'Algorithms Lab (Contd.)', teacher: 'Lab Practical', room: 'Lab 1', color: 'blue' },
        fri: { code: 'OFF', name: 'Weekly Wrap & Planning', teacher: 'HOD Office', room: 'Cabin 412', color: 'break' },
      }
    ]
  }
};

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHeroTab, setActiveHeroTab] = useState('cse');
  const [activeExampleTab, setActiveExampleTab] = useState('cse');
  const [billingPeriod, setBillingPeriod] = useState('annual');
  const [expandedFaq, setExpandedFaq] = useState(0);

  // Scroll detection for navbar blur / shadow
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? -1 : index);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const currentHeroData = timetablePresets[activeHeroTab];
  const currentExampleData = timetablePresets[activeExampleTab];

  return (
    <div className="sb-landing-root">
      {/* Ambient background curves & grid */}
      <div className="sb-canvas-backdrop" aria-hidden="true">
        <div className="sb-curve-cyan"></div>
        <div className="sb-curve-violet"></div>
        <div className="sb-canvas-grid"></div>
      </div>

      {/* ==========================================================================
          Navbar
          ========================================================================== */}
      <header className={`sb-navbar ${scrolled ? 'sb-navbar-scrolled' : ''}`}>
        <div className="sb-container sb-nav-inner">
          {/* Brand Logo */}
          <Link to="/" className="sb-brand" onClick={closeMenu}>
            <div className="sb-brand-logo">
              <BrandLogo />
            </div>
            <div className="sb-brand-text">
              <span className="sb-brand-gradient">AI</span>
              <span>Timetable</span>
            </div>
          </Link>

          {/* Nav Links (smooth scroll to anchors) */}
          <nav className="sb-nav-links">
            <a href="#features" className="sb-nav-link">Features</a>
            <a href="#examples" className="sb-nav-link">Examples</a>
            <a href="#how-it-works" className="sb-nav-link">How it works</a>
            <a href="#pricing" className="sb-nav-link">Pricing</a>
            <a href="#faq" className="sb-nav-link">FAQ</a>
          </nav>

          {/* Authentication Actions (Replaces "Build your schedule") */}
          <div className="sb-nav-actions">
            {/* Login Dropdown */}
            <div className="sb-dropdown-wrap">
              <Link to="/login" className="sb-btn sb-btn-outline">
                <FiLogIn size={15} />
                <span>Login</span>
                <FiChevronDown size={14} />
              </Link>
              <div className="sb-dropdown-menu">
                <div className="sb-dropdown-header">Select Portal</div>
                <Link to="/login?role=admin" className="sb-dropdown-item">
                  <FiShield /> Administrator Login
                </Link>
                <Link to="/login?role=teacher" className="sb-dropdown-item">
                  <FiUsers /> Teacher Login
                </Link>
                <Link to="/login?role=student" className="sb-dropdown-item">
                  <FiBookOpen /> Student Login
                </Link>
              </div>
            </div>

            {/* Register Dropdown */}
            <div className="sb-dropdown-wrap">
              <Link to="/register" className="sb-btn sb-btn-primary">
                <FiUserPlus size={15} />
                <span>Register</span>
                <FiChevronDown size={14} />
              </Link>
              <div className="sb-dropdown-menu">
                <div className="sb-dropdown-header">New Registration</div>
                <Link to="/register?role=teacher" className="sb-dropdown-item">
                  <FiUsers /> Teacher Registration
                </Link>
                <Link to="/register?role=student" className="sb-dropdown-item">
                  <FiBookOpen /> Student Registration
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="sb-mobile-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <div className={`sb-mobile-drawer ${isMenuOpen ? 'open' : ''}`}>
          <a href="#features" className="sb-mobile-nav-link" onClick={closeMenu}>Features</a>
          <a href="#examples" className="sb-mobile-nav-link" onClick={closeMenu}>Examples</a>
          <a href="#how-it-works" className="sb-mobile-nav-link" onClick={closeMenu}>How it works</a>
          <a href="#pricing" className="sb-mobile-nav-link" onClick={closeMenu}>Pricing</a>
          <a href="#faq" className="sb-mobile-nav-link" onClick={closeMenu}>FAQ</a>

          <div className="sb-mobile-auth-group">
            <div className="sb-dropdown-header">Sign in to your account</div>
            <Link to="/login?role=admin" className="sb-btn sb-btn-outline" onClick={closeMenu}>
              <FiShield /> Admin Login
            </Link>
            <Link to="/login?role=teacher" className="sb-btn sb-btn-outline" onClick={closeMenu}>
              <FiUsers /> Teacher Login
            </Link>
            <Link to="/login?role=student" className="sb-btn sb-btn-outline" onClick={closeMenu}>
              <FiBookOpen /> Student Login
            </Link>
            <Link to="/register" className="sb-btn sb-btn-primary" onClick={closeMenu} style={{ marginTop: '6px' }}>
              <FiUserPlus /> Register New Account
            </Link>
          </div>
        </div>
      </header>

      {/* ==========================================================================
          Hero Section
          ========================================================================== */}
      <section className="sb-hero">
        <div className="sb-container">
          {/* Tagline Pill */}
          <div className="sb-hero-pill">
            <span className="sb-hero-pill-badge">AI Engine 2.0</span>
            <span>⚡ Automated Conflict-Free Academic Scheduling</span>
          </div>

          {/* Bold Heading with Gradient Accents */}
          <h1 className="sb-hero-title">
            Build your campus <span>weekly schedule</span> in minutes with AI
          </h1>

          {/* Subtitle Description */}
          <p className="sb-hero-description">
            Say goodbye to timetable chaos. Our genetic algorithm balances teacher workloads,
            student batches, laboratory allocations, and room capacities in seconds with zero manual clashes.
          </p>

          {/* Proof Points Row (Modeled after schedulebuilder reference) */}
          <div className="sb-hero-proof">
            <div className="sb-proof-item">
              <FiCheckCircle className="sb-proof-icon" />
              <span><strong>100% Conflict-Free</strong> guarantee</span>
            </div>
            <div className="sb-proof-item">
              <FiUsers className="sb-proof-icon" />
              <span><strong>Role-Based Portals</strong> for Admin, Faculty & Students</span>
            </div>
            <div className="sb-proof-item">
              <FiLayers className="sb-proof-icon" />
              <span><strong>UG & PG Ready</strong> with Lab batch splits</span>
            </div>
          </div>

          {/* Hero CTAs */}
          <div className="sb-hero-ctas">
            <Link to="/register?role=teacher" className="sb-btn sb-btn-primary sb-btn-lg sb-hero-cta-btn">
              <span>Get Started Free</span>
              <FiArrowRight />
            </Link>
            <Link to="/login" className="sb-btn sb-btn-outline sb-btn-lg sb-hero-cta-btn">
              <FiLogIn />
              <span>Portal Login</span>
            </Link>
            <a href="#examples" className="sb-btn sb-btn-ghost sb-hero-cta-btn">
              <span>Browse Examples</span>
              <FiChevronDown />
            </a>
          </div>

          {/* ==========================================================================
              Timetable Illustration / Interactive Stage Preview
              ========================================================================== */}
          <div className="sb-stage-wrap">
            <div className="sb-stage-surface">
              {/* Window Header */}
              <div className="sb-stage-header">
                <div className="sb-stage-window-controls">
                  <div className="sb-stage-dot red"></div>
                  <div className="sb-stage-dot yellow"></div>
                  <div className="sb-stage-dot green"></div>
                </div>

                <div className="sb-stage-title-wrap">
                  <span className="sb-stage-title">{currentHeroData.name}</span>
                  <div className="sb-stage-status-badge">
                    <FiCheck size={12} />
                    <span>Genetic AI Solved (0 Conflicts)</span>
                  </div>
                </div>

                <div className="sb-stage-actions">
                  <span className="sb-stage-tag">{currentHeroData.semester}</span>
                </div>
              </div>

              {/* Department switcher tabs */}
              <div className="sb-stage-tabs">
                <button
                  className={`sb-stage-tab-btn ${activeHeroTab === 'cse' ? 'active' : ''}`}
                  onClick={() => setActiveHeroTab('cse')}
                >
                  💻 B.Tech CSE (Sem 4)
                </button>
                <button
                  className={`sb-stage-tab-btn ${activeHeroTab === 'ece' ? 'active' : ''}`}
                  onClick={() => setActiveHeroTab('ece')}
                >
                  ⚡ B.Tech ECE (Sem 6)
                </button>
                <button
                  className={`sb-stage-tab-btn ${activeHeroTab === 'faculty' ? 'active' : ''}`}
                  onClick={() => setActiveHeroTab('faculty')}
                >
                  👨‍🏫 Faculty Agenda (Dr. Sharma)
                </button>
              </div>

              {/* Realistic Timetable Grid View */}
              <div className="sb-timetable-grid">
                {/* Header Row */}
                <div className="sb-tt-head-cell">Time</div>
                <div className="sb-tt-head-cell">Mon</div>
                <div className="sb-tt-head-cell">Tue</div>
                <div className="sb-tt-head-cell">Wed</div>
                <div className="sb-tt-head-cell">Thu</div>
                <div className="sb-tt-head-cell">Fri</div>

                {/* Grid Rows */}
                {currentHeroData.slots.map((row, rIdx) => (
                  <React.Fragment key={rIdx}>
                    <div className="sb-tt-time-col">{row.time}</div>

                    {['mon', 'tue', 'wed', 'thu', 'fri'].map((day) => {
                      const item = row[day];
                      if (!item) return <div key={day} className="sb-tt-slot"></div>;
                      if (item.break) {
                        return (
                          <div key={day} className="sb-tt-slot">
                            <div className="sb-tt-card break">
                              <span style={{ fontSize: '0.725rem', fontWeight: 600 }}>☕ {item.name}</span>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={day} className="sb-tt-slot">
                          <div className={`sb-tt-card ${item.color}`}>
                            <div>
                              <div className="sb-tt-subject">{item.code}: {item.name}</div>
                              <div className="sb-tt-meta">
                                <span>{item.teacher}</span>
                              </div>
                            </div>
                            <div className="sb-tt-room">{item.room}</div>
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          Features Section (id="features")
          ========================================================================== */}
      <section id="features" className="sb-section sb-section-light sb-section-target">
        <div className="sb-container">
          <div className="sb-section-header">
            <span className="sb-eyebrow">AI-Powered Features</span>
            <h2 className="sb-section-title">Engineered to solve the hardest campus scheduling challenges</h2>
            <p className="sb-section-desc">
              From faculty workload constraints to lab batches and room capacities, our system turns
              weeks of manual scheduling into an automated, error-free process.
            </p>
          </div>

          <div className="sb-features-grid">
            {/* Feature 1 */}
            <div className="sb-feature-card">
              <div className="sb-feature-icon-wrap">
                <FiCpu />
              </div>
              <h3 className="sb-feature-title">Genetic Algorithm Engine</h3>
              <p className="sb-feature-desc">
                Simulates thousands of schedule combinations in seconds, evaluating hard and soft constraints
                to deliver mathematically optimized, 100% clash-free schedules.
              </p>
              <span className="sb-feature-badge">AI Core</span>
            </div>

            {/* Feature 2 */}
            <div className="sb-feature-card">
              <div className="sb-feature-icon-wrap">
                <FiUsers />
              </div>
              <h3 className="sb-feature-title">Role-Based Access Control</h3>
              <p className="sb-feature-desc">
                Dedicated interfaces for Administrators, Teachers, and Students. Admins manage college data,
                teachers review workloads, and students view clean weekly timetables.
              </p>
              <span className="sb-feature-badge">Admin • Teacher • Student</span>
            </div>

            {/* Feature 3 */}
            <div className="sb-feature-card">
              <div className="sb-feature-icon-wrap">
                <FiLayers />
              </div>
              <h3 className="sb-feature-title">UG & PG Multi-Program Support</h3>
              <p className="sb-feature-desc">
                Seamlessly organize undergraduate and postgraduate departments, multiple semester sections,
                combined elective lectures, and concurrent departmental batches.
              </p>
              <span className="sb-feature-badge">Higher Education Ready</span>
            </div>

            {/* Feature 4 */}
            <div className="sb-feature-card">
              <div className="sb-feature-icon-wrap">
                <FiClock />
              </div>
              <h3 className="sb-feature-title">Multi-Hour Lab Sessions</h3>
              <p className="sb-feature-desc">
                Allocate 2-hour or 3-hour continuous lab blocks with specialized lab rooms, assistant faculty,
                and parallel batch split scheduling without breaking theory hours.
              </p>
              <span className="sb-feature-badge">Lab Batches</span>
            </div>

            {/* Feature 5 */}
            <div className="sb-feature-card">
              <div className="sb-feature-icon-wrap">
                <FiSliders />
              </div>
              <h3 className="sb-feature-title">Workload & Fatigue Balancing</h3>
              <p className="sb-feature-desc">
                Enforces maximum daily lecture limits, caps continuous teaching hours, and respects faculty
                leave days to ensure balanced workloads across your entire department.
              </p>
              <span className="sb-feature-badge">Faculty Friendly</span>
            </div>

            {/* Feature 6 */}
            <div className="sb-feature-card">
              <div className="sb-feature-icon-wrap">
                <FiDownload />
              </div>
              <h3 className="sb-feature-title">One-Click PDF Export & Print</h3>
              <p className="sb-feature-desc">
                Generate high-resolution A4 landscape PDF documents, department-wide master grids,
                or individual faculty schedules formatted for printing and noticeboards.
              </p>
              <span className="sb-feature-badge">Instant Distribution</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          Examples Section (id="examples")
          ========================================================================== */}
      <section id="examples" className="sb-section sb-section-target">
        <div className="sb-container">
          <div className="sb-section-header">
            <span className="sb-eyebrow">Real Timetable Examples</span>
            <h2 className="sb-section-title">From college departments to faculty agendas</h2>
            <p className="sb-section-desc">
              Explore how our AI arranges diverse semester programs, lab rotations, and faculty schedules
              into clear, organized weekly views.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="sb-examples-nav">
            <button
              className={`sb-example-btn ${activeExampleTab === 'cse' ? 'active' : ''}`}
              onClick={() => setActiveExampleTab('cse')}
            >
              💻 B.Tech Computer Science (Sem 4)
            </button>
            <button
              className={`sb-example-btn ${activeExampleTab === 'ece' ? 'active' : ''}`}
              onClick={() => setActiveExampleTab('ece')}
            >
              ⚡ B.Tech Electronics & Comm (Sem 6)
            </button>
            <button
              className={`sb-example-btn ${activeExampleTab === 'faculty' ? 'active' : ''}`}
              onClick={() => setActiveExampleTab('faculty')}
            >
              👨‍🏫 Faculty Workload (Dr. Sharma)
            </button>
          </div>

          {/* Interactive Timetable Display */}
          <div className="sb-example-display">
            <div className="sb-example-info-bar">
              <div className="sb-example-name">
                <FiCalendar className="text-indigo-600" />
                <span>{currentExampleData.name}</span>
              </div>
              <div className="sb-example-specs">
                <div className="sb-example-spec-item">
                  <FiCheckCircle className="text-emerald-600" />
                  <span>0 Conflicts</span>
                </div>
                <div className="sb-example-spec-item">
                  <FiClock />
                  <span>Mon – Fri (9 AM – 4 PM)</span>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="sb-timetable-grid">
              <div className="sb-tt-head-cell">Time</div>
              <div className="sb-tt-head-cell">Monday</div>
              <div className="sb-tt-head-cell">Tuesday</div>
              <div className="sb-tt-head-cell">Wednesday</div>
              <div className="sb-tt-head-cell">Thursday</div>
              <div className="sb-tt-head-cell">Friday</div>

              {currentExampleData.slots.map((row, rIdx) => (
                <React.Fragment key={rIdx}>
                  <div className="sb-tt-time-col">{row.time}</div>
                  {['mon', 'tue', 'wed', 'thu', 'fri'].map((day) => {
                    const item = row[day];
                    if (!item) return <div key={day} className="sb-tt-slot"></div>;
                    if (item.break) {
                      return (
                        <div key={day} className="sb-tt-slot">
                          <div className="sb-tt-card break">
                            <span style={{ fontSize: '0.725rem', fontWeight: 600 }}>☕ {item.name}</span>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={day} className="sb-tt-slot">
                        <div className={`sb-tt-card ${item.color}`}>
                          <div>
                            <div className="sb-tt-subject">{item.code}: {item.name}</div>
                            <div className="sb-tt-meta">{item.teacher}</div>
                          </div>
                          <div className="sb-tt-room">{item.room}</div>
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          How It Works Section (id="how-it-works")
          ========================================================================== */}
      <section id="how-it-works" className="sb-section sb-section-light sb-section-target">
        <div className="sb-container">
          <div className="sb-section-header">
            <span className="sb-eyebrow">Simple 3-Step Process</span>
            <h2 className="sb-section-title">Create your campus timetable in three steps</h2>
            <p className="sb-section-desc">
              Generate optimal timetables without spreadsheets, endless email threads, or scheduling conflicts.
            </p>
          </div>

          <div className="sb-steps-grid">
            {/* Step 1 */}
            <div className="sb-step-card">
              <div className="sb-step-number">01</div>
              <h3 className="sb-step-title">Add Faculty, Subjects & Rooms</h3>
              <p className="sb-step-desc">
                Input your department teachers, teaching subjects, laboratory requirements,
                and lecture hall capacities into our simple setup wizard.
              </p>
              <div className="sb-step-visual">
                <div className="sb-step-visual-item">
                  <span>👨‍🏫 Faculty Members</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Configured</span>
                </div>
                <div className="sb-step-visual-item">
                  <span>📚 Course Subjects & Labs</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Loaded</span>
                </div>
                <div className="sb-step-visual-item">
                  <span>🏛️ Infrastructure / Halls</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Ready</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="sb-step-card">
              <div className="sb-step-number">02</div>
              <h3 className="sb-step-title">Set Constraints & Workload Rules</h3>
              <p className="sb-step-desc">
                Define maximum consecutive hours, teacher availability, preferred break windows,
                and lab block durations. The AI adheres to every hard constraint.
              </p>
              <div className="sb-step-visual">
                <div className="sb-step-visual-item">
                  <span>⏱️ Max Consecutive Classes</span>
                  <span style={{ color: '#4f46e5', fontWeight: 700 }}>≤ 2 hours</span>
                </div>
                <div className="sb-step-visual-item">
                  <span>🔬 Lab Block Duration</span>
                  <span style={{ color: '#4f46e5', fontWeight: 700 }}>2-3 hours</span>
                </div>
                <div className="sb-step-visual-item">
                  <span>🛑 Teacher Clashes</span>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>0 Allowed</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="sb-step-card">
              <div className="sb-step-number">03</div>
              <h3 className="sb-step-title">Run AI Generation & Export</h3>
              <p className="sb-step-desc">
                Click generate and let the genetic algorithm iterate through schedule permutations.
                Preview instantly, fine-tune if desired, and export to PDF.
              </p>
              <div className="sb-step-visual">
                <div className="sb-step-visual-item">
                  <span>🧬 Genetic Iterations</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>1,200 Solved</span>
                </div>
                <div className="sb-step-visual-item">
                  <span>✨ Fitness Score</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>99.8% Optimal</span>
                </div>
                <div className="sb-step-visual-item">
                  <span>📄 Print-Ready PDF</span>
                  <span style={{ color: '#4f46e5', fontWeight: 700 }}>Instant Export</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          Pricing Section (id="pricing")
          ========================================================================== */}
      <section id="pricing" className="sb-section sb-section-target">
        <div className="sb-container">
          <div className="sb-section-header">
            <span className="sb-eyebrow">Pricing Plans</span>
            <h2 className="sb-section-title">Start free. Upgrade as your campus grows.</h2>
            <p className="sb-section-desc">
              Transparent pricing with no hidden fees. Suitable for individual college departments
              or entire multi-disciplinary universities.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="sb-pricing-toggle-wrap">
            <span style={{ color: billingPeriod === 'monthly' ? '#0f172a' : '#64748b' }}>Monthly</span>
            <button
              className={`sb-pricing-toggle ${billingPeriod === 'annual' ? 'active' : ''}`}
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
              aria-label="Toggle billing frequency"
            >
              <div className="sb-pricing-toggle-knob"></div>
            </button>
            <span style={{ color: billingPeriod === 'annual' ? '#0f172a' : '#64748b' }}>Yearly</span>
            <span className="sb-discount-badge">Save 25%</span>
          </div>

          {/* Pricing Cards Grid */}
          <div className="sb-pricing-grid">
            {/* Free Tier */}
            <div className="sb-pricing-card">
              <div className="sb-tier-name">Free Department</div>
              <div className="sb-tier-desc">Perfect for single academic departments or trial evaluations.</div>
              <div className="sb-tier-price-wrap">
                <span className="sb-tier-price">$0</span>
                <span className="sb-tier-period">/ forever</span>
              </div>
              <ul className="sb-tier-features">
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>1 Department Schedule</span>
                </li>
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>Up to 25 Faculty & 30 Subjects</span>
                </li>
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>Standard Genetic AI Solver</span>
                </li>
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>Teacher & Student Login Portals</span>
                </li>
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>A4 PDF Timetable Export</span>
                </li>
              </ul>
              <Link to="/register?role=teacher" className="sb-btn sb-btn-outline" style={{ width: '100%' }}>
                Get Started Free
              </Link>
            </div>

            {/* Campus Pro (Featured) */}
            <div className="sb-pricing-card featured">
              <div className="sb-pricing-badge-popular">Most Popular</div>
              <div className="sb-tier-name">Campus Pro</div>
              <div className="sb-tier-desc">Ideal for engineering colleges, faculties, and multiple branches.</div>
              <div className="sb-tier-price-wrap">
                <span className="sb-tier-price">
                  {billingPeriod === 'annual' ? '$39' : '$49'}
                </span>
                <span className="sb-tier-period">/ month</span>
              </div>
              <ul className="sb-tier-features">
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span><strong>Unlimited</strong> Departments & Semesters</span>
                </li>
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>UG & PG Multi-Stream Support</span>
                </li>
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>Multi-Hour Lab Batches & Split Classes</span>
                </li>
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>Workload Cap & Fatigue Optimization</span>
                </li>
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>High-Priority GPU Genetic Algorithm</span>
                </li>
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>Noticeboard PDF, Excel & Direct Print</span>
                </li>
              </ul>
              <Link to="/register?role=teacher" className="sb-btn sb-btn-primary" style={{ width: '100%' }}>
                Upgrade to Pro
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="sb-pricing-card">
              <div className="sb-tier-name">University Enterprise</div>
              <div className="sb-tier-desc">For large multi-campus universities requiring custom SIS integration.</div>
              <div className="sb-tier-price-wrap">
                <span className="sb-tier-price">Custom</span>
              </div>
              <ul className="sb-tier-features">
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>Multi-Campus Central Management</span>
                </li>
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>Custom ERP / SIS Database Sync</span>
                </li>
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>Tailored Institutional Constraint Rules</span>
                </li>
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>Dedicated Account Manager & 99.9% SLA</span>
                </li>
                <li className="sb-tier-feature-item">
                  <FiCheck className="sb-feature-check" />
                  <span>On-Premise or Private Cloud Hosting</span>
                </li>
              </ul>
              <Link to="/login" className="sb-btn sb-btn-outline" style={{ width: '100%' }}>
                Contact University Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          FAQ Section (id="faq")
          ========================================================================== */}
      <section id="faq" className="sb-section sb-section-light sb-section-target">
        <div className="sb-container">
          <div className="sb-section-header">
            <span className="sb-eyebrow">Frequently Asked Questions</span>
            <h2 className="sb-section-title">Common questions about AI Timetable</h2>
            <p className="sb-section-desc">
              Everything you need to know about our scheduling algorithm, role portals, and exports.
            </p>
          </div>

          <div className="sb-faq-wrap">
            {[
              {
                q: "How does the AI ensure 100% conflict-free timetables?",
                a: "Our scheduling engine runs a customized genetic algorithm combined with constraint satisfaction heuristics. It simultaneously evaluates hundreds of parameters—including faculty availability, room capacity, lab equipment, and section overlaps—to guarantee zero double-bookings for teachers or classrooms."
              },
              {
                q: "Can the generator handle multi-hour lab sessions and elective splits?",
                a: "Yes. The system natively supports 2-hour and 3-hour contiguous laboratory blocks with designated lab spaces. It can also manage student batches (e.g., Batch A in OS Lab while Batch B is in DBMS Lab) and elective subject splits across departments."
              },
              {
                q: "What user roles and permissions are supported?",
                a: "The system provides three distinct role portals: Administrators have full control to configure teachers, subjects, rooms, constraints, and generate timetables; Faculty members can log in to view their teaching workload, timetable, and department schedules; Students have access to their section-specific class timetable."
              },
              {
                q: "Does it support both Undergraduate (UG) and Postgraduate (PG) programs?",
                a: "Absolutely. You can manage multiple degree programs such as B.Tech, M.Tech, BCA, MCA, or MBA concurrently, each with their own semester curricula, lecture durations, and specialized infrastructure constraints."
              },
              {
                q: "Can timetables be printed or exported to PDF?",
                a: "Yes! Every generated timetable features one-click PDF export pre-formatted for standard A4 landscape printing. You can print department-wide master timetables, individual classroom schedules, or personalized faculty schedules."
              },
              {
                q: "How fast is the timetable generation process?",
                a: "Most departmental timetables are generated within 5 to 15 seconds. For complex colleges with dozens of faculty members, sections, and lab rotations, the engine typically arrives at an optimal solution in under 30 seconds."
              }
            ].map((faq, fIdx) => (
              <div
                key={fIdx}
                className={`sb-faq-item ${expandedFaq === fIdx ? 'active' : ''}`}
              >
                <button
                  className="sb-faq-question-btn"
                  onClick={() => toggleFaq(fIdx)}
                  aria-expanded={expandedFaq === fIdx}
                >
                  <span>{faq.q}</span>
                  <FiChevronDown className="sb-faq-icon" />
                </button>
                {expandedFaq === fIdx && (
                  <div className="sb-faq-answer">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================================================
          Pre-Footer CTA Banner
          ========================================================================== */}
      <section className="sb-container">
        <div className="sb-cta-banner">
          <h2 className="sb-cta-title">Ready to automate your campus timetable?</h2>
          <p className="sb-cta-desc">
            Join hundreds of educators and institutions delivering conflict-free academic schedules with AI.
          </p>
          <div className="sb-cta-buttons">
            <Link to="/register?role=teacher" className="sb-cta-btn-white">
              <span>Create Free Account</span>
              <FiArrowRight />
            </Link>
            <Link to="/login" className="sb-cta-btn-ghost">
              <FiLogIn />
              <span>Sign In to Portal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          Footer
          ========================================================================== */}
      <footer className="sb-footer">
        <div className="sb-container">
          <div className="sb-footer-grid">
            {/* Col 1: Brand */}
            <div>
              <Link to="/" className="sb-brand">
                <BrandLogo />
                <div className="sb-brand-text">
                  <span className="sb-brand-gradient">AI</span>
                  <span>Timetable</span>
                </div>
              </Link>
              <p className="sb-footer-brand-desc">
                Intelligent, conflict-free timetable generation for higher education colleges and universities.
                Powered by modern genetic optimization.
              </p>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <h4 className="sb-footer-col-title">Navigation</h4>
              <ul className="sb-footer-links">
                <li><a href="#features" className="sb-footer-link">Features</a></li>
                <li><a href="#examples" className="sb-footer-link">Examples</a></li>
                <li><a href="#how-it-works" className="sb-footer-link">How it works</a></li>
                <li><a href="#pricing" className="sb-footer-link">Pricing</a></li>
                <li><a href="#faq" className="sb-footer-link">FAQ</a></li>
              </ul>
            </div>

            {/* Col 3: Portals */}
            <div>
              <h4 className="sb-footer-col-title">Portals</h4>
              <ul className="sb-footer-links">
                <li><Link to="/login?role=admin" className="sb-footer-link">Admin Portal</Link></li>
                <li><Link to="/login?role=teacher" className="sb-footer-link">Teacher Portal</Link></li>
                <li><Link to="/login?role=student" className="sb-footer-link">Student Portal</Link></li>
                <li><Link to="/register?role=teacher" className="sb-footer-link">Teacher Register</Link></li>
                <li><Link to="/register?role=student" className="sb-footer-link">Student Register</Link></li>
              </ul>
            </div>

            {/* Col 4: Capabilities */}
            <div>
              <h4 className="sb-footer-col-title">System</h4>
              <ul className="sb-footer-links">
                <li><span className="sb-footer-link" style={{ cursor: 'default' }}>Genetic AI Engine</span></li>
                <li><span className="sb-footer-link" style={{ cursor: 'default' }}>UG & PG Matrix</span></li>
                <li><span className="sb-footer-link" style={{ cursor: 'default' }}>Workload Balancer</span></li>
                <li><span className="sb-footer-link" style={{ cursor: 'default' }}>A4 PDF Generator</span></li>
              </ul>
            </div>
          </div>

          <div className="sb-footer-bottom">
            <div>© {new Date().getFullYear()} AI Timetable Generator. All rights reserved.</div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <a href="#features" className="sb-footer-link">Privacy Policy</a>
              <a href="#features" className="sb-footer-link">Terms of Service</a>
              <Link to="/login" className="sb-footer-link">Portal Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
