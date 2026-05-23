import React, { useState } from 'react';

export default function Dashboard({ appointmentsData }) {
  const [analyticsTab, setAnalyticsTab] = useState('daily'); // daily, weekly, monthly

  // Mock data for analytics chart
  const chartDataMap = {
    daily: [
      { label: 'Mon', value: 8 },
      { label: 'Tue', value: 11 },
      { label: 'Wed', value: 9 },
      { label: 'Thu', value: 14 },
      { label: 'Fri', value: 10 },
      { label: 'Sat', value: 4 },
      { label: 'Sun', value: 0 }
    ],
    weekly: [
      { label: 'Week 1', value: 48 },
      { label: 'Week 2', value: 52 },
      { label: 'Week 3', value: 39 },
      { label: 'Week 4', value: 56 }
    ],
    monthly: [
      { label: 'Mar', value: 180 },
      { label: 'Apr', value: 210 },
      { label: 'May', value: 195 }
    ]
  };

  // Select today's appointments only
  const todaysAppts = appointmentsData.filter(appt => appt.isToday).sort((a, b) => a.time.localeCompare(b.time));

  const activeData = chartDataMap[analyticsTab];
  const maxChartValue = Math.max(...activeData.map(d => d.value), 1);

  return (
    <div className="fade-in">
      {/* Metrics Section */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-data">
            <span className="metric-label">Appointments Today</span>
            <span className="metric-value">{todaysAppts.length}</span>
            <span className="metric-change positive">
              ↑ 3 more than yesterday
            </span>
          </div>
          <div className="metric-icon-box">📅</div>
        </div>

        <div className="metric-card">
          <div className="metric-data">
            <span className="metric-label">Next Appointment</span>
            <span className="metric-value" style={{ fontSize: '24px', padding: '4px 0' }}>
              {todaysAppts.length > 0 ? todaysAppts[0].time : 'No more today'}
            </span>
            <span className="metric-change neutral">
              {todaysAppts.length > 0 ? `Patient: ${todaysAppts[0].patientName}` : 'All caught up'}
            </span>
          </div>
          <div className="metric-icon-box">⏰</div>
        </div>

        <div className="metric-card">
          <div className="metric-data">
            <span className="metric-label">Today's Active Hours</span>
            <span className="metric-value">8.5 Hrs</span>
            <span className="metric-change positive">
              ● Availability set till 5:30 PM
            </span>
          </div>
          <div className="metric-icon-box">⚡</div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="dashboard-grid">
        {/* Left Side: Analytics Graph */}
        <div className="card-container">
          <div className="card-header">
            <span className="card-title">Completed Consultations Summary</span>
            <div className="analytics-toggle">
              <button 
                className={`btn-toggle-tab ${analyticsTab === 'daily' ? 'active' : ''}`}
                onClick={() => setAnalyticsTab('daily')}
              >
                Daily
              </button>
              <button 
                className={`btn-toggle-tab ${analyticsTab === 'weekly' ? 'active' : ''}`}
                onClick={() => setAnalyticsTab('weekly')}
              >
                Weekly
              </button>
              <button 
                className={`btn-toggle-tab ${analyticsTab === 'monthly' ? 'active' : ''}`}
                onClick={() => setAnalyticsTab('monthly')}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '16px' }}>
              Historical consultation workload showing clinical sessions conducted across Tanaya, Andro, and Ritefood.
            </p>
            
            <div className="chart-wrapper">
              {activeData.map((data, index) => {
                // Calculate percentage height
                const barHeight = (data.value / maxChartValue) * 80; // Scale to max 80% container height
                return (
                  <div className="chart-column" key={index}>
                    <div className="chart-bar-container">
                      <div 
                        className="chart-bar" 
                        style={{ height: `${barHeight || 5}%` }}
                      >
                        <span className="chart-bar-value">{data.value}</span>
                      </div>
                    </div>
                    <span className="chart-label">{data.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Appointment Queue */}
        <div className="card-container">
          <div className="card-header">
            <span className="card-title">Today's Appointment Queue</span>
            <span className="badge badge-tanaya" style={{ fontSize: '10px' }}>Active Session</span>
          </div>
          <div className="card-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {todaysAppts.length === 0 ? (
              <div className="empty-state">No appointments remaining for today.</div>
            ) : (
              <div className="appointment-list-simple">
                {todaysAppts.map((appt) => (
                  <div className="appointment-item-simple" key={appt.id}>
                    <div className="appt-time-badge">
                      <span className="appt-time">{appt.time}</span>
                      <span className="appt-date-label">Today</span>
                    </div>
                    <div className="appt-details">
                      <div className="appt-patient-name">{appt.patientName}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                        <span className={`badge badge-${appt.category.toLowerCase()}`}>
                          {appt.category}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                          {appt.reason}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
