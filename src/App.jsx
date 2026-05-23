import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import HistoryRecords from './components/HistoryRecords';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Toast from './components/Toast';

// Unified 3-Month Database (March, April, May 2026)
const MOCK_APPOINTMENTS = [
  // Today's appointments (May 23, 2026)
  { id: 't1', date: '2026-05-23', time: '09:30', patientName: 'Nisha Sharma', age: 29, gender: 'Female', category: 'Tanaya', reason: 'PCOS follow-up & cycle review', isToday: true },
  { id: 't2', date: '2026-05-23', time: '11:00', patientName: 'Rohan Mehta', age: 34, gender: 'Male', category: 'Andro', reason: 'Stress fatigue & gym nutrition review', isToday: true },
  { id: 't3', date: '2026-05-23', time: '14:30', patientName: 'Aditi Rao', age: 41, gender: 'Female', category: 'Ritefood', reason: 'Gestational diabetes meal plan', isToday: true },
  { id: 't4', date: '2026-05-23', time: '16:00', patientName: 'Kabir Kapoor', age: 52, gender: 'Male', category: 'Andro', reason: 'Annual wellness check & panel review', isToday: true },
  
  // Future appointments (May 24, 2026 onwards)
  { id: 'f1', date: '2026-05-24', time: '10:00', patientName: 'Pooja Iyer', age: 31, gender: 'Female', category: 'Tanaya', reason: 'First trimester pregnancy wellness' },
  { id: 'f2', date: '2026-05-24', time: '12:30', patientName: 'Vikram Singh', age: 45, gender: 'Male', category: 'Ritefood', reason: 'Hypertension sodium-reduction consult' },
  { id: 'f3', date: '2026-05-25', time: '11:30', patientName: 'Meera Deshmukh', age: 37, gender: 'Female', category: 'Tanaya', reason: 'Fertility consult & hormone panel' },
  { id: 'f4', date: '2026-05-26', time: '15:00', patientName: 'Arjun Sen', age: 39, gender: 'Male', category: 'Andro', reason: 'Hair thinning & alopecia check' },
  
  // Past appointments - May 2026
  { id: 'm1', date: '2026-05-18', time: '09:00', patientName: 'Divya Patel', age: 26, gender: 'Female', category: 'Tanaya', reason: 'Irregular cycles scan review' },
  { id: 'm2', date: '2026-05-15', time: '14:00', patientName: 'Rahul Verma', age: 48, gender: 'Male', category: 'Andro', reason: 'Erectile health follow-up' },
  { id: 'm3', date: '2026-05-10', time: '11:30', patientName: 'Sanjay Dutt', age: 58, gender: 'Male', category: 'Ritefood', reason: 'Heart-healthy cholesterol diet plan' },
  
  // Past appointments - April 2026
  { id: 'a1', date: '2026-04-25', time: '10:30', patientName: 'Ananya Goel', age: 33, gender: 'Female', category: 'Tanaya', reason: 'Contraceptive counseling session' },
  { id: 'a2', date: '2026-04-20', time: '16:00', patientName: 'Deepak Roy', age: 38, gender: 'Male', category: 'Andro', reason: 'Testosterone replacement follow-up' },
  { id: 'a3', date: '2026-04-12', time: '09:30', patientName: 'Kirti Joshi', age: 62, gender: 'Female', category: 'Ritefood', reason: 'Uric acid reduction dietary consultation' },
  { id: 'a4', date: '2026-04-05', time: '11:00', patientName: 'Sunita Nair', age: 45, gender: 'Female', category: 'Tanaya', reason: 'Endometriosis management plan review' },

  // Past appointments - March 2026
  { id: 'mr1', date: '2026-03-28', time: '14:00', patientName: 'Amit Trivedi', age: 42, gender: 'Male', category: 'Andro', reason: 'Fatigue & vitamin deficiency consult' },
  { id: 'mr2', date: '2026-03-19', time: '10:00', patientName: 'Sneha Reddy', age: 28, gender: 'Female', category: 'Tanaya', reason: 'PCOS first diagnostic session' },
  { id: 'mr3', date: '2026-03-10', time: '16:30', patientName: 'Vijay Mallaya', age: 65, gender: 'Male', category: 'Ritefood', reason: 'Geriatric dietary advice & supplements' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, calendar, records
  const [toast, setToast] = useState(null);
  const [availability, setAvailability] = useState({});

  // Fetch initial profile & availability on load
  useEffect(() => {
    const savedUser = localStorage.getItem('onehealth_doc_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedAvailability = localStorage.getItem('onehealth_doc_availability');
    if (savedAvailability) {
      setAvailability(JSON.parse(savedAvailability));
    } else {
      // Default initial availability for a few key days
      const defaultAvailability = {
        '2026-05-23': { isAvailable: true, startTime: '09:00', endTime: '17:30' },
        '2026-05-24': { isAvailable: true, startTime: '09:00', endTime: '14:00' },
        '2026-05-25': { isAvailable: false, startTime: '09:00', endTime: '17:00' }
      };
      setAvailability(defaultAvailability);
      localStorage.setItem('onehealth_doc_availability', JSON.stringify(defaultAvailability));
    }
  }, []);

  const showNotification = (data) => {
    setToast(data);
  };

  const handleLoginSuccess = (profile) => {
    setUser(profile);
    localStorage.setItem('onehealth_doc_user', JSON.stringify(profile));
    showNotification({
      title: '✅ Access Granted',
      message: `Welcome back, ${profile.name}`
    });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('onehealth_doc_user');
    showNotification({
      title: '🚪 Logged Out',
      message: 'Secure clinical session ended successfully.'
    });
  };

  const handleUpdateAvailability = (dateKey, data) => {
    const updated = {
      ...availability,
      [dateKey]: data
    };
    setAvailability(updated);
    localStorage.setItem('onehealth_doc_availability', JSON.stringify(updated));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard appointmentsData={MOCK_APPOINTMENTS} />;
      case 'calendar':
        return (
          <CalendarView 
            appointmentsData={MOCK_APPOINTMENTS} 
            availabilityData={availability}
            onUpdateAvailability={handleUpdateAvailability}
          />
        );
      case 'records':
        return <HistoryRecords appointmentsData={MOCK_APPOINTMENTS} />;
      case 'chat':
        return <Chat />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard appointmentsData={MOCK_APPOINTMENTS} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'calendar':
        return 'Clinic Calendar & Availability';
      case 'records':
        return '3-Month Patient Encounters';
      case 'chat':
        return 'Patient Conversations';
      case 'profile':
        return 'My Profile';
      default:
        return 'Dashboard';
    }
  };

  // If not logged in, show login page
  if (!user) {
    return (
      <>
        <Toast toast={toast} onClose={() => setToast(null)} />
        <Login onLoginSuccess={handleLoginSuccess} showNotification={showNotification} />
      </>
    );
  }

  return (
    <div className="app-container">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="brand-title">Onehealth</h1>
          <span className="brand-subtitle">Physician Hub</span>
        </div>

        <nav className="sidebar-menu">
          <li className="menu-item">
            <button 
              className={`menu-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Overview Dashboard
            </button>
          </li>
          <li className="menu-item">
            <button 
              className={`menu-link ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              📅 Clinic Calendar
            </button>
          </li>
          <li className="menu-item">
            <button 
              className={`menu-link ${activeTab === 'records' ? 'active' : ''}`}
              onClick={() => setActiveTab('records')}
            >
              📂 Past Patient Records
            </button>
          </li>
          <li className="menu-item">
            <button 
              className={`menu-link ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              💬 Patient Chat
            </button>
          </li>
        </nav>

        <nav style={{ padding: '0 12px 12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <button 
                className={`menu-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                👤 My Profile
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="doctor-profile-brief">
            <div className="doc-avatar">🩺</div>
            <div className="doc-info">
              <span className="doc-name">{user.name}</span>
              <span className="doc-specialty">{user.specialty}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="main-content">
        <header className="top-bar">
          <h2 className="page-title">{getPageTitle()}</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              fontSize: '13px',
              fontWeight: '700',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1.5px solid rgba(22, 163, 74, 0.2)'
            }}>
              ● System Online
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: '600' }}>
              May 23, 2026
            </span>
          </div>
        </header>

        <div className="content-viewport">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
