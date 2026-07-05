import { useState, useMemo, useEffect } from 'react';

// ponytail: all date math inline, no date-fns/moment needed
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7AM-7PM
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const sameDay = (a, b) => fmtKey(a) === fmtKey(b);
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const startOfWeek = (d) => addDays(d, -d.getDay());

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function formatHour(h) {
  if (h === 0 || h === 24) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function formatTime12(t) {
  const mins = timeToMinutes(t);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// ── Mini Month Calendar ─────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelect, appointmentsData }) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const todayKey = fmtKey(new Date());

  useEffect(() => {
    setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const apptDates = useMemo(() => {
    const set = new Set();
    appointmentsData.forEach(a => set.add(a.date));
    return set;
  }, [appointmentsData]);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="gcal-mini">
      <div className="gcal-mini-header">
        <span className="gcal-mini-title">{SHORT_MONTHS[month]} {year}</span>
        <div className="gcal-mini-nav">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="gcal-mini-btn">◀</button>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="gcal-mini-btn">▶</button>
        </div>
      </div>
      <div className="gcal-mini-grid">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="gcal-mini-weekday">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="gcal-mini-cell empty" />;
          const date = new Date(year, month, day);
          const key = fmtKey(date);
          const isToday = key === todayKey;
          const isSelected = sameDay(date, selectedDate);
          const hasAppt = apptDates.has(key);
          return (
            <div
              key={i}
              className={`gcal-mini-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${hasAppt ? ' has-event' : ''}`}
              onClick={() => onSelect(date)}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Time Grid (Day / Week) ──────────────────────────────────────
function TimeGrid({ dates, appointmentsData, availabilityData, onUpdateAvailability, onSelectDate, onEventClick }) {
  const now = new Date();
  const [currentMinutes, setCurrentMinutes] = useState(now.getHours() * 60 + now.getMinutes());
  const todayKey = fmtKey(now);

  useEffect(() => {
    const timer = setInterval(() => {
      const n = new Date();
      setCurrentMinutes(n.getHours() * 60 + n.getMinutes());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const gridStart = HOURS[0] * 60; // 7:00 = 420
  const gridEnd = (HOURS[HOURS.length - 1] + 1) * 60; // 20:00 = 1200
  const gridSpan = gridEnd - gridStart;

  const apptsByDate = useMemo(() => {
    const map = {};
    dates.forEach(d => { map[fmtKey(d)] = []; });
    appointmentsData.forEach(a => {
      if (map[a.date]) map[a.date].push(a);
    });
    return map;
  }, [dates, appointmentsData]);

  const pctTop = (mins) => Math.max(0, Math.min(100, ((mins - gridStart) / gridSpan) * 100));

  return (
    <div className="gcal-timegrid">
      {/* Column headers */}
      <div className="gcal-col-headers" style={{ gridTemplateColumns: `60px repeat(${dates.length}, 1fr)` }}>
        <div className="gcal-gutter-header" />
        {dates.map(d => {
          const key = fmtKey(d);
          const isToday = key === todayKey;
          const avail = availabilityData[key];
          return (
            <div key={key} className={`gcal-col-header${isToday ? ' today' : ''}`} onClick={() => onSelectDate && onSelectDate(d)}>
              <span className="gcal-col-day">{WEEKDAYS[d.getDay()]}</span>
              <span className={`gcal-col-date${isToday ? ' today-circle' : ''}`}>{d.getDate()}</span>
              {avail?.isAvailable && <span className="gcal-avail-dot" title={`${avail.startTime}–${avail.endTime}`}>●</span>}
            </div>
          );
        })}
      </div>

      {/* Grid body */}
      <div className="gcal-grid-body" style={{ gridTemplateColumns: `60px repeat(${dates.length}, 1fr)` }}>
        {/* Hour labels + grid lines */}
        {HOURS.map(h => (
          <div key={h} className="gcal-hour-row" style={{ gridColumn: '1 / -1', gridRow: h - HOURS[0] + 1 }}>
            <span className="gcal-hour-label">{formatHour(h)}</span>
          </div>
        ))}

        {/* Appointment columns */}
        {dates.map((d, colIdx) => {
          const key = fmtKey(d);
          const dayAppts = apptsByDate[key] || [];
          const isToday = key === todayKey;

          return (
            <div key={key} className={`gcal-day-column${isToday ? ' today' : ''}`}
              style={{ gridColumn: colIdx + 2, gridRow: `1 / ${HOURS.length + 1}` }}>

              {/* Current time indicator */}
              {isToday && currentMinutes >= gridStart && currentMinutes <= gridEnd && (
                <div className="gcal-now-line" style={{ top: `${pctTop(currentMinutes)}%` }}>
                  <div className="gcal-now-dot" />
                </div>
              )}

              {/* Availability background band */}
              {availabilityData[key]?.isAvailable && (() => {
                const avail = availabilityData[key];
                const aStart = timeToMinutes(avail.startTime);
                const aEnd = timeToMinutes(avail.endTime);
                return (
                  <div className="gcal-avail-band"
                    style={{ top: `${pctTop(aStart)}%`, height: `${pctTop(aEnd) - pctTop(aStart)}%` }}
                    title={`Available ${avail.startTime}–${avail.endTime}`}
                  />
                );
              })()}

              {/* Appointment blocks */}
              {dayAppts.map(appt => {
                const startMins = timeToMinutes(appt.time);
                const endMins = startMins + 30; // ponytail: 30min default, expand when duration field exists
                const top = pctTop(startMins);
                const height = Math.max(2.5, pctTop(endMins) - top);
                const cat = (appt.category || '').toLowerCase();
                return (
                  <div key={appt.id} className={`gcal-event gcal-event-${cat}`}
                    style={{ top: `${top}%`, height: `${height}%` }}
                    title={`${formatTime12(appt.time)} — ${appt.patient_name}\n${appt.reason}`}
                    onClick={(e) => { e.stopPropagation(); onEventClick && onEventClick(appt); }}
                  >
                    <span className="gcal-event-time">{formatTime12(appt.time)}</span>
                    <span className="gcal-event-title">{appt.patient_name}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Month Grid ──────────────────────────────────────────────────
function MonthGrid({ year, month, appointmentsData, selectedDate, onSelectDate, onEventClick }) {
  const todayKey = fmtKey(new Date());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const apptsByDate = useMemo(() => {
    const map = {};
    appointmentsData.forEach(a => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [appointmentsData]);

  const cells = [];
  // Previous month padding
  const prevDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  while (cells.length < 42) cells.push({ day: cells.length - firstDay - daysInMonth + 1, current: false });

  return (
    <div className="gcal-month-grid">
      {WEEKDAYS.map(d => <div key={d} className="gcal-month-weekday">{d}</div>)}
      {cells.map((cell, i) => {
        const date = cell.current ? new Date(year, month, cell.day) : null;
        const key = date ? fmtKey(date) : '';
        const dayAppts = (cell.current && apptsByDate[key]) || [];
        const isToday = key === todayKey;
        const isSelected = date && sameDay(date, selectedDate);
        return (
          <div key={i}
            className={`gcal-month-cell${!cell.current ? ' outside' : ''}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
            onClick={() => cell.current && onSelectDate(date)}
          >
            <span className={`gcal-month-day${isToday ? ' today-circle' : ''}`}>{cell.day}</span>
            <div className="gcal-month-events">
              {dayAppts.slice(0, 3).map(a => (
                <div key={a.id} className={`gcal-month-event-bar gcal-event-${(a.category || '').toLowerCase()}`}
                  onClick={(e) => { e.stopPropagation(); onEventClick && onEventClick(a); }}
                >
                  <span className="gcal-month-bar-time">{a.time.slice(0, 5)}</span> {a.patient_name}
                </div>
              ))}
              {dayAppts.length > 3 && <div className="gcal-month-more">+{dayAppts.length - 3} more</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Availability Panel ──────────────────────────────────────────
function AvailabilityPanel({ dateKey, availability, onUpdate }) {
  const avail = availability || { isAvailable: false, startTime: '09:00', endTime: '17:00' };
  const dateLabel = new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric'
  });

  return (
    <div className="gcal-avail-panel">
      <div className="gcal-avail-panel-header">
        <span className="gcal-avail-date">{dateLabel}</span>
        <button
          className={`gcal-avail-toggle${avail.isAvailable ? ' active' : ''}`}
          onClick={() => onUpdate(dateKey, { ...avail, isAvailable: !avail.isAvailable })}
        >
          {avail.isAvailable ? '● Available' : '○ Unavailable'}
        </button>
      </div>
      {avail.isAvailable && (
        <div className="gcal-avail-times">
          <div className="gcal-avail-field">
            <label>Start</label>
            <input type="time" value={avail.startTime}
              onChange={e => onUpdate(dateKey, { ...avail, startTime: e.target.value })} />
          </div>
          <span className="gcal-avail-dash">–</span>
          <div className="gcal-avail-field">
            <label>End</label>
            <input type="time" value={avail.endTime}
              onChange={e => onUpdate(dateKey, { ...avail, endTime: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main CalendarView ───────────────────────────────────────────
export default function CalendarView({ appointmentsData, availabilityData, onUpdateAvailability }) {
  const [view, setView] = useState('week'); // day | week | month
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppt, setSelectedAppt] = useState(null);

  const handleSelectDate = (date) => {
    setSelectedDate(date);
  };

  const handleToday = () => setSelectedDate(new Date());

  const navPrev = () => {
    if (view === 'day') setSelectedDate(addDays(selectedDate, -1));
    else if (view === 'week') setSelectedDate(addDays(selectedDate, -7));
    else setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const navNext = () => {
    if (view === 'day') setSelectedDate(addDays(selectedDate, 1));
    else if (view === 'week') setSelectedDate(addDays(selectedDate, 7));
    else setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  // Title text
  const titleText = (() => {
    if (view === 'day') {
      return selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (view === 'week') {
      const ws = startOfWeek(selectedDate);
      const we = addDays(ws, 6);
      if (ws.getMonth() === we.getMonth()) {
        return `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`;
      }
      return `${SHORT_MONTHS[ws.getMonth()]} ${ws.getDate()} – ${SHORT_MONTHS[we.getMonth()]} ${we.getDate()}, ${we.getFullYear()}`;
    }
    return `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  })();

  // Dates for time grid
  const gridDates = useMemo(() => {
    if (view === 'day') return [selectedDate];
    if (view === 'week') {
      const ws = startOfWeek(selectedDate);
      return Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    }
    return [];
  }, [view, selectedDate]);

  const selectedDateKey = fmtKey(selectedDate);

  return (
    <div className="gcal-root fade-in">
      {/* Sidebar: mini-cal + availability */}
      <aside className="gcal-sidebar">
        <MiniCalendar selectedDate={selectedDate} onSelect={handleSelectDate} appointmentsData={appointmentsData} />
        <AvailabilityPanel
          dateKey={selectedDateKey}
          availability={availabilityData[selectedDateKey]}
          onUpdate={onUpdateAvailability}
        />
      </aside>

      {/* Main area */}
      <div className="gcal-main">
        {/* Toolbar */}
        <div className="gcal-toolbar">
          <div className="gcal-toolbar-left">
            <button className="gcal-btn-today" onClick={handleToday}>Today</button>
            <button className="gcal-btn-nav" onClick={navPrev}>◀</button>
            <button className="gcal-btn-nav" onClick={navNext}>▶</button>
            <h2 className="gcal-title">{titleText}</h2>
          </div>
          <div className="gcal-view-switcher">
            {['day', 'week', 'month'].map(v => (
              <button key={v} className={`gcal-view-btn${view === v ? ' active' : ''}`}
                onClick={() => setView(v)}>
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {view === 'month' ? (
          <MonthGrid
            year={selectedDate.getFullYear()}
            month={selectedDate.getMonth()}
            appointmentsData={appointmentsData}
            selectedDate={selectedDate}
            onSelectDate={(d) => { handleSelectDate(d); setView('day'); }}
            onEventClick={setSelectedAppt}
          />
        ) : (
          <TimeGrid
            dates={gridDates}
            appointmentsData={appointmentsData}
            availabilityData={availabilityData}
            onUpdateAvailability={onUpdateAvailability}
            onSelectDate={handleSelectDate}
            onEventClick={setSelectedAppt}
          />
        )}
      </div>

      {selectedAppt && (
        <div className="gcal-modal-overlay" onClick={() => setSelectedAppt(null)} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="gcal-modal" onClick={e => e.stopPropagation()} style={{background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', position: 'relative'}}>
            <button onClick={() => setSelectedAppt(null)} style={{position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-light)'}}>×</button>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
              <div style={{width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--primary)'}}></div>
              <h3 style={{margin: 0, fontSize: '20px', color: 'var(--text-main)'}}>{selectedAppt.patient_name}</h3>
            </div>
            <div style={{color: 'var(--text-light)', fontSize: '15px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <div><strong>Time:</strong> {selectedAppt.time} on {new Date(selectedAppt.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div><strong>Category:</strong> <span className={`badge badge-${(selectedAppt.category || '').toLowerCase()}`}>{selectedAppt.category}</span></div>
              <div><strong>Status:</strong> {selectedAppt.status}</div>
              {selectedAppt.reason && (
                <div style={{marginTop: '4px', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: '8px', color: 'var(--text-main)', border: '1px solid var(--border-color)'}}>
                  <div style={{fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '4px', fontWeight: 'bold'}}>Reason for Visit</div>
                  {selectedAppt.reason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
