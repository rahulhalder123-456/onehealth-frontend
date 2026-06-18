import { useEffect, useRef, useState } from 'react';
import { chatApi } from '../services/api';

const formatTime = (value) => value
  ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  : '';

export default function Chat({ showNotification }) {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    chatApi.conversations().then((items) => {
      setConversations(items);
      setSelected(items[0] || null);
    }).catch((error) => showNotification({ title: 'Chat unavailable', message: error.message }));
  }, [showNotification]);

  useEffect(() => {
    if (!selected) return undefined;
    chatApi.messages(selected.id).then(setMessages)
      .catch((error) => showNotification({ title: 'Messages unavailable', message: error.message }));
    const socket = new WebSocket(chatApi.websocketUrl(selected.id));
    socketRef.current = socket;
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    };
    return () => socket.close();
  }, [selected, showNotification]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const content = inputText.trim();
    if (!content || !selected) return;
    setInputText('');
    try {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ content }));
      } else {
        const message = await chatApi.sendMessage(selected.id, content);
        setMessages((current) => [...current, message]);
      }
    } catch (error) {
      showNotification({ title: 'Message not sent', message: error.message });
      setInputText(content);
    }
  };

  const filtered = conversations.filter((item) =>
    item.patientName.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!selected) return <div className="card-container fade-in"><div className="empty-state">No conversations found.</div></div>;

  return (
    <div className="chat-layout fade-in">
      <div className="chat-patient-list">
        <div className="chat-list-header"><h3 className="chat-list-title">Conversations</h3>
          <span className="chat-unread-count">{conversations.reduce((sum, item) => sum + item.unread, 0)} unread</span></div>
        <div className="chat-search-wrap"><input className="search-input" placeholder="Search patient..."
          value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div>
        <div className="chat-patient-items">{filtered.map((item) => (
          <div key={item.id} className={`chat-patient-item ${selected.id === item.id ? 'active' : ''}`}
            onClick={() => setSelected(item)}>
            <div className="chat-avatar" style={{ backgroundColor: 'var(--primary-color)' }}>{item.avatar}</div>
            <div className="chat-patient-info"><div className="chat-patient-top">
              <span className="chat-patient-name">{item.patientName}</span>
              <span className="chat-patient-time">{formatTime(item.lastTime)}</span></div>
              <div className="chat-patient-bottom"><span className="chat-last-msg">{item.lastMessage}</span>
                {item.unread > 0 && <span className="unread-badge">{item.unread}</span>}</div></div>
          </div>
        ))}</div>
      </div>
      <div className="chat-window">
        <div className="chat-window-header">
          <div><div className="chat-window-patient-name">{selected.patientName}</div>
            <span className={`badge badge-${selected.category.toLowerCase()}`}>{selected.category}</span></div>
          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>Secure real-time communication</div>
        </div>
        <div className="chat-messages-area">{messages.map((message) => (
          <div key={message.id} className={`chat-bubble-row ${message.senderType === 'doctor' ? 'doctor-row' : 'patient-row'}`}>
            <div className={`chat-bubble ${message.senderType === 'doctor' ? 'bubble-doctor' : 'bubble-patient'}`}>
              <p className="bubble-text">{message.content}</p><span className="bubble-time">{formatTime(message.sentAt)}</span>
            </div>
          </div>
        ))}<div ref={messagesEndRef} /></div>
        <div className="chat-input-area"><form onSubmit={handleSendMessage} className="chat-input-form">
          <textarea className="chat-textarea" placeholder="Type your clinical message..." value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSendMessage(event);
              }
            }} rows={1} />
          <button type="submit" className="btn-send" disabled={!inputText.trim()}>Send</button>
        </form></div>
      </div>
    </div>
  );
}
