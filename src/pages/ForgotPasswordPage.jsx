import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useTheme from '../hooks/useTheme';
import { Logo } from '../components/auth/AuthLayout';
import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
} from '../services/api';
import '../components/auth/auth.css';

/* ─── Lock icon avatar ─── */
function LockAvatar() {
  return (
    <div className="auth-icon-avatar">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Step 0 = email, Step 1 = OTP, Step 2 = new password
  const [step, setStep]             = useState(0);
  const [email, setEmail]           = useState('');
  const [emailError, setEmailError] = useState('');
  const [sending, setSending]       = useState(false);

  // Stored between steps
  const [resetToken, setResetToken] = useState(null);

  const [otp, setOtp]             = useState(['','','','','','']);
  const [otpError, setOtpError]   = useState('');
  const [verifying, setVerifying] = useState(false);

  const [newPassword, setNewPassword]   = useState('');
  const [confirmPwd, setConfirmPwd]     = useState('');
  const [pwdError, setPwdError]         = useState('');
  const [resetting, setResetting]       = useState(false);
  const [resetDone, setResetDone]       = useState(false);

  const [cooldown, setCooldown] = useState(0);
  const cooldownRef             = useRef(null);
  const inputRefs               = useRef([]);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const startCooldown = () => {
    setCooldown(60);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  /* ── Step 0: Send OTP ─────────────────────────── */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setEmailError('');
    if (!email.trim()) return setEmailError('Please enter your email address.');
    if (!/\S+@\S+\.\S+/.test(email)) return setEmailError('Please enter a valid email address.');

    setSending(true);
    try {
      await sendForgotPasswordOtp(email.trim().toLowerCase());
      // Always move to OTP step regardless (anti-enumeration)
      setStep(1);
      startCooldown();
      setTimeout(() => inputRefs.current[0]?.focus(), 120);
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSending(false);
    }
  };

  /* ── Resend OTP ────────────────────────────────── */
  const handleResend = async () => {
    if (cooldown > 0) return;
    setOtp(['','','','','','']);
    setOtpError('');
    try {
      await sendForgotPasswordOtp(email.trim().toLowerCase());
      startCooldown();
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  /* ── Step 1: Verify OTP ────────────────────────── */
  const handleVerify = async (e) => {
    e.preventDefault();
    setOtpError('');
    const code = otp.join('');
    if (code.length < 6) return setOtpError('Please enter all 6 digits.');

    setVerifying(true);
    try {
      // Just email + code now, no clerkEmailAddressId
      const data = await verifyForgotPasswordOtp({ email, code });
      setResetToken(data.resetToken);
      setStep(2);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  /* ── Step 2: Reset password ────────────────────── */
  const handleReset = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (!newPassword)               return setPwdError('Please enter a new password.');
    if (newPassword.length < 8)     return setPwdError('Password must be at least 8 characters.');
    if (newPassword !== confirmPwd) return setPwdError('Passwords do not match.');
    if (!resetToken)                return setPwdError('Reset session expired. Please start over.');

    setResetting(true);
    try {
      await resetPassword({ resetToken, newPassword });
      setResetDone(true);
      setTimeout(() => navigate('/signin'), 2500);
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Password reset failed. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  /* ── OTP input helpers ─────────────────────────── */
  const handleOtpChange = (i, val) => {
    const d = val.replace(/\D/, '');
    const next = [...otp]; next[i] = d; setOtp(next);
    if (d && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6).split('');
    if (pasted.length) {
      const next = [...otp];
      pasted.forEach((d, i) => { if (i < 6) next[i] = d; });
      setOtp(next);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  /* ── Shared UI pieces ──────────────────────────── */
  const Topbar = ({ onBack, backLabel }) => (
    <div className="auth-topbar">
      <button onClick={onBack} className="auth-back-link"
        style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        {backLabel}
      </button>
      <button onClick={toggleTheme} className="auth-theme-toggle" aria-label="Toggle theme">
        {isDark ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>
    </div>
  );

  const LogoBlock = () => (
    <div className="auth-logo-block">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
        <Logo size={40} />
        <span style={{
          fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          fontFamily: "'Outfit', system-ui, sans-serif",
        }}>
          Skill<span style={{
            backgroundImage: 'linear-gradient(90deg,#22d3ee,#818cf8,#f472b6,#22d3ee)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 4s linear infinite',
          }}>Sphere</span>
        </span>
      </div>
    </div>
  );

  /* ══════════ STEP 0 — Email ══════════ */
  if (step === 0) return (
    <div className="auth-root">
      <Topbar onBack={() => navigate('/signin')} backLabel="Back to Login"/>
      <div className="auth-center">
        <div className="auth-card" style={{ maxWidth: '420px' }}>
          <LogoBlock />
          <LockAvatar/>
          <div className="auth-form-header">
            <h2 className="auth-form-title">Forgot Password?</h2>
            <p className="auth-form-subtitle">Enter your email and we'll send you an OTP</p>
          </div>
          <form onSubmit={handleSendOtp} noValidate style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
            {emailError && (
              <div className="auth-error-banner">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {emailError}
              </div>
            )}
            <div className="auth-field-group">
              <label className="auth-label" htmlFor="forgot-email">Email Address</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input id="forgot-email" type="email" className="auth-input"
                  placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} autoComplete="email"/>
              </div>
            </div>
            <button type="submit" className="auth-btn-primary" disabled={sending}>
              {sending ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
          <p className="auth-switch-text">
            Remember your password?{' '}
            <Link to="/signin" className="auth-switch-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );

  /* ══════════ STEP 1 — OTP ══════════ */
  if (step === 1) return (
    <div className="auth-root">
      <Topbar
        onBack={() => { setStep(0); setOtp(['','','','','','']); setOtpError(''); }}
        backLabel="Back"
      />
      <div className="auth-center">
        <div className="auth-card" style={{ maxWidth: '420px' }}>
          <LogoBlock />
          <LockAvatar/>
          <div className="auth-form-header">
            <h2 className="auth-form-title">Verify OTP</h2>
            <p className="auth-form-subtitle">
              We've sent a 6-digit code to<br/>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{email}</strong>
            </p>
          </div>

          <div className="auth-info-banner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            OTP sent to your email
          </div>

          <form onSubmit={handleVerify} noValidate style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {otpError && (
              <div className="auth-error-banner">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {otpError}
              </div>
            )}
            <div className="auth-otp-grid">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => (inputRefs.current[i] = el)}
                  type="text" inputMode="numeric" maxLength={1}
                  className={`auth-otp-input ${digit ? 'filled' : ''}`}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)}
                  onPaste={handlePaste}
                  autoComplete="one-time-code"
                />
              ))}
            </div>
            <div className="auth-resend-row">
              Didn't receive the code?{' '}
              <button type="button" className="auth-resend-btn"
                onClick={handleResend} disabled={cooldown > 0}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
            <button type="submit" className="auth-btn-primary" disabled={verifying}>
              {verifying ? 'Verifying…' : 'Verify & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  /* ══════════ STEP 2 — New Password ══════════ */
  return (
    <div className="auth-root">
      <Topbar
        onBack={() => { setStep(1); setPwdError(''); setNewPassword(''); setConfirmPwd(''); }}
        backLabel="Back"
      />
      <div className="auth-center">
        <div className="auth-card" style={{ maxWidth: '420px' }}>
          <LogoBlock />
          <LockAvatar/>
          <div className="auth-form-header">
            <h2 className="auth-form-title">Set New Password</h2>
            <p className="auth-form-subtitle">Choose a strong password for your account</p>
          </div>

          {resetDone && (
            <div className="auth-success-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Password reset! Redirecting to sign in…
            </div>
          )}

          <form onSubmit={handleReset} noValidate style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
            {pwdError && (
              <div className="auth-error-banner">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {pwdError}
              </div>
            )}
            <div className="auth-field-group">
              <label className="auth-label" htmlFor="new-password">New Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input id="new-password" type="password" className="auth-input"
                  placeholder="8+ characters"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"/>
              </div>
            </div>
            <div className="auth-field-group">
              <label className="auth-label" htmlFor="confirm-password">Confirm Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input id="confirm-password" type="password" className="auth-input"
                  placeholder="Re-enter your password"
                  value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                  autoComplete="new-password"/>
              </div>
            </div>
            <button type="submit" className="auth-btn-primary" disabled={resetting || resetDone}>
              {resetting ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}