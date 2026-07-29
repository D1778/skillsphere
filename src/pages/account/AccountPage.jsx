import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { signout, deleteAccount } from '../../services/api';

/* ─── Inline icons ─── */
const IconMail = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IconShield = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconLogout = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconAlertTriangle = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconX = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '—';
  }
};

const CONFIRM_WORD = 'DELETE';

export default function AccountPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [signingOut, setSigningOut] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ackChecked, setAckChecked] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => { setPhotoError(false); }, [user?.photoURL]);

  const resetDeleteState = () => {
    setAckChecked(false);
    setConfirmInput('');
    setDeleteError('');
  };

  const canDelete = ackChecked && confirmInput.trim() === CONFIRM_WORD && !deleting;

  const displayName = user?.displayName?.trim() || 'Your account';
  const initials = displayName
    .split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '—';
  const roleLabel = user?.role === 'company' ? 'Company' : 'Candidate';
  const providerLabel = { email: 'Email & password', google: 'Google', github: 'GitHub' }[user?.provider] || user?.provider;

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signout(); } catch { /* tokens are cleared locally either way */ }
    setUser(null);
    navigate('/signin');
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount(CONFIRM_WORD);
      setUser(null);
      navigate('/signin', { replace: true });
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-12">
      <div className="flex flex-col mb-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-heading)] font-sans tracking-tight leading-tight">Account</div>
        <p className="font-sans text-[0.95rem] text-[var(--text-muted)] mt-1.5 font-medium">Your account details and sign-in options.</p>
      </div>

      {/* Profile summary */}
      <div className="w-full card-glass rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[280px] h-[280px] bg-cyan-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center lg:items-start gap-3 shrink-0 text-center lg:text-left">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center overflow-hidden border border-[var(--border-card)] shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            {user?.photoURL && !photoError ? (
              <img src={user.photoURL} alt={displayName} onError={() => setPhotoError(true)} className="w-full h-full object-cover" />
            ) : (
              <span className="font-sans text-3xl sm:text-4xl font-black text-white tracking-widest drop-shadow-md">{initials}</span>
            )}
          </div>
          <div className="flex flex-col items-center lg:items-start gap-1.5">
            <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-[var(--text-heading)] tracking-tight">{displayName}</h2>
            <span className="font-sans text-[0.78rem] font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20 uppercase tracking-widest">{roleLabel}</span>
          </div>
        </div>

        {/* Info tiles — fills the rest of the row on wide screens instead
            of leaving a narrow stack of lines with empty space beside it */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full flex-1">
          <div className="flex flex-col gap-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4">
            <span className="font-sans text-[0.72rem] font-semibold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5"><IconMail /> Email</span>
            <span className="font-sans text-[0.92rem] font-medium text-[var(--text-primary)] truncate">{user?.email || '—'}</span>
          </div>
          <div className="flex flex-col gap-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4">
            <span className="font-sans text-[0.72rem] font-semibold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5"><IconShield /> Signed in with</span>
            <span className="font-sans text-[0.92rem] font-medium text-[var(--text-primary)]">
              {providerLabel || '—'}{user?.isVerified && <span className="text-emerald-400 font-semibold ml-2">· Verified</span>}
            </span>
          </div>
          <div className="flex flex-col gap-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4">
            <span className="font-sans text-[0.72rem] font-semibold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5"><IconCalendar /> Member since</span>
            <span className="font-sans text-[0.92rem] font-medium text-[var(--text-primary)]">{formatDate(user?.createdAt)}</span>
          </div>
          <div className="flex flex-col gap-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4">
            <span className="font-sans text-[0.72rem] font-semibold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5"><IconShield /> Account type</span>
            <span className="font-sans text-[0.92rem] font-medium text-[var(--text-primary)]">{roleLabel}</span>
          </div>
        </div>
      </div>

      {/* Sign out + Delete account — side by side so wide screens don't
          leave a half-empty stacked column */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="card-glass rounded-2xl p-6 md:p-8 flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-sans text-[1rem] font-semibold text-[var(--text-primary)]">Sign out</h3>
            <p className="font-sans text-[0.85rem] text-[var(--text-muted)] mt-1">You'll need to sign in again to access your account.</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="self-start flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[var(--text-primary)] font-sans text-[0.85rem] font-semibold hover:border-[var(--border-hover)] transition-all active:scale-95 disabled:opacity-60"
          >
            <IconLogout /> {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl p-6 md:p-8 flex flex-col justify-between gap-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="flex items-start gap-3">
            <span className="text-red-400 shrink-0 mt-0.5"><IconAlertTriangle /></span>
            <div>
              <h3 className="font-sans text-[1rem] font-bold text-red-300">Delete account</h3>
              <p className="font-sans text-[0.85rem] text-[var(--text-secondary)] mt-1 leading-relaxed">
                Permanently deletes your account, your profile, and all associated data. This cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={() => { resetDeleteState(); setShowDeleteModal(true); }}
            className="self-start flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 font-sans text-[0.85rem] font-bold hover:bg-red-500/25 hover:text-red-200 transition-all active:scale-95"
          >
            <IconTrash /> Delete account
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => { if (!deleting) setShowDeleteModal(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 md:p-7 flex flex-col gap-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.35)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-red-400 shrink-0"><IconAlertTriangle /></span>
                <h3 className="font-sans text-[1.05rem] font-bold text-red-300">Delete account</h3>
              </div>
              <button
                onClick={() => { if (!deleting) setShowDeleteModal(false); }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-md hover:bg-[var(--bg-card-hover)]"
                aria-label="Close"
              >
                <IconX />
              </button>
            </div>

            <p className="font-sans text-[0.88rem] text-[var(--text-secondary)] leading-relaxed">
              This permanently deletes your account, your profile, and all associated data. This cannot be
              undone and there is no way to recover it afterward.
            </p>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ackChecked}
                onChange={(e) => setAckChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-red-500 cursor-pointer shrink-0"
              />
              <span className="font-sans text-[0.85rem] text-[var(--text-secondary)]">
                I understand this will permanently delete my account and all my data, and that this action cannot be undone.
              </span>
            </label>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-delete-input" className="font-sans text-[0.8rem] font-semibold text-[var(--text-muted)]">
                Type <span className="text-red-300 font-bold">DELETE</span> to confirm
              </label>
              <input
                id="confirm-delete-input"
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                autoFocus
                className="w-full bg-[var(--bg-card-hover)] border border-red-500/30 rounded-lg px-4 py-2.5 text-[0.9rem] text-[var(--text-primary)] placeholder-[var(--text-muted)] font-sans focus:outline-none focus:border-red-500/60 transition-all shadow-inner"
              />
            </div>

            {deleteError && (
              <p className="font-sans text-[0.82rem] text-red-300">{deleteError}</p>
            )}

            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-5 py-2.5 rounded-lg bg-transparent border border-[var(--border-card)] text-[var(--text-secondary)] font-sans text-[0.85rem] font-semibold hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!canDelete}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 font-sans text-[0.85rem] font-bold hover:bg-red-500/25 hover:text-red-200 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-500/15 disabled:hover:text-red-300"
              >
                <IconTrash /> {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}