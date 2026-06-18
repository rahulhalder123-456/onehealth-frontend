import { useRef, useState } from 'react';
import { authApi, setToken } from '../services/api';

export default function Login({ onLoginSuccess, showNotification }) {
  const [email, setEmail] = useState('sarah.carter@onehealth.com');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpRefs = [
    useRef(null), useRef(null), useRef(null),
    useRef(null), useRef(null), useRef(null),
  ];

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authApi.sendOtp(email);
      setOtpSent(true);
      showNotification({
        title: 'OTP Sent',
        message: 'Check your email or use the development code.',
        code: result.devCode,
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    const code = otpValues.join('');
    if (code.length !== 6) {
      setError('Please enter the full 6-digit OTP code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await authApi.verifyOtp(email, code);
      setToken(result.accessToken);
      onLoginSuccess(result.doctor);
    } catch (requestError) {
      setError(requestError.message);
      setOtpValues(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;
    const nextValues = [...otpValues];
    nextValues[index] = value.slice(-1);
    setOtpValues(nextValues);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  };

  return (
    <div className="login-container fade-in">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand-wrap">
            <div className="login-brand-icon">+</div>
            <span className="login-logo">One<span>Health</span></span>
          </div>
          <p className="login-tagline">Doctor Portal | Tanaya | Andro | Ritefood</p>
          <div className="login-divider" />
        </div>

        {error && <div className="login-info-box" style={{ color: '#dc2626' }}>{error}</div>}

        {!otpSent ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">Enter Clinical Email Address</label>
              <input id="email-input" type="email" className="form-input" value={email}
                onChange={(event) => setEmail(event.target.value)} disabled={loading} required autoFocus />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Request OTP Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>
                OTP sent to <strong>{email}</strong>
              </label>
              <div className="otp-inputs-row">
                {otpValues.map((value, index) => (
                  <input key={index} className="otp-box" inputMode="numeric" value={value}
                    ref={otpRefs[index]} onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Backspace' && !value && index > 0) otpRefs[index - 1].current?.focus();
                    }}
                    disabled={loading} autoFocus={index === 0} />
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Authenticating...' : 'Verify & Log In'}
            </button>
            <button type="button" className="login-switch-link" onClick={() => setOtpSent(false)}>
              Change Email Address
            </button>
          </form>
        )}

        <div className="login-info-box">
          Doctors are pre-registered by OneHealth administrators. Development login uses OTP <strong>123456</strong>.
        </div>
      </div>
    </div>
  );
}
