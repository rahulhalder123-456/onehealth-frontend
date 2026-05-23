import React, { useEffect } from 'react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    
    // Automatically close the toast after 10 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('OTP copied to clipboard!');
  };

  return (
    <div className="toast-container">
      <div className="toast fade-in">
        <div className="toast-content">
          <span className="toast-title">{toast.title || 'Notification'}</span>
          <span className="toast-msg">
            {toast.message}{' '}
            {toast.code && (
              <span 
                className="toast-code" 
                title="Click to copy code"
                onClick={() => copyToClipboard(toast.code)}
                style={{ cursor: 'pointer' }}
              >
                {toast.code}
              </span>
            )}
          </span>
        </div>
        <button className="btn-toast-close" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
}
