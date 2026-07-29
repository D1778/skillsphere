import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../../config/firebase'; // your Firebase client config
import { signin, oauthSignin, getMe } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import RoleToggle from '../../components/auth/RoleToggle';
import {
  AuthInput,
  AuthButton,
  AuthError,
  SocialAuth,
} from '../../components/auth/AuthFormElements';
import '../../components/auth/auth.css';

export default function SignInPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [role, setRole]         = useState('candidate');
  const [slideDir, setSlideDir] = useState('slide-from-right');
  const [animKey, setAnimKey]   = useState(0);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleRoleChange = (r) => {
    setSlideDir(r === 'company' ? 'slide-from-right' : 'slide-from-left');
    setAnimKey(k => k + 1);
    setRole(r);
    setError('');
  };

  /* ── Email / password signin ─────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Please enter your email address.');
    if (!password)     return setError('Please enter your password.');

    setLoading(true);
    try {
      // Step 1: Firebase validates the password and gives us an ID token
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken    = await credential.user.getIdToken();

      // Step 2: Exchange the Firebase token for our own JWT pair
      await signin({ idToken, role });

      const me = await getMe();
      setUser(me); // tell AuthContext someone just signed in, or ProtectedRoute
                    // will still see the old (signed-out) state and bounce back
      if (me.role === 'candidate') {
        navigate(me.profileCompleted ? '/dashboard/candidate' : '/profile-builder');
      } else {
        navigate('/dashboard/company');
      }
    } catch (err) {
      // Firebase errors
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        // Backend AppError message
        setError(err.response?.data?.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── OAuth ───────────────────────────────────── */
  const handleOAuth = async (providerName) => {
    setError('');
    setLoading(true);
    try {
      const provider = providerName === 'google'
        ? new GoogleAuthProvider()
        : new GithubAuthProvider();

      const result  = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      await oauthSignin({ idToken, provider: providerName, role });

      const me = await getMe();
      setUser(me);
      if (me.role === 'candidate') {
        navigate(me.profileCompleted ? '/dashboard/candidate' : '/profile-builder');
      } else {
        navigate('/dashboard/company');
      }
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return;
      }
      setError(err.response?.data?.message || 'OAuth sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout backTo="/" backLabel="Back to Home">
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>

        <RoleToggle role={role} setRole={handleRoleChange} />

        <div key={animKey} className={`auth-role-slide ${slideDir}`}>

          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-subtitle">
              {role === 'candidate'
                ? 'Sign in to continue your journey.'
                : 'Sign in to manage your talent pipeline.'}
            </p>
          </div>

          <AuthError message={error} />

          <div className="auth-fields">
            <div className="auth-field-group">
              <label className="auth-label" htmlFor="signin-email">Email</label>
              <AuthInput id="signin-email" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}
              />
            </div>

            <div className="auth-field-group">
              <div className="auth-pwd-row">
                <label className="auth-label" htmlFor="signin-password">Password</label>
                <Link to="/forgot-password" className="auth-forgot-link">Forgot password?</Link>
              </div>
              <AuthInput id="signin-password" type="password" placeholder="Enter your password"
                value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              />
            </div>

            <div className="auth-remember-row">
              <input id="signin-remember" type="checkbox" className="auth-checkbox"
                checked={remember} onChange={e => setRemember(e.target.checked)} />
              <label htmlFor="signin-remember" className="auth-remember-label">Remember me</label>
            </div>
          </div>

          <AuthButton id="btn-signin" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </AuthButton>

          <SocialAuth onOAuth={handleOAuth} disabled={loading} />

          <p className="auth-switch-text">
            Don't have an account?{' '}
            <Link to="/get-started" className="auth-switch-link">Create one</Link>
          </p>
        </div>

      </form>
    </AuthLayout>
  );
}