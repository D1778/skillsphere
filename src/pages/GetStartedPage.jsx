import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { signup, oauthSignin, sendSignupOtp, verifySignupOtp, getMe } from '../services/api';
import AuthLayout from '../components/auth/AuthLayout';
import RoleToggle from '../components/auth/RoleToggle';
import {
  AuthInput,
  AuthButton,
  AuthError,
  SocialAuth,
} from '../components/auth/AuthFormElements';
import '../components/auth/auth.css';

/* ── Password strength ─────────────────────────── */
function getStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8)          s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}
const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors  = ['', 'weak', 'weak', 'medium', 'strong'];

export default function GetStartedPage() {
  const navigate = useNavigate();

  /* ── Role / animation ── */
  const [role, setRole]         = useState('candidate');
  const [slideDir, setSlideDir] = useState('slide-from-right');
  const [animKey, setAnimKey]   = useState(0);

  /* ── Step 0: form fields ── */
  const [fullName, setFullName] = useState('');
  const [company, setCompany]   = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [agreed, setAgreed]     = useState(false);

  /* ── Step 1: OTP ── */
  const [step, setStep]         = useState(0); // 0 = form, 1 = otp
  const [otp, setOtp]           = useState(['','','','','','']);
  const [otpError, setOtpError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef             = useRef(null);
  const inputRefs               = useRef([]);

  /* ── Shared ── */
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const strength    = getStrength(password);
  const matchStatus = confirm.length > 0 ? (password === confirm ? 'match' : 'no-match') : null;

  const handleRoleChange = (r) => {
    setSlideDir(r === 'company' ? 'slide-from-right' : 'slide-from-left');
    setAnimKey(k => k + 1);
    setRole(r);
    setError('');
  };

  /* ── Cooldown timer for resend ── */
  const startCooldown = () => {
    setCooldown(60);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  /* ── STEP 0: validate form + send OTP ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (role === 'candidate' && !fullName.trim()) return setError('Please enter your full name.');
    if (role === 'company'   && !company.trim())  return setError('Please enter your company name.');
    if (!email.trim())        return setError('Please enter your email address.');
    if (!password)            return setError('Please enter a password.');
    if (strength < 2)         return setError('Password is too weak. Use 8+ characters with numbers or symbols.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (!agreed)              return setError('You must agree to the Terms & Conditions.');

    setLoading(true);
    try {
      await sendSignupOtp(email);
      setStep(1);
      startCooldown();
      setTimeout(() => inputRefs.current[0]?.focus(), 120);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (cooldown > 0) return;
    setOtpError('');
    setOtp(['','','','','','']);
    setLoading(true);
    try {
      await sendSignupOtp(email);
      startCooldown();
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── OTP input handlers ── */
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

  /* ── STEP 1: verify OTP then create account ── */
  const handleVerifyAndCreate = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (otp.join('').length < 6) return setOtpError('Please enter all 6 digits.');

    setLoading(true);
    try {
      // Verify OTP — just email + code now, no clerkEmailAddressId
      await verifySignupOtp({ email, code: otp.join('') });

      // OTP passed — create Firebase user + MongoDB record
      await signup({
        email,
        password,
        role,
        fullName:    role === 'candidate' ? fullName : undefined,
        companyName: role === 'company'   ? company  : undefined,
      });

      const me = await getMe();
      navigate(me.role === 'candidate' && !me.profileCompleted ? '/profile-builder' : '/dashboard');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── OAuth ── */
  const handleOAuth = async (providerName) => {
    setError('');
    setLoading(true);
    try {
      const provider = providerName === 'google'
        ? new GoogleAuthProvider()
        : new GithubAuthProvider();

      const result  = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      await oauthSignin({
        idToken,
        provider: providerName,
        role,
        fullName:    role === 'candidate' ? (result.user.displayName || '') : undefined,
        companyName: role === 'company'   ? (result.user.displayName || '') : undefined,
      });

      const me = await getMe();
      navigate(me.role === 'candidate' && !me.profileCompleted ? '/profile-builder' : '/dashboard');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') { setLoading(false); return; }
      setError(err.response?.data?.message || 'OAuth sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ════════ STEP 1 — OTP verification screen ════════ */
  if (step === 1) {
    return (
      <AuthLayout backTo="/" backLabel="Back to Home">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

          <div className="auth-form-header">
            <h2 className="auth-form-title">Verify your email</h2>
            <p className="auth-form-subtitle">
              We sent a 6-digit code to<br/>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{email}</strong>
            </p>
          </div>

          <div className="auth-info-banner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Check your inbox and enter the code below.
          </div>

          <form onSubmit={handleVerifyAndCreate} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {otpError && (
              <div className="auth-error-banner" role="alert">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {otpError}
              </div>
            )}

            <div className="auth-otp-grid">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
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
              <button
                type="button"
                className="auth-resend-btn"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>

            <AuthButton type="submit" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify & Create Account'}
            </AuthButton>

            <button
              type="button"
              className="auth-back-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', alignSelf: 'center' }}
              onClick={() => { setStep(0); setOtp(['','','','','','']); setOtpError(''); }}
            >
              ← Back to sign up form
            </button>
          </form>
        </div>
      </AuthLayout>
    );
  }

  /* ════════ STEP 0 — Sign up form ════════ */
  return (
    <AuthLayout backTo="/" backLabel="Back to Home">
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>

        <RoleToggle role={role} setRole={handleRoleChange} />

        <div key={animKey} className={`auth-role-slide ${slideDir}`}>

          <div className="auth-form-header">
            <h2 className="auth-form-title">Create your account</h2>
            <p className="auth-form-subtitle">
              {role === 'candidate' ? 'Begin your AI-powered career journey.' : 'Start hiring on verified skills.'}
            </p>
          </div>

          <AuthError message={error} />

          <div className="auth-fields">

            {role === 'candidate' ? (
              <div className="auth-field-group">
                <label className="auth-label" htmlFor="signup-fullname">Full name</label>
                <AuthInput id="signup-fullname" placeholder="Aarav Mehta"
                  value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name"
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                />
              </div>
            ) : (
              <div className="auth-field-group">
                <label className="auth-label" htmlFor="signup-company">Company name</label>
                <AuthInput id="signup-company" placeholder="Nebula Labs"
                  value={company} onChange={e => setCompany(e.target.value)} autoComplete="organization"
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>}
                />
              </div>
            )}

            <div className="auth-field-group">
              <label className="auth-label" htmlFor="signup-email">Email</label>
              <AuthInput id="signup-email" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}
              />
            </div>

            <div className="auth-field-group">
              <label className="auth-label" htmlFor="signup-password">Password</label>
              <AuthInput id="signup-password" type="password" placeholder="Create a strong password"
                value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              />
              {password.length > 0 && (
                <>
                  <div className="auth-pwd-strength">
                    {[1,2,3,4].map(i => <div key={i} className={`auth-pwd-bar ${i <= strength ? strengthColors[strength] : ''}`} />)}
                  </div>
                  <p className="auth-pwd-label">{strengthLabels[strength]}</p>
                </>
              )}
            </div>

            <div className="auth-field-group">
              <label className="auth-label" htmlFor="signup-confirm">Confirm password</label>
              <AuthInput id="signup-confirm" type="password" placeholder="Re-enter your password"
                value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              />
              {matchStatus && (
                <p className={`auth-match-hint ${matchStatus}`}>
                  {matchStatus === 'match'
                    ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Passwords match</>
                    : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Passwords do not match</>
                  }
                </p>
              )}
            </div>

            <div className="auth-terms-row">
              <input id="signup-terms" type="checkbox" className="auth-checkbox"
                checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <label htmlFor="signup-terms" className="auth-terms-text">
                I agree to the <a href="#" className="auth-terms-link">Terms & Conditions</a> and <a href="#" className="auth-terms-link">Privacy Policy</a>
              </label>
            </div>
          </div>

          <AuthButton id="btn-create-account" type="submit" disabled={loading}>
            {loading ? 'Sending verification…' : 'Continue'}
          </AuthButton>

          <SocialAuth onOAuth={handleOAuth} disabled={loading} />

          <p className="auth-switch-text">
            Already have an account?{' '}
            <Link to="/signin" className="auth-switch-link">Sign in</Link>
          </p>
        </div>

      </form>
    </AuthLayout>
  );
}