import { useCallback, useEffect, useState } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import HistoryRecords from './components/HistoryRecords';
import Prescriptions from './components/Prescriptions';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Toast from './components/Toast';
import { appointmentsApi, clearToken, doctorApi, getToken } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState({});
  const [weeklyAvailability, setWeeklyAvailability] = useState({});
  const [loading, setLoading] = useState(Boolean(getToken()));

  const showNotification = useCallback((data) => setToast(data), []);

  const loadPortalData = useCallback(async () => {
    try {
      const [profile, appointmentData, availabilityData] = await Promise.all([
        doctorApi.profile(),
        appointmentsApi.list(),
        doctorApi.availability(),
      ]);
      setUser(profile);
      setAppointments(appointmentData);
      setAvailability(availabilityData.dates || {});
      setWeeklyAvailability(availabilityData.weekly || {});
    } catch (error) {
      clearToken();
      setUser(null);
      showNotification({ title: 'Session unavailable', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (getToken()) {
      Promise.resolve().then(loadPortalData);
    }
  }, [loadPortalData]);

  const handleLoginSuccess = async (profile) => {
    setUser(profile);
    showNotification({ title: 'Access granted', message: `Welcome back, ${profile.name}` });
    await loadPortalData();
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setAppointments([]);
    showNotification({ title: 'Logged out', message: 'Secure clinical session ended.' });
  };

  const handleUpdateAvailability = async (dateKey, data) => {
    const updated = { ...availability, [dateKey]: data };
    setAvailability(updated);
    try {
      await doctorApi.saveDateAvailability(updated);
    } catch (error) {
      showNotification({ title: 'Availability not saved', message: error.message });
    }
  };

  const handleWeeklyAvailability = async (schedule) => {
    const result = await doctorApi.saveWeeklyAvailability(schedule);
    setWeeklyAvailability(result.weekly);
  };

  const handleProfileUpdate = (updates) => setUser((current) => ({ ...current, ...updates }));

  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return <CalendarView appointmentsData={appointments} availabilityData={availability}
          onUpdateAvailability={handleUpdateAvailability} />;
      case 'records':
        return <HistoryRecords appointmentsData={appointments} />;
      case 'prescriptions':
        return <Prescriptions appointmentsData={appointments} showNotification={showNotification} />;
      case 'chat':
        return <Chat showNotification={showNotification} />;
      case 'profile':
        return <Profile profile={user} schedule={weeklyAvailability}
          onSaveSchedule={handleWeeklyAvailability} onProfileUpdate={handleProfileUpdate}
          showNotification={showNotification} />;
      default:
        return <Dashboard appointmentsData={appointments} availabilityData={availability} />;
    }
  };

  const titles = {
    dashboard: 'Overview Dashboard',
    calendar: 'Clinic Calendar & Availability',
    records: 'Patient Encounters',
    prescriptions: 'Prescriptions',
    chat: 'Patient Conversations',
    profile: 'My Profile',
  };

  if (loading) return <div className="login-container"><div className="login-card">Loading OneHealth portal...</div></div>;
  if (!user) return <><Toast toast={toast} onClose={() => setToast(null)} />
    <Login onLoginSuccess={handleLoginSuccess} showNotification={showNotification} /></>;

  return (
    <div className="app-container">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo-wrap"><div className="brand-icon">+</div>
            <h1 className="brand-title">One<span>Health</span></h1></div>
          <span className="brand-subtitle">Doctor Portal</span>
        </div>
        <ul className="sidebar-menu">
          <li className="menu-section-label">Clinic</li>
          {[
            ['dashboard', 'Dashboard'],
            ['calendar', 'Calendar'],
            ['records', 'Patient Records'],
            ['prescriptions', 'Prescriptions'],
            ['chat', 'Patient Chat'],
          ].map(([tab, label]) => (
            <li className="menu-item" key={tab}><button className={`menu-link ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}>{label}</button></li>
          ))}
          <div className="sidebar-divider" />
          <li className="menu-section-label">Account</li>
          <li className="menu-item"><button className={`menu-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}>My Profile</button></li>
        </ul>
        <div className="sidebar-footer">
          <div className="doctor-profile-brief">
            <div className="doc-avatar">DR</div>
            <div className="doc-info"><span className="doc-name">{user.name}</span>
              <span className="doc-specialty">{user.specialty}</span></div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="top-bar">
          <h2 className="page-title">{titles[activeTab]}</h2>
          <div className="top-bar-right"><div className="status-pill"><span className="status-dot" />API Online</div>
            <div className="top-bar-date">{new Date().toLocaleDateString('en-US', {
              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
            })}</div></div>
        </header>
        <div className="content-viewport">{renderContent()}</div>
      </main>
    </div>
  );
}
