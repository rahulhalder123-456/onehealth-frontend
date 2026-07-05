import { useMemo, useState } from 'react';

export default function Dashboard({ appointmentsData, availabilityData }) {
  const [analyticsTab, setAnalyticsTab] = useState('daily');
  const todayKey = new Date().toISOString().slice(0, 10);
  const todaysAppts = appointmentsData.filter((item) => item.date === todayKey).sort((a, b) => a.time.localeCompare(b.time));
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const timeMinutes = (value) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  
  // ponytail ultra: queue should show all pending today, not disappear when time passes
  const upcomingAppts = todaysAppts.filter((item) => item.status !== 'completed');
  const nextAppt = upcomingAppts.find((item) => timeMinutes(item.time) >= nowMinutes) || upcomingAppts[0];
  const todayAvailability = availabilityData[todayKey];
  const activeHours = todayAvailability?.isAvailable
    ? Math.max(0, (
      Number(todayAvailability.endTime.slice(0, 2)) + Number(todayAvailability.endTime.slice(3)) / 60
    ) - (
        Number(todayAvailability.startTime.slice(0, 2)) + Number(todayAvailability.startTime.slice(3)) / 60
      ))
    : 0;

  const chartDataMap = useMemo(() => {
    const countBy = (labels, keyFor) => labels.map((label) => ({
      label,
      value: appointmentsData.filter((item) => keyFor(new Date(`${item.date}T00:00:00`)) === label).length,
    }));
    return {
      daily: countBy(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        (date) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]),
      weekly: [1, 2, 3, 4, 5].map((week) => ({
        label: `Week ${week}`,
        value: appointmentsData.filter((item) => Math.ceil(new Date(`${item.date}T00:00:00`).getDate() / 7) === week).length,
      })),
      monthly: countBy(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        (date) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]),
    };
  }, [appointmentsData]);

  const activeData = chartDataMap[analyticsTab];
  const maxValue = Math.max(...activeData.map((item) => item.value), 1);

  return (
    <div className="fade-in">
      <div className="metrics-row">
        <div className="metric-card"><div className="metric-data">
          <span className="metric-label">Appointments Today</span><span className="metric-value">{todaysAppts.length}</span>
          <span className="metric-change positive">Up to date</span></div></div>
        <div className="metric-card metric-card-urgent"><div className="metric-data">
          <span className="metric-label">Next Appointment</span>
          <span className="metric-value" style={{ fontSize: '24px' }}>{nextAppt?.time || 'No more today'}</span>
          <span className="metric-change urgent">{nextAppt?.patientName || 'All caught up'}</span></div></div>
        <div className="metric-card"><div className="metric-data">
          <span className="metric-label">Today's Active Hours</span><span className="metric-value">{activeHours} Hrs</span>
          <span className="metric-change positive">{todayAvailability?.isAvailable
            ? `Available until ${todayAvailability.endTime}` : 'Not available today'}</span></div></div>
      </div>

      <div className="dashboard-grid">
        <div className="card-container">
          <div className="card-header"><span className="card-title">Appointments Summary</span>
            <div className="analytics-toggle">{['daily', 'weekly', 'monthly'].map((tab) => (
              <button key={tab} className={`btn-toggle-tab ${analyticsTab === tab ? 'active' : ''}`}
                onClick={() => setAnalyticsTab(tab)}>{tab[0].toUpperCase() + tab.slice(1)}</button>
            ))}</div></div>
          <div className="card-body"><div className="chart-wrapper">{activeData.map((item) => (
            <div className="chart-column" key={item.label}><div className="chart-bar-container">
              <div className="chart-bar" style={{ height: `${Math.max(5, (item.value / maxValue) * 80)}%` }}>
                <span className="chart-bar-value">{item.value}</span></div></div>
              <span className="chart-label">{item.label}</span></div>
          ))}</div></div>
        </div>
        <div className="card-container"><div className="card-header"><span className="card-title">Today's Appointment Queue</span></div>
          <div className="card-body">{upcomingAppts.length === 0 ? <div className="empty-state">No more appointments today.</div> :
            <div className="appointment-list-simple">{upcomingAppts.map((item) => (
              <div className="appointment-item-simple" key={item.id}><div className="appt-time-badge">
                <span className="appt-time">{item.time}</span><span className="appt-date-label">Today</span></div>
                <div className="appt-details"><div className="appt-patient-name">{item.patientName}</div>
                  <span className={`badge badge-${item.category.toLowerCase()}`}>{item.category}</span>
                  <span style={{ fontSize: '12px', marginLeft: '8px' }}>{item.reason}</span></div></div>
            ))}</div>}</div>
        </div>
      </div>
    </div>
  );
}
