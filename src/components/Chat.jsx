import React, { useState, useRef, useEffect } from 'react';

const MOCK_PATIENTS = [
  {
    id: 'p1',
    name: 'Nisha Sharma',
    category: 'Tanaya',
    lastMessage: 'Thank you doctor, I will follow the prescription.',
    lastTime: '10:42 AM',
    unread: 2,
    avatar: 'NS',
    online: true,
  },
  {
    id: 'p2',
    name: 'Rohan Mehta',
    category: 'Andro',
    lastMessage: 'Should I continue the supplements?',
    lastTime: '9:15 AM',
    unread: 1,
    avatar: 'RM',
    online: true,
  },
  {
    id: 'p3',
    name: 'Aditi Rao',
    category: 'Ritefood',
    lastMessage: 'I have been following the diet plan.',
    lastTime: 'Yesterday',
    unread: 0,
    avatar: 'AR',
    online: false,
  },
  {
    id: 'p4',
    name: 'Kabir Kapoor',
    category: 'Andro',
    lastMessage: 'Feeling much better this week.',
    lastTime: 'Yesterday',
    unread: 0,
    avatar: 'KK',
    online: false,
  },
  {
    id: 'p5',
    name: 'Pooja Iyer',
    category: 'Tanaya',
    lastMessage: 'When is my next appointment?',
    lastTime: 'Mon',
    unread: 0,
    avatar: 'PI',
    online: false,
  },
];

const MOCK_MESSAGES = {
  p1: [
    { id: 1, from: 'patient', text: 'Good morning doctor. I have been experiencing some discomfort since yesterday.', time: '10:20 AM' },
    { id: 2, from: 'doctor', text: 'Good morning Nisha. Can you describe the discomfort? Is it lower abdominal pain?', time: '10:22 AM' },
    { id: 3, from: 'patient', text: 'Yes, exactly. Also some bloating. Should I be worried?', time: '10:25 AM' },
    { id: 4, from: 'doctor', text: 'Not immediately. This can be related to your cycle. Please take the prescribed medication and monitor for 2 days. If it worsens, visit the clinic.', time: '10:30 AM' },
    { id: 5, from: 'patient', text: 'Okay. What about my PCOS medication? Should I continue?', time: '10:35 AM' },
    { id: 6, from: 'doctor', text: 'Yes, continue as prescribed. Do not skip doses. Also keep a symptom log so we can review at your next appointment.', time: '10:38 AM' },
    { id: 7, from: 'patient', text: 'Thank you doctor, I will follow the prescription.', time: '10:42 AM' },
  ],
  p2: [
    { id: 1, from: 'patient', text: 'Hello doctor. I completed the first week of the new routine.', time: '9:00 AM' },
    { id: 2, from: 'doctor', text: 'Great work Rohan! How is the energy level compared to before?', time: '9:05 AM' },
    { id: 3, from: 'patient', text: 'Much better. But I am a bit concerned about the protein shake timing.', time: '9:10 AM' },
    { id: 4, from: 'doctor', text: 'Take it within 30 minutes post-workout. That is the optimal absorption window.', time: '9:12 AM' },
    { id: 5, from: 'patient', text: 'Should I continue the supplements?', time: '9:15 AM' },
  ],
  p3: [
    { id: 1, from: 'patient', text: 'Doctor, I shared the diet plan with my family as well.', time: 'Yesterday 2:00 PM' },
    { id: 2, from: 'doctor', text: 'Excellent initiative Aditi! A supportive family environment really helps with gestational diabetes management.', time: 'Yesterday 2:30 PM' },
    { id: 3, from: 'patient', text: 'I have been following the diet plan.', time: 'Yesterday 4:00 PM' },
  ],
  p4: [
    { id: 1, from: 'patient', text: 'The new sleep schedule is working.', time: 'Yesterday 8:00 AM' },
    { id: 2, from: 'doctor', text: 'That is great to hear Kabir. Consistent sleep is one of the biggest factors in testosterone recovery.', time: 'Yesterday 8:15 AM' },
    { id: 3, from: 'patient', text: 'Feeling much better this week.', time: 'Yesterday 9:00 AM' },
  ],
  p5: [
    { id: 1, from: 'patient', text: 'Hello doctor, my first trimester has been going well.', time: 'Mon 11:00 AM' },
    { id: 2, from: 'doctor', text: 'Wonderful news Pooja! Make sure you are taking the folic acid supplements daily.', time: 'Mon 11:10 AM' },
    { id: 3, from: 'patient', text: 'When is my next appointment?', time: 'Mon 11:20 AM' },
  ],
};

export default function Chat() {
  const [selectedPatient, setSelectedPatient] = useState(MOCK_PATIENTS[0]);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedPatient, messages]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    // Mark as read
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      from: 'doctor',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => ({
      ...prev,
      [selectedPatient.id]: [...(prev[selectedPatient.id] || []), newMsg],
    }));
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const filteredPatients = MOCK_PATIENTS.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentMessages = messages[selectedPatient.id] || [];

  const getCategoryColor = (cat) => {
    if (cat === 'Tanaya') return 'var(--tanaya-color)';
    if (cat === 'Andro') return 'var(--andro-color)';
    return 'var(--ritefood-color)';
  };

  return (
    <div className="chat-layout fade-in">
      {/* Patient List Sidebar */}
      <div className="chat-patient-list">
        <div className="chat-list-header">
          <h3 className="chat-list-title">Conversations</h3>
          <span className="chat-unread-count">
            {MOCK_PATIENTS.reduce((sum, p) => sum + p.unread, 0)} unread
          </span>
        </div>

        <div className="chat-search-wrap">
          <input
            type="text"
            className="search-input"
            placeholder="Search patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="chat-patient-items">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className={`chat-patient-item ${selectedPatient.id === patient.id ? 'active' : ''}`}
              onClick={() => handleSelectPatient(patient)}
            >
              <div className="chat-patient-avatar-wrap">
                <div
                  className="chat-avatar"
                  style={{ backgroundColor: getCategoryColor(patient.category) }}
                >
                  {patient.avatar}
                </div>
                {patient.online && <span className="online-indicator" />}
              </div>

              <div className="chat-patient-info">
                <div className="chat-patient-top">
                  <span className="chat-patient-name">{patient.name}</span>
                  <span className="chat-patient-time">{patient.lastTime}</span>
                </div>
                <div className="chat-patient-bottom">
                  <span className="chat-last-msg">{patient.lastMessage}</span>
                  {patient.unread > 0 && (
                    <span className="unread-badge">{patient.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {/* Chat Header */}
        <div className="chat-window-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              className="chat-avatar"
              style={{
                backgroundColor: getCategoryColor(selectedPatient.category),
                width: '44px',
                height: '44px',
                fontSize: '16px',
              }}
            >
              {selectedPatient.avatar}
            </div>
            <div>
              <div className="chat-window-patient-name">{selectedPatient.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  className={`badge badge-${selectedPatient.category.toLowerCase()}`}
                  style={{ fontSize: '10px', padding: '2px 7px' }}
                >
                  {selectedPatient.category}
                </span>
                <span style={{ fontSize: '12px', color: selectedPatient.online ? 'var(--success)' : 'var(--text-light)', fontWeight: '600' }}>
                  {selectedPatient.online ? '● Online' : '○ Offline'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
            End-to-end clinical communication
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages-area">
          <div className="chat-date-divider">Today — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>

          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-bubble-row ${msg.from === 'doctor' ? 'doctor-row' : 'patient-row'}`}
            >
              {msg.from === 'patient' && (
                <div
                  className="chat-avatar"
                  style={{
                    backgroundColor: getCategoryColor(selectedPatient.category),
                    width: '32px',
                    height: '32px',
                    fontSize: '11px',
                    flexShrink: 0,
                  }}
                >
                  {selectedPatient.avatar}
                </div>
              )}
              <div className={`chat-bubble ${msg.from === 'doctor' ? 'bubble-doctor' : 'bubble-patient'}`}>
                <p className="bubble-text">{msg.text}</p>
                <span className="bubble-time">{msg.time}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <textarea
              className="chat-textarea"
              placeholder="Type your clinical note or message... (Enter to send)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button type="submit" className="btn-send" disabled={!inputText.trim()}>
              Send ➤
            </button>
          </form>
          <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '6px', textAlign: 'center' }}>
            All clinical communications are securely logged for compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
