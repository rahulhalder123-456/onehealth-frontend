import { useRef, useState } from 'react';
import { API_BASE_URL, doctorApi } from '../services/api';

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const EMPTY_DAY = { active: false, start: '09:00', end: '17:00' };

export default function Profile({ profile, schedule, onSaveSchedule, onProfileUpdate, showNotification }) {
  const [draftSchedule, setDraftSchedule] = useState(schedule);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const dayDetails = (day) => draftSchedule[day] || EMPTY_DAY;
  const updateDay = (day, updates) => setDraftSchedule((current) => ({
    ...current,
    [day]: { ...dayDetails(day), ...updates },
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveSchedule(draftSchedule);
      showNotification({ title: 'Schedule saved', message: 'Weekly availability is now saved.' });
    } catch (error) {
      showNotification({ title: 'Schedule not saved', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (event) => {
    const photo = event.target.files[0];
    if (!photo) return;
    try {
      const result = await doctorApi.uploadPhoto(photo);
      onProfileUpdate({ photoUrl: result.photoUrl });
      showNotification({ title: 'Photo updated', message: 'Your profile photo was uploaded.' });
    } catch (error) {
      showNotification({ title: 'Photo not uploaded', message: error.message });
    }
  };

  const photoUrl = profile.photoUrl ? `${API_BASE_URL}${profile.photoUrl}` : null;
  const fields = [
    ['Email Address', profile.email],
    ['Phone Number', profile.phone],
    ['Qualifications', profile.qualifications],
    ['Registration No.', profile.regNumber],
    ['Experience', profile.experience],
    ['Hospital / Clinic', profile.hospital],
  ];

  return (
    <div className="profile-layout fade-in">
      <div className="profile-left"><div className="profile-card">
        <div className="profile-photo-section">
          <div className="profile-photo-wrap">
            {photoUrl ? <img src={photoUrl} alt="Profile" className="profile-photo-img" /> :
              <div className="profile-photo-placeholder">DR</div>}
            <button className="profile-photo-edit-btn" onClick={() => fileInputRef.current?.click()}>Edit</button>
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" ref={fileInputRef}
            style={{ display: 'none' }} onChange={handlePhotoChange} />
          <div className="profile-identity"><h2 className="profile-doc-name">{profile.name}</h2>
            <p className="profile-doc-specialty">{profile.specialty}</p>
            <span className="badge badge-tanaya">{profile.department}</span></div>
        </div>
        <div className="profile-info-section">
          <div className="profile-info-notice">Profile details are managed by the OneHealth administrative team.</div>
          {fields.map(([label, value]) => <div className="profile-field-row" key={label}>
            <div className="profile-field-content"><span className="profile-field-label">{label}</span>
              <span className="profile-field-value">{value || 'Not provided'}</span></div>
          </div>)}
        </div>
      </div></div>

      <div className="profile-right"><div className="profile-card">
        <div className="card-header"><span className="card-title">Weekly Availability Schedule</span></div>
        <div className="schedule-list">
          {WEEKDAYS.map((day) => {
            const details = dayDetails(day);
            return <div key={day} className={`schedule-day-row ${!details.active ? 'schedule-day-inactive' : ''}`}>
              <div className="schedule-day-left"><button className={`day-toggle-btn ${details.active ? 'day-toggle-on' : 'day-toggle-off'}`}
                onClick={() => updateDay(day, { active: !details.active })}>{details.active ? 'ON' : 'OFF'}</button>
                <span className="schedule-day-name">{day}</span></div>
              {details.active ? <div className="schedule-time-pickers">
                <select className="schedule-time-select" value={details.start}
                  onChange={(event) => updateDay(day, { start: event.target.value })}>
                  {TIME_SLOTS.map((time) => <option key={time}>{time}</option>)}</select>
                <span className="schedule-to-divider">to</span>
                <select className="schedule-time-select" value={details.end}
                  onChange={(event) => updateDay(day, { end: event.target.value })}>
                  {TIME_SLOTS.map((time) => <option key={time}>{time}</option>)}</select>
              </div> : <span className="schedule-closed-label">Not Available</span>}
            </div>;
          })}
        </div>
        <button className="btn-primary" style={{ maxWidth: '200px', marginTop: '24px' }}
          onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Schedule'}</button>
      </div></div>
    </div>
  );
}
