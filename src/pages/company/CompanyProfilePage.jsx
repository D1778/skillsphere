import React, { useState, useRef, useEffect } from 'react';
import { LogoMark } from '../../components/shared/Topbar';
import { useAuth } from '../../context/AuthContext';
import { updateMe, uploadUserPhoto, removeUserPhoto } from '../../services/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// photoURL may be a relative "/uploads/xxx.png" path from our own backend,
// or an absolute OAuth avatar URL — only prefix the relative kind.
const fileUrl = (path) => (path ? (/^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`) : null);

// Icons
const IconUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconEdit2 = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
  </svg>
);
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconLinkedin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
);
const IconTwitter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);
const IconCamera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const ProfileField = ({ label, value, isEditing, children, colSpan = 1 }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${!isEditing ? 'bg-[var(--card-inner-bg)] border border-[var(--border-card)] p-4 rounded-xl' : ''} ${colSpan === 2 ? 'md:col-span-2' : ''}`}>
      <label className={`font-sans text-[0.75rem] font-semibold uppercase tracking-widest ${!isEditing ? 'text-indigo-400/80' : 'text-[var(--text-primary)] mb-1.5'}`}>{label}</label>
      {isEditing ? children : <p className="font-sans text-[0.95rem] font-medium text-[var(--text-primary)] whitespace-pre-wrap">{value || '—'}</p>}
    </div>
  );
};

export default function CompanyProfilePage() {
  const { user, setUser } = useAuth();

  const [activeSection, setActiveSection] = useState('account');
  const [isEditing, setIsEditing] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef(null);
  const handlePhotoClick = () => fileInputRef.current?.click();

  // Previously this only did setProfileImage(URL.createObjectURL(file)) —
  // a local, in-memory preview that never touched the backend. It looked
  // like it worked (the picture changed on screen) but nothing was ever
  // uploaded or saved, so a refresh — or another visit — always showed
  // the old logo again. Now it actually uploads the file and updates the
  // shared user object so the new logo persists.
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setPhotoError('');
    try {
      const updatedUser = await uploadUserPhoto(file);
      setUser(updatedUser);
    } catch (err) {
      setPhotoError(err.response?.data?.message || 'Could not upload photo. Please try again.');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  // Clears the logo entirely — the avatar then falls back to the
  // company-initials placeholder, same as before any logo was ever set.
  const handleRemovePhoto = async (e) => {
    e.stopPropagation(); // don't also trigger handlePhotoClick on the parent
    setPhotoUploading(true);
    setPhotoError('');
    try {
      const updatedUser = await removeUserPhoto();
      setUser(updatedUser);
    } catch (err) {
      setPhotoError(err.response?.data?.message || 'Could not remove photo. Please try again.');
    } finally {
      setPhotoUploading(false);
    }
  };

  // Company Name + Social Links are the only editable fields left on this
  // page. Social links start empty on purpose — signup never collects
  // them, so there's nothing to prefill until the company adds them here.
  const [formData, setFormData] = useState({ companyName: '', linkedin: '', twitter: '' });

  // Keep the form in sync with whatever's actually saved, and reset it
  // to that same baseline whenever editing is cancelled.
  const syncFromUser = () => {
    setFormData({
      companyName: user?.displayName || '',
      linkedin:    user?.socialLinks?.linkedin || '',
      twitter:     user?.socialLinks?.twitter  || '',
    });
  };
  useEffect(() => { syncFromUser(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const [showToast, setShowToast] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const sections = [
    { id: 'account', title: 'Account Settings', icon: IconLock,  color: 'text-indigo-400', bg: 'bg-indigo-500' },
    { id: 'social',  title: 'Social Links',      icon: IconUsers, color: 'text-sky-400',    bg: 'bg-sky-500' },
  ];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCancel = () => {
    syncFromUser();
    setSaveError('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const updated = await updateMe({
        companyName: formData.companyName,
        socialLinks: { linkedin: formData.linkedin, twitter: formData.twitter },
      });
      setUser(updated);
      setIsEditing(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const InputWrapper = ({ icon, children }) => (
    <div className="relative group w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-secondary)] group-focus-within:text-purple-500 transition-colors z-10">
        {icon}
      </div>
      {children}
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-6 pb-12">

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-24 right-6 sm:right-10 z-[200] animate-[fade-in_0.3s_ease-out] bg-[var(--bg-card)] border border-[var(--border-card)] px-4 py-3 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-[var(--text-primary)] font-bold text-sm font-sans m-0 leading-tight">Profile Saved!</h4>
              <p className="text-[var(--text-secondary)] text-xs font-sans m-0 mt-0.5">Your company details have been updated.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 mt-0">
          <div className="flex flex-col">
            <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-sans flex items-center gap-2 tracking-tight leading-tight">
              Company Profile
            </div>
            <p className="font-sans text-[0.95rem] text-[var(--text-secondary)] mt-1.5 font-medium">Manage your company details and public presence.</p>
          </div>
        </div>

        {/* Top Banner - Glassmorphic */}
        <div className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden group shadow-sm">
          {/* Decorative glowing blobs */}
          <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          <div className="relative z-10 shrink-0 group/avatar cursor-pointer" onClick={handlePhotoClick}>
            <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/jpeg,image/png,image/webp" />
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)] overflow-hidden border border-[var(--border-card)] relative transition-transform duration-300 group-hover/avatar:scale-105">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
               {photoUploading ? (
                 <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin relative z-10" />
               ) : user?.photoURL ? (
                 <img src={fileUrl(user.photoURL)} alt="Company Logo" className="w-full h-full object-cover relative z-10" />
               ) : (
                 <span className="font-sans text-3xl sm:text-4xl font-black text-white tracking-widest drop-shadow-md relative z-10">
                   {formData.companyName ? formData.companyName.substring(0, 2).toUpperCase() : 'CO'}
                 </span>
               )}
            </div>
            <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-purple-400 border border-purple-500/30 shadow-[0_4px_12px_rgba(168,85,247,0.2)] hover:bg-purple-500/20 hover:text-purple-300 transition-all z-20">
              <IconCamera />
            </div>
            {user?.photoURL && !photoUploading && (
              <button
                onClick={handleRemovePhoto}
                title="Remove logo"
                className="absolute top-0 right-0 w-7 h-7 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-red-400 border border-red-500/30 shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:bg-red-500/20 hover:text-red-300 transition-all z-20"
              >
                <IconTrash />
              </button>
            )}
          </div>
          {photoError && (
            <p className="absolute z-20 top-2 left-2 sm:left-auto sm:right-2 font-sans text-[0.72rem] text-red-300 bg-red-500/10 border border-red-500/25 px-2.5 py-1 rounded-lg">{photoError}</p>
          )}

          <div className="relative z-10 flex flex-col items-center sm:items-start gap-1 mt-2 text-center sm:text-left flex-1">
            <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight drop-shadow-sm">{formData.companyName || 'Company Name'}</h2>
            <p className="font-sans text-[0.85rem] text-[var(--text-secondary)] mt-1 flex items-center gap-1.5 justify-center sm:justify-start font-medium">
              <span><IconMail /></span> {user?.email || '—'}
            </p>
          </div>

          <div className="relative z-10 hidden lg:flex flex-col items-end gap-2 self-center mr-2">
             <div className="text-right">
               <div className="font-sans text-[0.75rem] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">Status</div>
               <div className="flex items-center gap-2 font-sans text-[0.85rem] font-semibold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div> Active
               </div>
             </div>
          </div>
        </div>

        {/* Tab Navigation Row */}
        <div className="w-full flex items-center gap-4 mb-2">
          <div className="flex flex-wrap items-center gap-2 w-full">
            {sections.map(section => {
              const isActive = activeSection === section.id;
              const isDisabled = isEditing && !isActive;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    if (!isEditing) setActiveSection(section.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-sans text-[0.85rem] font-bold transition-all duration-300 shrink-0 ${
                    isActive
                      ? `${section.bg} text-white shadow-md`
                      : `bg-[var(--card-inner-bg)] text-[var(--text-primary)] border border-[var(--border-card)] ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg-card)] hover:border-purple-500/30'}`
                  }`}
                >
                  <span className={`transition-colors duration-300 scale-90 ${isActive ? 'text-white' : section.color}`}>
                    <section.icon />
                  </span>
                  {section.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full">

          {/* Section 1: Account Settings — just Company Name + Contact
              Email now. Password lives with Firebase auth (forgot-password
              flow), not here, so it's gone; Contact Email is the sign-in
              email itself and isn't editable from this page. */}
          {activeSection === 'account' && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 sm:p-8 shadow-sm animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-card)] relative z-10">
                 <h3 className="text-lg font-bold text-[var(--text-primary)] font-sans flex items-center gap-2">
                   <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20"><IconLock /></div> Account Settings
                 </h3>
                 <div className="flex items-center gap-3">
                   {saveError && <span className="font-sans text-[0.78rem] text-red-400">{saveError}</span>}
                   {isEditing ? (
                      <>
                        <button onClick={handleCancel} disabled={saving} className="px-3 py-1.5 rounded-lg bg-transparent border border-[var(--border-card)] text-[var(--text-secondary)] font-sans text-[0.8rem] font-semibold hover:bg-[var(--card-inner-bg)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500 text-white font-sans text-[0.8rem] font-semibold shadow-md hover:bg-indigo-600 transition-all disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
                      </>
                   ) : (
                      <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-sans font-bold text-[0.8rem] border border-indigo-500/20 hover:bg-indigo-500/20 transition-all">Edit <IconEdit2/></button>
                   )}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <ProfileField label="Company Name" value={formData.companyName} isEditing={isEditing}>
                  <InputWrapper icon={<IconBuilding />}>
                    <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full bg-[var(--card-inner-bg)] border border-[var(--border-card)] rounded-xl pl-11 pr-4 py-3 text-[var(--text-primary)] font-sans text-[0.95rem] focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/60 transition-all" />
                  </InputWrapper>
                </ProfileField>
                <div className="flex flex-col gap-1.5 bg-[var(--card-inner-bg)] border border-[var(--border-card)] p-4 rounded-xl">
                  <label className="font-sans text-[0.75rem] font-semibold uppercase tracking-widest text-indigo-400/80">Contact Email</label>
                  <p className="font-sans text-[0.95rem] font-medium text-[var(--text-primary)] flex items-center gap-2">
                    <span className="text-[var(--text-muted)]"><IconMail /></span> {user?.email || '—'}
                  </p>
                  <p className="font-sans text-[0.72rem] text-[var(--text-muted)] mt-0.5">This is your sign-in email and can't be changed here.</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Social Links — empty until the company fills them
              in; signup never collects these. */}
          {activeSection === 'social' && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 sm:p-8 shadow-sm animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-card)] relative z-10">
                 <h3 className="text-lg font-bold text-[var(--text-primary)] font-sans flex items-center gap-2">
                   <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20"><IconUsers /></div> Social Links
                 </h3>
                 <div className="flex items-center gap-3">
                   {saveError && <span className="font-sans text-[0.78rem] text-red-400">{saveError}</span>}
                   {isEditing ? (
                      <>
                        <button onClick={handleCancel} disabled={saving} className="px-3 py-1.5 rounded-lg bg-transparent border border-[var(--border-card)] text-[var(--text-secondary)] font-sans text-[0.8rem] font-semibold hover:bg-[var(--card-inner-bg)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500 text-white font-sans text-[0.8rem] font-semibold shadow-md hover:bg-sky-600 transition-all disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
                      </>
                   ) : (
                      <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-500 dark:text-sky-400 font-sans font-bold text-[0.8rem] border border-sky-500/20 hover:bg-sky-500/20 transition-all">Edit <IconEdit2/></button>
                   )}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <ProfileField label="LinkedIn Profile" value={formData.linkedin} isEditing={isEditing}>
                  <InputWrapper icon={<span className="text-[#0077b5]"><IconLinkedin /></span>}>
                    <input type="text" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="linkedin.com/company/yourcompany" className="w-full bg-[var(--card-inner-bg)] border border-[var(--border-card)] rounded-xl pl-11 pr-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] font-sans text-[0.95rem] focus:outline-none focus:border-[#0077b5]/60 focus:ring-2 focus:ring-[#0077b5]/60 transition-all" />
                  </InputWrapper>
                </ProfileField>
                <ProfileField label="Twitter Profile" value={formData.twitter} isEditing={isEditing}>
                  <InputWrapper icon={<span className="text-[#1DA1F2]"><IconTwitter /></span>}>
                    <input type="text" name="twitter" value={formData.twitter} onChange={handleChange} placeholder="@yourcompany" className="w-full bg-[var(--card-inner-bg)] border border-[var(--border-card)] rounded-xl pl-11 pr-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] font-sans text-[0.95rem] focus:outline-none focus:border-[#1DA1F2]/60 focus:ring-2 focus:ring-[#1DA1F2]/60 transition-all" />
                  </InputWrapper>
                </ProfileField>
              </div>
            </div>
          )}

        </div>

        {/* AI Floating Action Button */}
        <button className="fixed bottom-8 right-8 w-14 h-14 bg-[var(--bg-card)] border border-[#22d3ee]/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105 transition-transform z-[100] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]">
          <div className="scale-125">
            <LogoMark />
          </div>
        </button>

      </div>
  );
}