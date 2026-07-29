import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobsContext';
import { getPublicJob, getProfile } from '../../services/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const fileUrl = (path) => (path ? (/^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`) : null);

// Falls back to the emoji placeholder if the logo URL 404s or the file
// is otherwise unreachable, instead of showing the browser's broken-image icon.
function CompanyLogo({ url, name, className }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <span className={className}>🏢</span>;
  return <img src={fileUrl(url)} alt={name} className={className} onError={() => setFailed(true)} />;
}

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const IconCheck = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
const IconFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);

const RESET_DELAY = 300;

export default function ApplicationModal({ isOpen, onClose, jobId }) {
  const { user } = useAuth();
  const { applyToJob } = useJobs();

  const [step, setStep] = useState(0); // 0: details, 1: consent/resume, 2: form, 3: success
  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState('');
  const [profile, setProfile] = useState(null);

  const [consent, setConsent] = useState(false);
  const [shareProfile, setShareProfile] = useState(true);
  const [resumeFile, setResumeFile] = useState(null);

  const [phone, setPhone] = useState('');
  const [relocate, setRelocate] = useState(null);
  const [noticePeriod, setNoticePeriod] = useState('Immediate Joiner');
  const [pitch, setPitch] = useState('');
  const [topChoice, setTopChoice] = useState(false);
  const [followCompany, setFollowCompany] = useState(true);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const noticeOptions = ['Immediate Joiner', '15 Days', '30 Days', '60+ Days'];

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setStep(0); setConsent(false); setErrors({}); setSubmitError('');
      setResumeFile(null); setShareProfile(true);
    }, RESET_DELAY);
  };

  // Load the job (with company info + attachments) and the candidate's
  // profile as soon as the modal opens.
  useEffect(() => {
    if (!isOpen || !jobId) return;
    setJobLoading(true);
    setJobError('');
    Promise.all([getPublicJob(jobId), getProfile().catch(() => null)])
      .then(([jobData, profileData]) => {
        setJob(jobData);
        setProfile(profileData);
        setPhone(profileData?.personal?.phone?.replace(/\D/g, '').slice(-10) || '');
      })
      .catch((err) => setJobError(err.response?.data?.message || 'Could not load this job.'))
      .finally(() => setJobLoading(false));
  }, [isOpen, jobId]);

  const handleSubmit = async () => {
    const newErrors = {};
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (relocate === null) newErrors.relocate = 'Please answer this question';
    if (!pitch.trim()) newErrors.pitch = 'Cover letter is required';
    if (!followCompany) newErrors.followCompany = 'Please tick this box';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitError('');
    setSubmitting(true);
    try {
      await applyToJob(
        jobId,
        {
          consent: true,
          shareProfileAsResume: !resumeFile && shareProfile,
          phone,
          relocate,
          noticePeriod,
          pitch,
          topChoice,
          followCompany,
        },
        resumeFile
      );
      setStep(3);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Could not submit your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const companyName = job?.company?.name || 'the company';
  const isExpired = job?.isExpired;
  const alreadyApplied = job?.hasApplied;
  const profileComplete = !!user?.profileCompleted;
  const canProceedFromConsent = consent && (resumeFile || shareProfile);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={resetAndClose}>
      <div
        className={`relative w-full transition-all duration-300 ${step === 3 ? 'max-w-[440px] bg-[var(--bg-card)] dark:bg-[#050810]' : 'max-w-[560px] bg-[var(--bg-card)] dark:bg-[#0b101e]'} rounded-2xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.6)] border border-[var(--border-card)] overflow-hidden max-h-[90vh]`}
        onClick={e => { e.stopPropagation(); setIsDropdownOpen(false); }}
      >

        {jobLoading && (
          <div className="p-10 flex items-center justify-center text-[var(--text-secondary)] font-sans text-sm">Loading job details…</div>
        )}

        {!jobLoading && jobError && (
          <div className="p-8 flex flex-col gap-4">
            <p className="font-sans text-[0.9rem] text-red-400">{jobError}</p>
            <button onClick={resetAndClose} className="self-end font-sans text-[0.85rem] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Close</button>
          </div>
        )}

        {!jobLoading && !jobError && job && (
          <>
            {/* STEP 0: JOB & COMPANY DETAILS */}
            {step === 0 && (
              <div className="p-6 md:p-8 flex flex-col overflow-y-auto no-scrollbar">
                <button className="absolute top-4 right-4 bg-transparent border-none text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-xl font-bold cursor-pointer" onClick={resetAndClose}>✕</button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl overflow-hidden shrink-0 border border-[var(--border-card)]">
                    <CompanyLogo url={job.company?.logoUrl} name={companyName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="font-sans text-[1.1rem] font-bold text-[var(--text-heading)]">{job.title}</h2>
                    <p className="font-sans text-[0.85rem] text-[var(--text-secondary)]">{companyName}</p>
                  </div>
                </div>

                {job.jobSummary && (
                  <p className="font-sans text-[0.85rem] text-[var(--text-secondary)] leading-relaxed mb-4">{job.jobSummary}</p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-5 font-sans text-[0.8rem]">
                  <div className="bg-[var(--bg-panel)] border border-[var(--border-card)] rounded-lg px-3 py-2">
                    <span className="block text-[var(--text-muted)] text-[0.7rem] uppercase tracking-wide mb-0.5">Employment</span>
                    <span className="text-[var(--text-primary)] font-semibold">{job.employmentType}</span>
                  </div>
                  <div className="bg-[var(--bg-panel)] border border-[var(--border-card)] rounded-lg px-3 py-2">
                    <span className="block text-[var(--text-muted)] text-[0.7rem] uppercase tracking-wide mb-0.5">Workplace</span>
                    <span className="text-[var(--text-primary)] font-semibold">{job.workplaceType}</span>
                  </div>
                  <div className="bg-[var(--bg-panel)] border border-[var(--border-card)] rounded-lg px-3 py-2 col-span-2">
                    <span className="block text-[var(--text-muted)] text-[0.7rem] uppercase tracking-wide mb-0.5">Application deadline</span>
                    <span className={`font-semibold ${isExpired ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
                      {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Open'}
                      {isExpired && ' — closed'}
                    </span>
                  </div>
                </div>

                {(job.attachments?.jobDescriptionPdf?.url || job.attachments?.companyBrochurePdf?.url) && (
                  <div className="flex flex-col gap-2 mb-6">
                    <span className="font-sans text-[0.7rem] font-bold text-[var(--text-muted)] tracking-widest uppercase">Attachments</span>
                    {job.attachments?.jobDescriptionPdf?.url && (
                      <a href={fileUrl(job.attachments.jobDescriptionPdf.url)} target="_blank" rel="noreferrer" download
                        className="flex items-center justify-between gap-2 bg-[var(--bg-panel)] border border-[var(--border-card)] rounded-lg px-3 py-2 hover:border-cyan-500/50 transition-colors group">
                        <span className="flex items-center gap-2 font-sans text-[0.85rem] text-[var(--text-primary)] truncate"><IconFile /> {job.attachments.jobDescriptionPdf.originalName || 'Job description.pdf'}</span>
                        <span className="text-cyan-400 group-hover:text-cyan-300"><IconDownload /></span>
                      </a>
                    )}
                    {job.attachments?.companyBrochurePdf?.url && (
                      <a href={fileUrl(job.attachments.companyBrochurePdf.url)} target="_blank" rel="noreferrer" download
                        className="flex items-center justify-between gap-2 bg-[var(--bg-panel)] border border-[var(--border-card)] rounded-lg px-3 py-2 hover:border-cyan-500/50 transition-colors group">
                        <span className="flex items-center gap-2 font-sans text-[0.85rem] text-[var(--text-primary)] truncate"><IconFile /> {job.attachments.companyBrochurePdf.originalName || 'Company brochure.pdf'}</span>
                        <span className="text-cyan-400 group-hover:text-cyan-300"><IconDownload /></span>
                      </a>
                    )}
                  </div>
                )}

                {alreadyApplied && (
                  <div className="flex items-center gap-3 text-cyan-400 font-sans text-[0.8rem] bg-cyan-500/10 rounded-lg p-3.5 mb-4 border border-cyan-500/20">
                    <IconShield /> <span>You've already applied to this role.</span>
                  </div>
                )}
                {!alreadyApplied && isExpired && (
                  <div className="flex items-center gap-3 text-red-400 font-sans text-[0.8rem] bg-red-500/10 rounded-lg p-3.5 mb-4 border border-red-500/20">
                    <IconAlert /> <span>The application deadline for this role has passed.</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-auto pt-2">
                  <span />
                  <button
                    className="font-sans text-[0.85rem] font-semibold text-white bg-cyan-500 rounded-lg px-6 py-2.5 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all active:scale-95 cursor-pointer"
                    disabled={isExpired || alreadyApplied}
                    onClick={() => setStep(1)}
                  >
                    Apply now
                  </button>
                </div>
              </div>
            )}

            {/* STEP 1: PROFILE-COMPLETION GATE + CONSENT / RESUME CHOICE */}
            {step === 1 && (
              <div className="p-6 md:p-8 flex flex-col overflow-y-auto no-scrollbar">
                <button className="absolute top-4 right-4 bg-transparent border-none text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-xl font-bold cursor-pointer" onClick={resetAndClose}>✕</button>

                <div className="flex items-center gap-3 mb-2">
                  <IconShield className="text-cyan-400" />
                  <h2 className="font-sans text-[1.1rem] font-bold text-[var(--text-heading)]">Confirm your application</h2>
                </div>

                {!profileComplete ? (
                  <>
                    <p className="font-sans text-[0.85rem] text-[var(--text-secondary)] leading-relaxed mb-6">
                      You need to finish the required fields in your profile before you can apply to <strong className="text-[var(--text-primary)]">{companyName}</strong>.
                    </p>
                    <div className="flex items-start gap-3 text-amber-500 font-sans text-[0.8rem] bg-amber-500/10 rounded-lg p-3.5 mb-6 border border-amber-500/20">
                      <IconAlert />
                      <span className="leading-tight">Your profile is missing compulsory information (name, contact details, etc).</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-auto pt-2">
                      <button className="font-sans text-[0.85rem] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => setStep(0)}>Back</button>
                      <Link to="/profile-builder" onClick={resetAndClose} className="font-sans text-[0.85rem] font-semibold text-white bg-cyan-500 rounded-lg px-6 py-2.5 hover:bg-cyan-600 shadow-md transition-all active:scale-95">
                        Complete profile
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-sans text-[0.85rem] text-[var(--text-secondary)] leading-relaxed mb-6">
                      Review the details we'll share with <strong className="text-[var(--text-primary)]">{companyName}</strong> for the <strong className="text-[var(--text-primary)]">{job.title}</strong> role.
                    </p>

                    <div className="bg-[var(--bg-panel)] border border-[var(--border-card)] rounded-xl p-4 flex flex-col gap-3 mb-6">
                      <span className="font-sans text-[0.7rem] font-bold text-[var(--text-muted)] tracking-widest uppercase mb-1">DETAILS TO VERIFY</span>
                      <div className="flex items-center justify-between font-sans text-[0.85rem]">
                        <span className="text-[var(--text-secondary)]">Name</span>
                        <span className="text-[var(--text-primary)] font-semibold">{profile?.personal?.fullName || user?.displayName}</span>
                      </div>
                      <div className="flex items-center justify-between font-sans text-[0.85rem]">
                        <span className="text-[var(--text-secondary)]">Email</span>
                        <span className="text-[var(--text-primary)] font-semibold">{profile?.personal?.email || user?.email}</span>
                      </div>
                      {profile?.personal?.title && (
                        <div className="flex items-center justify-between font-sans text-[0.85rem]">
                          <span className="text-[var(--text-secondary)]">Title</span>
                          <span className="text-[var(--text-primary)] font-semibold">{profile.personal.title}</span>
                        </div>
                      )}
                    </div>

                    <span className="font-sans text-[0.7rem] font-bold text-[var(--text-muted)] tracking-widest uppercase mb-2">Resume</span>
                    <div className="flex flex-col gap-2 mb-4">
                      <label className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${shareProfile && !resumeFile ? 'border-cyan-500 bg-cyan-500/10' : 'border-[var(--border-card)] bg-[var(--bg-nav)]'}`}>
                        <input type="radio" name="resumeMode" checked={shareProfile && !resumeFile} onChange={() => { setShareProfile(true); setResumeFile(null); }} className="mt-0.5" />
                        <span className="font-sans text-[0.85rem] text-[var(--text-primary)] leading-relaxed">Share my SkillSphere profile as my resume</span>
                      </label>
                      <label className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${resumeFile ? 'border-cyan-500 bg-cyan-500/10' : 'border-[var(--border-card)] bg-[var(--bg-nav)]'}`}>
                        <input type="radio" name="resumeMode" checked={!!resumeFile} onChange={() => document.getElementById('resume-upload-input')?.click()} className="mt-0.5" />
                        <span className="font-sans text-[0.85rem] text-[var(--text-primary)] leading-relaxed flex-1">
                          Upload a resume instead
                          {resumeFile && <span className="block text-[0.75rem] text-[var(--text-secondary)] mt-1 truncate">{resumeFile.name}</span>}
                        </span>
                        <span className="font-sans text-[0.8rem] font-semibold text-cyan-400">Browse</span>
                        <input id="resume-upload-input" type="file" className="hidden" accept=".doc,.docx,.pdf" onChange={e => {
                          if (e.target.files?.[0]) { setResumeFile(e.target.files[0]); setShareProfile(false); }
                        }} />
                      </label>
                      <span className="font-sans text-[0.7rem] text-[var(--text-muted)]">PDF, DOC or DOCX, less than 2MB.</span>
                    </div>

                    <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer mb-6 transition-all duration-300 ${consent ? 'border-cyan-500 bg-cyan-500/10' : 'border-[var(--border-card)] bg-[var(--bg-nav)] hover:border-[var(--border-hover)]'}`}>
                      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="hidden" />
                      <div className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 relative flex items-center justify-center transition-all ${consent ? 'border-cyan-500 bg-cyan-500' : 'border-[var(--text-muted)]'}`}>
                        {consent && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                      <span className="font-sans text-[0.85rem] text-[var(--text-secondary)] leading-relaxed select-none">
                        I confirm these details are accurate and consent to share {resumeFile ? 'my uploaded resume' : 'my profile as my resume'} with this company.
                      </span>
                    </label>

                    <div className="flex items-start gap-3 text-amber-500 font-sans text-[0.8rem] bg-amber-500/10 rounded-lg p-3.5 mb-8 border border-amber-500/20">
                      <IconAlert />
                      <span className="leading-tight">Once submitted, this application <strong className="font-semibold text-amber-400">cannot be cancelled or withdrawn</strong>.</span>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-auto pt-2">
                      <button className="font-sans text-[0.85rem] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => setStep(0)}>Back</button>
                      <button
                        className="font-sans text-[0.85rem] font-semibold text-white bg-cyan-500 rounded-lg px-6 py-2.5 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all active:scale-95 cursor-pointer"
                        disabled={!canProceedFromConsent}
                        onClick={() => setStep(2)}
                      >
                        Proceed
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 2: FORM */}
            {step === 2 && (
              <div className="flex flex-col h-full max-h-[85vh]">
                <div className="px-6 py-5 border-b border-[var(--border-card)] flex items-center justify-between shrink-0">
                  <h2 className="font-sans text-[1.1rem] font-bold text-[var(--text-heading)] truncate pr-4">Apply to {companyName}</h2>
                  <button className="bg-transparent border-none text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0 text-xl font-bold cursor-pointer" onClick={resetAndClose}>✕</button>
                </div>

                <div className="p-6 overflow-y-auto no-scrollbar flex flex-col gap-6">

                  {/* Contact Info */}
                  <div>
                    <h3 className="font-sans text-[0.95rem] font-bold text-[var(--text-heading)] mb-4">Contact info</h3>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                        {(profile?.personal?.fullName || user?.displayName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-sans font-bold text-[0.95rem] text-[var(--text-primary)]">{profile?.personal?.fullName || user?.displayName}</div>
                        <div className="font-sans text-[0.8rem] text-[var(--text-secondary)] mt-0.5">{profile?.personal?.location || profile?.personal?.email || user?.email}</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans text-[0.8rem] text-[var(--text-secondary)]">Mobile Number*</label>
                      <div className={`flex items-center w-full sm:w-[300px] bg-transparent border rounded-lg overflow-hidden transition-colors ${errors.phone ? 'border-red-500 bg-red-500/5' : 'border-[var(--border-card)] focus-within:border-cyan-500'}`}>
                        <div className="bg-[var(--bg-nav)] px-3 py-2 border-r border-[var(--border-card)] font-sans text-[0.9rem] text-[var(--text-secondary)] select-none">+91</div>
                        <input
                          type="tel"
                          maxLength="10"
                          value={phone}
                          onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setErrors(p => ({ ...p, phone: null })); }}
                          placeholder="10-digit number"
                          className="w-full bg-transparent px-3 py-2 font-sans text-[0.9rem] text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      {errors.phone && <span className="font-sans text-[0.75rem] text-red-500">{errors.phone}</span>}
                    </div>
                  </div>

                  <div className="w-full h-px bg-[var(--border-card)]"></div>

                  {/* Employer Questions */}
                  <div>
                    <h3 className="font-sans text-[0.95rem] font-bold text-[var(--text-heading)] mb-4">Employer questions</h3>

                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-2">
                        <label className="font-sans text-[0.85rem] text-[var(--text-primary)]">Are you willing to relocate for this role?*</label>
                        <div className="flex items-center gap-4 mt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="relocate" value="yes" checked={relocate === 'yes'} onChange={() => { setRelocate('yes'); setErrors(p => ({ ...p, relocate: null })); }} className="w-4 h-4 text-cyan-600 border-[var(--border-card)] focus:ring-cyan-500 bg-[var(--bg-nav)]" />
                            <span className="font-sans text-[0.85rem] text-[var(--text-primary)]">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="relocate" value="no" checked={relocate === 'no'} onChange={() => { setRelocate('no'); setErrors(p => ({ ...p, relocate: null })); }} className="w-4 h-4 text-cyan-600 border-[var(--border-card)] focus:ring-cyan-500 bg-[var(--bg-nav)]" />
                            <span className="font-sans text-[0.85rem] text-[var(--text-primary)]">No</span>
                          </label>
                        </div>
                        {errors.relocate && <span className="font-sans text-[0.75rem] text-red-500">{errors.relocate}</span>}
                      </div>

                      <div className="flex flex-col gap-2 relative">
                        <label className="font-sans text-[0.85rem] text-[var(--text-primary)]">What is your current notice period?*</label>
                        <div
                          className="w-full sm:w-[220px] bg-[var(--bg-nav)] border border-[var(--border-card)] rounded-lg px-3 py-2 font-sans text-[0.9rem] text-[var(--text-primary)] cursor-pointer flex justify-between items-center transition-colors hover:border-cyan-500/50"
                          onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}
                        >
                          {noticePeriod}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                        {isDropdownOpen && (
                          <div className="absolute top-[100%] left-0 w-full sm:w-[220px] mt-2 bg-[var(--bg-panel)] border border-[var(--border-card)] rounded-lg shadow-xl overflow-hidden z-[10]">
                            {noticeOptions.map(opt => (
                              <div key={opt} className="px-4 py-2.5 font-sans text-[0.85rem] text-[var(--text-primary)] hover:bg-cyan-500 hover:text-white cursor-pointer transition-colors" onClick={() => { setNoticePeriod(opt); setIsDropdownOpen(false); }}>
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-[var(--border-card)]"></div>

                  {/* Top choice job */}
                  <div>
                    <h3 className="font-sans text-[0.95rem] font-bold text-[var(--text-heading)] mb-1">Top choice job</h3>
                    <p className="font-sans text-[0.85rem] text-[var(--text-secondary)] mb-4">
                      Stand out to the employer by letting them know that this is a top choice job for you.
                    </p>
                    <label className="flex items-center gap-3 cursor-pointer w-fit">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" checked={topChoice} onChange={e => setTopChoice(e.target.checked)} className="peer appearance-none w-[18px] h-[18px] border border-[var(--border-card)] rounded-sm bg-[var(--bg-card)] checked:bg-cyan-600 checked:border-cyan-600 transition-colors" />
                        <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <span className="font-sans text-[0.85rem] text-[var(--text-primary)]">Mark job as a top choice job</span>
                    </label>
                  </div>

                  <div className="w-full h-px bg-[var(--border-card)]"></div>

                  {/* Stand Out */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1 text-cyan-400 font-bold text-[0.65rem] tracking-widest uppercase">
                      <div className="w-[10px] h-[10px] bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-sm"></div>
                      LEVEL UP
                    </div>
                    <h3 className="font-sans text-[0.95rem] font-bold text-[var(--text-heading)] mb-1">Stand out to the employer</h3>
                    <p className="font-sans text-[0.85rem] text-[var(--text-secondary)] mb-4">
                      Highlight your expertise by sharing a relevant project and a brief pitch about why you're a great fit.
                    </p>
                    <div className="flex flex-col gap-2">
                      <label className="font-sans text-[0.85rem] text-[var(--text-primary)] font-medium">Cover letter (short)*</label>
                      <textarea
                        rows="4"
                        value={pitch}
                        onChange={e => { setPitch(e.target.value); setErrors(p => ({ ...p, pitch: null })); }}
                        placeholder="Briefly describe your relevant experience..."
                        className={`w-full bg-transparent border rounded-lg px-3 py-2 font-sans text-[0.9rem] text-[var(--text-primary)] focus:border-cyan-500 outline-none placeholder-[var(--text-muted)] resize-none transition-colors ${errors.pitch ? 'border-red-500 bg-red-500/5' : 'border-[var(--border-card)]'}`}
                      ></textarea>
                      {errors.pitch && <span className="font-sans text-[0.75rem] text-red-500">{errors.pitch}</span>}
                    </div>
                  </div>

                  <div className="w-full h-px bg-[var(--border-card)]"></div>

                  {/* Resume summary (chosen back in step 1) */}
                  <div>
                    <span className="font-sans text-[0.7rem] font-bold text-[var(--text-muted)] tracking-widest uppercase">Resume</span>
                    <p className="font-sans text-[0.85rem] text-[var(--text-primary)] mt-1">
                      {resumeFile ? `Uploaded file: ${resumeFile.name}` : 'Sharing your SkillSphere profile as your resume'}
                    </p>
                    <button className="font-sans text-[0.8rem] font-semibold text-cyan-400 hover:text-cyan-300 mt-1" onClick={() => setStep(1)}>Change</button>
                  </div>

                  <div className="w-full h-px bg-[var(--border-card)]"></div>

                  {/* Follow Company */}
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer w-fit">
                      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                        <input type="checkbox" checked={followCompany} onChange={e => { setFollowCompany(e.target.checked); setErrors(p => ({ ...p, followCompany: null })); }} className={`peer appearance-none w-[18px] h-[18px] border rounded bg-[var(--bg-card)] checked:bg-emerald-600 checked:border-emerald-600 transition-colors ${errors.followCompany ? 'border-red-500' : 'border-[var(--border-card)]'}`} />
                        <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <span className={`font-sans text-[0.85rem] leading-relaxed ${errors.followCompany ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                        Follow <strong className="text-[var(--text-primary)]">{companyName}</strong> to stay up to date with their page.
                      </span>
                    </label>
                    {errors.followCompany && <div className="font-sans text-[0.75rem] text-red-500 mt-1">{errors.followCompany}</div>}
                  </div>

                  {submitError && (
                    <div className="font-sans text-[0.8rem] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">{submitError}</div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-[var(--border-card)] flex justify-end shrink-0 bg-[var(--bg-card)]">
                  <button
                    className="font-sans text-[0.85rem] font-semibold text-white bg-cyan-500 hover:bg-cyan-600 rounded-lg px-6 py-2.5 transition-all active:scale-95 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting…' : 'Submit application'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 3 && (
              <div className="p-10 flex flex-col items-center justify-center text-center animate-fade-in relative">
                <button className="absolute top-4 right-4 bg-transparent border-none text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-xl font-bold cursor-pointer" onClick={resetAndClose}>✕</button>

                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                  <div className="text-emerald-500">
                    <IconCheck />
                  </div>
                </div>
                <h2 className="font-sans text-[1.4rem] font-bold text-[var(--text-heading)] mb-2">Application Submitted!</h2>
                <p className="font-sans text-[0.95rem] text-[var(--text-secondary)] leading-relaxed mb-8">
                  Your application for the <strong className="text-[var(--text-primary)]">{job.title}</strong> position at <strong className="text-[var(--text-primary)]">{companyName}</strong> has been sent successfully. Best of luck!
                </p>
                <button
                  className="font-sans text-[0.95rem] font-bold text-[var(--bg-page)] bg-[var(--text-primary)] hover:opacity-85 rounded-full px-8 py-2.5 transition-opacity active:scale-95 shadow-md cursor-pointer w-full"
                  onClick={resetAndClose}
                >
                  Done
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}