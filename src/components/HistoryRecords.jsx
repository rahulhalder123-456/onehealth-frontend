import { useState } from 'react';

export default function HistoryRecords({ appointmentsData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter historical records (past 3 months - March, April, May)
  const filteredRecords = appointmentsData.filter((appt) => {
    // Category match
    const categoryMatches = activeFilter === 'All' || appt.category === activeFilter;
    
    // Search match
    const searchMatches = 
      appt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.date.includes(searchTerm);
      
    return categoryMatches && searchMatches;
  }).sort((a, b) => b.date.localeCompare(a.date)); // Sort latest first

  return (
    <div className="card-container fade-in">
      <div className="card-header">
        <span className="card-title">Past Consultation History (3 Months)</span>
        <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: '500' }}>
          Showing {filteredRecords.length} clinical encounters
        </span>
      </div>
      
      <div className="card-body">
        {/* Filters and Search Bar */}
        <div className="records-filter-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by patient, reason, or date..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="category-filter-buttons">
            {['All', 'Tanaya', 'Andro', 'Ritefood'].map((category) => (
              <button
                key={category}
                className={`btn-filter ${activeFilter === category ? 'active' : ''}`}
                onClick={() => setActiveFilter(category)}
              >
                {category === 'All' ? 'All Channels' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Records Table */}
        {filteredRecords.length === 0 ? (
          <div className="empty-state">No matching consultation records found.</div>
        ) : (
          <div className="records-table-container">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Appt Channel</th>
                  <th>Consultation Date</th>
                  <th>Time Slot</th>
                  <th>Clinical Reason / Summary</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="patient-cell">
                        <span className="patient-name-primary">{record.patientName}</span>
                        <span className="patient-age-gender">
                          {record.age} yrs • {record.gender}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${record.category.toLowerCase()}`}>
                        {record.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      {new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td>
                      <span 
                        style={{
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-color)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontWeight: '700',
                          fontSize: '13px'
                        }}
                      >
                        {record.time}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-medium)', maxWidth: '280px', lineBreak: 'normal' }}>
                      {record.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
