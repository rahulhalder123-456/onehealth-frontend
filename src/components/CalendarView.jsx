import { useState } from 'react';

export default function CalendarView({ appointmentsData, availabilityData, onUpdateAvailability }) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper: Format Date to YYYY-MM-DD
  const formatDateKey = (year, month, day) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Navigations
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar days
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayIndex = (y, m) => new Date(y, m, 1).getDay();

  const totalDays = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayIndex(year, month);

  // Generate blank calendar grid cells for previous month padding
  const calendarCells = [];
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthTotalDays = getDaysInMonth(prevYear, prevMonth);

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthTotalDays - i,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false
    });
  }

  // Current month cells
  for (let d = 1; d <= totalDays; d++) {
    calendarCells.push({
      day: d,
      month: month,
      year: year,
      isCurrentMonth: true
    });
  }

  // Pad the grid to end on a full week (multiple of 7)
  const remainingCells = 42 - calendarCells.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let d = 1; d <= remainingCells; d++) {
    calendarCells.push({
      day: d,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false
    });
  }

  // Grab availability for selected date
  const selectedAvailability = availabilityData[selectedDateKey] || {
    isAvailable: false,
    startTime: '09:00',
    endTime: '17:00'
  };

  // Filter appointments for selected date
  const selectedDayAppts = appointmentsData.filter(appt => appt.date === selectedDateKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Handle Availability Toggle change
  const handleToggleAvailable = () => {
    const updated = {
      ...selectedAvailability,
      isAvailable: !selectedAvailability.isAvailable
    };
    onUpdateAvailability(selectedDateKey, updated);
  };

  // Handle Hours Change
  const handleHoursChange = (type, value) => {
    const updated = {
      ...selectedAvailability,
      [type]: value
    };
    onUpdateAvailability(selectedDateKey, updated);
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-layout fade-in">
      {/* Left Column: Interactive Grid */}
      <div className="calendar-card">
        <div className="calendar-header-nav">
          <div className="calendar-month-year">
            {monthNames[month]} {year}
          </div>
          <div className="calendar-nav-buttons">
            <button className="btn-cal-nav" onClick={handlePrevMonth} title="Previous Month">
              ◀
            </button>
            <button className="btn-cal-nav" onClick={handleNextMonth} title="Next Month">
              ▶
            </button>
          </div>
        </div>

        <div className="calendar-grid">
          {weekdays.map(day => (
            <div className="calendar-weekday" key={day}>{day}</div>
          ))}

          {calendarCells.map((cell, idx) => {
            const dateKey = formatDateKey(cell.year, cell.month, cell.day);
            const isSelected = dateKey === selectedDateKey;
            const isToday = dateKey === todayKey;
            
            // Get appointments count/categories for indicator dots
            const dayAppts = appointmentsData.filter(appt => appt.date === dateKey);
            const dayAvail = availabilityData[dateKey];

            return (
              <div
                key={idx}
                className={`calendar-day-cell ${!cell.isCurrentMonth ? 'inactive-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => cell.isCurrentMonth && setSelectedDateKey(dateKey)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span className="day-number">{cell.day}</span>
                  {cell.isCurrentMonth && dayAvail && dayAvail.isAvailable && (
                    <span 
                      style={{
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        fontSize: '9px',
                        fontWeight: '800',
                        padding: '1px 4px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}
                      title={`Available ${dayAvail.startTime} - ${dayAvail.endTime}`}
                    >
                      Avail
                    </span>
                  )}
                </div>

                {cell.isCurrentMonth && dayAppts.length > 0 && (
                  <div className="day-indicators">
                    {/* Render color indicators for categories */}
                    {Array.from(new Set(dayAppts.map(a => a.category))).map(cat => (
                      <span 
                        key={cat} 
                        className={`indicator-dot ${cat.toLowerCase()}`}
                        title={`${cat} Consultation`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Daily Configurator & Timeline */}
      <div className="scheduler-panel">
        {/* Availability Form */}
        <div className="scheduler-card">
          <div className="selected-day-banner">
            📅 {new Date(selectedDateKey + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          
          <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px' }}>
            Set your practice hours for this day. Patients can book slots automatically in their apps based on these hours.
          </p>

          <div className="availability-slots-list">
            <div className="availability-slot-row">
              <div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-medium)', display: 'block' }}>
                  Availability Status
                </span>
                {selectedAvailability.isAvailable ? (
                  <span className="slot-status-active">● Accepting Bookings</span>
                ) : (
                  <span className="slot-status-inactive">○ Unavailable / Closed</span>
                )}
              </div>
              
              <button 
                type="button" 
                className={`toggle-btn ${selectedAvailability.isAvailable ? 'active' : ''}`}
                onClick={handleToggleAvailable}
              >
                {selectedAvailability.isAvailable ? 'Mark Closed' : 'Mark Open'}
              </button>
            </div>

            {selectedAvailability.isAvailable && (
              <div className="availability-edit-form">
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>
                  Configure Consultation Hours
                </span>
                <div className="time-inputs-group">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-light)' }}>Start Time</label>
                    <input
                      type="time"
                      className="time-input-field"
                      value={selectedAvailability.startTime}
                      onChange={(e) => handleHoursChange('startTime', e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-light)' }}>End Time</label>
                    <input
                      type="time"
                      className="time-input-field"
                      value={selectedAvailability.endTime}
                      onChange={(e) => handleHoursChange('endTime', e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600', marginTop: '4px' }}>
                  ✓ Working hours saved to local schedule
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Queue for that Day */}
        <div className="scheduler-card">
          <span className="card-title" style={{ display: 'block', marginBottom: '14px' }}>
            Consultation List ({selectedDayAppts.length})
          </span>

          {selectedDayAppts.length === 0 ? (
            <div className="empty-state">No patient consultations scheduled on this date.</div>
          ) : (
            <div className="day-appointments-list">
              {selectedDayAppts.map((appt) => (
                <div className={`day-appt-item ${appt.category.toLowerCase()}`} key={appt.id}>
                  <div className="day-appt-time">{appt.time}</div>
                  <div className="day-appt-details">
                    <span className="day-appt-patient">{appt.patientName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span className={`badge badge-${appt.category.toLowerCase()}`} style={{ padding: '2px 6px', fontSize: '9px' }}>
                        {appt.category}
                      </span>
                      <span className="day-appt-note">{appt.reason}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
