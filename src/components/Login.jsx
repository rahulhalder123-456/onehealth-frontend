import React, { useState, useRef } from 'react';

export default function Login({ onLoginSuccess, showNotification }) {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const otpRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    // Quick regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate startup API lag (FastAPI network simulation)
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      showNotification({
        title: '🔑 Hardcoded OTP Sent',
        message: 'Enter mock code ',
        code: '123456'
      });
    }, 800);
  };

  const handleOtpChange = (index, value) => {
    // Only allow single numbers
    if (value && isNaN(value)) return;
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.substring(value.length - 1); // Keep last char
    setOtpValues(newOtpValues);
    setError('');

    // Auto-focus next field
    if (value && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace back-focus
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const otpCode = otpValues.join('');
    
    if (otpCode.length < 6) {
      setError('Please enter the full 6-digit OTP code');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      if (otpCode === '123456') {
        onLoginSuccess({
          email: email,
          name: 'Dr. Sarah Carter',
          specialty: 'Lead Gynecologist (Tanaya Unit)'
        });
      } else {
        setError('Invalid OTP code. Please use the hardcoded code 123456');
        // Clear OTP inputs on fail
        setOtpValues(['', '', '', '', '', '']);
        otpRefs[0].current.focus();
      }
    }, 1000);
  };

  const handleBackToEmail = () => {
    setOtpSent(false);
    setOtpValues(['', '', '', '', '', '']);
    setError('');
  };

  return (
    <div className="login-container fade-in">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">Onehealth</div>
          <p className="login-tagline">Doctor Portal • Tanaya | Andro | Ritefood</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1.5px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">
                Enter Clinical Email Address
              </label>
              <input
                id="email-input"
                type="email"
                className="form-input"
                placeholder="doctor@onehealth.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                disabled={loading}
                autoFocus
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Requesting Connection...' : 'Request OTP Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>
                OTP Sent to: <strong style={{ color: 'var(--primary-color)' }}>{email}</strong>
              </label>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', textAlign: 'center', marginBottom: '8px' }}>
                Enter the 6-digit verification code below
              </p>
              
              <div className="otp-inputs-row">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="otp-box"
                    ref={otpRefs[idx]}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={loading}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '16px' }}>
              {loading ? 'Authenticating...' : 'Verify & Log In'}
            </button>

            <button 
              type="button" 
              className="login-switch-link" 
              onClick={handleBackToEmail}
              disabled={loading}
            >
              Change Email Address
            </button>
          </form>
        )}

        <div className="login-info-box">
          <strong>Internship Guide Note:</strong> The OTP flow is built to simulate a secure FastAPI login. Use the simulated credentials above. No register page exists as doctors are pre-registered by administrative staff.
        </div>
      </div>
    </div>
  );
}
