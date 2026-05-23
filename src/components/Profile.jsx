import React, { useState, useRef } from 'react';

const MOCK_DOCTOR_PROFILE = {
  name: 'Dr. Sarah Carter',
  email: 'sarah.carter@onehealth.com',
  phone: '+91 98765 43210',
  specialty: 'Lead Gynecologist',
  department: 'Tanaya Unit',
  qualification: 'MBBS, MD (Obstetrics & Gynecology)',
  registrationNo: 'MCI-2024-GYN-08472',
  experience: '12 Years',
  hospital: 'Onehealth Medical Center, Bengaluru',
  joinedOn: 'March 2014',
};

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_SCHEDULE = {
  Monday:    { active: true,  start: '09:00', end: '17:00' },
  Tuesday:   { active: true,  start: '09:00', end: '17:00' },
  Wednesday: { active: true,  start: '09:00', end: '13:00' },
  Thursday:  { active: true,  start: '09:00', end: '17:00' },
  Friday:    { active: true,  start: '09:00', end: '17:00' },
  Saturday:  { active: false, start: '09:00', end: '12:00' },
  Sunday:    { active: false, start: '09:00', end: '12:00' },
};

export default function Profile() {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleToggleDay = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active },
    }));
  };

  const handleTimeChange = (day, type, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [type]: value },
    }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="profile-layout fade-in">
      {/* Left Column: Profile Card */}
      <div className="profile-left">
        {/* Photo & Identity */}
        <div className="profile-card">
          <div className="profile-photo-section">
            <div className="profile-photo-wrap">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="profile-photo-img" />
              ) : (
                <div className="profile-photo-placeholder">🩺</div>
              )}
              <button
                className="profile-photo-edit-btn"
                onClick={() => fileInputRef.current.click()}
                title="Change profile photo"
              >
                ✎
              </button>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />

            <div className="profile-identity">
              <h2 className="profile-doc-name">{MOCK_DOCTOR_PROFILE.name}</h2>
              <p className="profile-doc-specialty">{MOCK_DOCTOR_PROFILE.specialty}</p>
              <span className="badge badge-tanaya" style={{ marginTop: '8px', fontSize: '11px' }}>
                {MOCK_DOCTOR_PROFILE.department}
              </span>
            </div>
          </div>

          {/* Read-only Info Fields */}
          <div className="profile-info-section">
            <div className="profile-info-notice">
              🔒 Profile details are managed by the Onehealth administrative team. Contact admin to request any changes.
            </div>

            {[
              { label: 'Email Address', value: MOCK_DOCTOR_PROFILE.email, icon: '✉️' },
              { label: 'Phone Number', value: MOCK_DOCTOR_PROFILE.phone, icon: '📞' },
              { label: 'Qualification', value: MOCK_DOCTOR_PROFILE.qualification, icon: '🎓' },
              { label: 'Registration No.', value: MOCK_DOCTOR_PROFILE.registrationNo, icon: '🪪' },
              { label: 'Experience', value: MOCK_DOCTOR_PROFILE.experience, icon: '⏱️' },
              { label: 'Hospital / Clinic', value: MOCK_DOCTOR_PROFILE.hospital, icon: '🏥' },
              { label: 'Joined On', value: MOCK_DOCTOR_PROFILE.joinedOn, icon: '📅' },
            ].map(({ label, value, icon }) => (
              <div className="profile-field-row" key={label}>
                <span className="profile-field-icon">{icon}</span>
                <div className="profile-field-content">
                  <span className="profile-field-label">{label}</span>
                  <span className="profile-field-value">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Weekly Availability Schedule */}
      <div className="profile-right">
        <div className="profile-card">
          <div className="card-header" style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <span className="card-title">Weekly Availability Schedule</span>
            <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
              Patients book appointments based on these hours
            </span>
          </div>

          <div className="schedule-list">
            {WEEKDAYS.map((day) => (
              <div key={day} className={`schedule-day-row ${!schedule[day].active ? 'schedule-day-inactive' : ''}`}>
                <div className="schedule-day-left">
                  <button
                    className={`day-toggle-btn ${schedule[day].active ? 'day-toggle-on' : 'day-toggle-off'}`}
                    onClick={() => handleToggleDay(day)}
                  >
                    {schedule[day].active ? 'ON' : 'OFF'}
                  </button>
                  <span className="schedule-day-name">{day}</span>
                </div>

                {schedule[day].active ? (
                  <div className="schedule-time-pickers">
                    <div className="schedule-time-field">
                      <label className="schedule-time-label">From</label>
                      <select
                        className="schedule-time-select"
                        value={schedule[day].start}
                        onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                      >
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <span className="schedule-to-divider">→</span>
                    <div className="schedule-time-field">
                      <label className="schedule-time-label">Until</label>
                      <select
                        className="schedule-time-select"
                        value={schedule[day].end}
                        onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                      >
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <span className="schedule-closed-label">Not Available</span>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-primary" style={{ maxWidth: '200px' }} onClick={handleSave}>
              Save Schedule
            </button>
            {saved && (
              <span style={{
                color: 'var(--success)',
                fontWeight: '700',
                fontSize: '14px',
                animation: 'fadeIn 0.3s ease',
              }}>
                ✓ Schedule saved successfully
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
