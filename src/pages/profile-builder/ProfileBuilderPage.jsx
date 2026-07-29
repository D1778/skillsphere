import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useTheme from '../../hooks/useTheme';
import './profile-builder.css';
import '../../components/auth/auth.css';

import SiteLogo    from '../../components/profile-builder/SiteLogo';
import TagInput    from '../../components/profile-builder/TagInput';
import Toggle      from '../../components/profile-builder/Toggle';
import MonthYearPicker from '../../components/profile-builder/MonthYearPicker';
import { NAV_ICONS } from '../../components/profile-builder/ProfileIcons';
import {
  uid, makeEdu, makeExp, makeProj, makeCert, makeAward, makeLeader, makeVol, makePub,
  updateList, addItem, removeItem,
} from '../../components/profile-builder/ProfileHelpers';
import { getProfile, saveProfile } from '../../services/api';

const AUTOSAVE_DELAY = 1500; // ms after last keystroke

export default function ProfileBuilderPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const fileRef     = useRef(null);
  const certPdfRefs = useRef({});

  /* ── autosave state ── */
  const [saveStatus, setSaveStatus]   = useState('idle'); // idle | saving | saved | error
  const autosaveTimer                 = useRef(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  /* ── file objects (not stored in DB directly) ── */
  const [photoFile, setPhotoFile]   = useState(null);
  const [certFiles, setCertFiles]   = useState({}); // { certIndex: File }

  /* ── Wizard step (which card is showing) ── */
  const [step, setStep] = useState(0);

  /* ── Optional sections ── */
  const [secEnabled, setSecEnabled] = useState({
    experience:true, certs:true, awards:true,
    leadership:true, volunteer:true, pubs:true, extras:true,
  });
  const toggleSec = (id) => setSecEnabled(s => ({ ...s, [id]: !s[id] }));

  /* ── Photo ── */
  const [photoPreview, setPhotoPreview] = useState(null);
  const handlePhoto = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  /* ── Form state ── */
  const [personal, setPersonal]       = useState({ fullName:'', title:'', email:'', phone:'', location:'', portfolio:'', linkedin:'', github:'', summary:'' });
  const [educations,  setEducations]  = useState([makeEdu()]);
  const [experiences, setExperiences] = useState([makeExp()]);
  const [projects,    setProjects]    = useState([makeProj()]);
  const [skills,      setSkills]      = useState({ languages:[], frameworks:[], tools:[], libraries:[] });
  const [certs,       setCerts]       = useState([makeCert()]);
  const [awards,      setAwards]      = useState([makeAward()]);
  const [leaders,     setLeaders]     = useState([makeLeader()]);
  const [volunteers,  setVolunteers]  = useState([makeVol()]);
  const [pubs,        setPubs]        = useState([makePub()]);
  const [extras,      setExtras]      = useState({ achievements:'', interests:[] });
  const [consent, setConsent]         = useState({ storage:false, recruiter:false });
  const [consentError, setConsentError] = useState(false);
  const bothAgreed = consent.storage && consent.recruiter;

  const [formErrors,  setFormErrors]  = useState([]);
  const [submitting,  setSubmitting]  = useState(false);

  const updEdu    = updateList(setEducations);
  const updExp    = updateList(setExperiences);
  const updProj   = updateList(setProjects);
  const updCert   = updateList(setCerts);
  const updAward  = updateList(setAwards);
  const updLeader = updateList(setLeaders);
  const updVol    = updateList(setVolunteers);
  const updPub    = updateList(setPubs);

  const handleCertPdf = (certId, idx, e) => {
    const f = e.target.files[0];
    if (!f) return;
    updCert(certId, 'certPdf', { name: f.name, size: f.size });
    setCertFiles(prev => ({ ...prev, [idx]: f }));
  };

  /* ══ Load existing draft on mount ══ */
  useEffect(() => {
    getProfile().then(profile => {
      if (!profile) return;
      if (profile.secEnabled) setSecEnabled(s => ({ ...s, ...profile.secEnabled }));
      if (profile.personal)   setPersonal(p   => ({ ...p,  ...profile.personal  }));
      if (profile.personal?.photoUrl) setPhotoPreview(profile.personal.photoUrl);
      if (profile.educations?.length)  setEducations(profile.educations.map(e => ({ ...makeEdu(), ...e, id: uid() })));
      if (profile.experiences?.length) setExperiences(profile.experiences.map(e => ({ ...makeExp(), ...e, id: uid() })));
      if (profile.projects?.length)    setProjects(profile.projects.map(p => ({ ...makeProj(), ...p, id: uid() })));
      if (profile.skills)    setSkills(s => ({ ...s, ...profile.skills }));
      if (profile.certs?.length)      setCerts(profile.certs.map(c => ({ ...makeCert(), ...c, id: uid() })));
      if (profile.awards?.length)     setAwards(profile.awards.map(a => ({ ...makeAward(), ...a, id: uid() })));
      if (profile.leaders?.length)    setLeaders(profile.leaders.map(l => ({ ...makeLeader(), ...l, id: uid() })));
      if (profile.volunteers?.length) setVolunteers(profile.volunteers.map(v => ({ ...makeVol(), ...v, id: uid() })));
      if (profile.pubs?.length)       setPubs(profile.pubs.map(p => ({ ...makePub(), ...p, id: uid() })));
      if (profile.extras)    setExtras(x => ({ ...x, ...profile.extras }));
      if (profile.consent)   setConsent(c => ({ ...c, ...profile.consent }));
      setProfileLoaded(true);
    }).catch(() => setProfileLoaded(true));
  }, []);

  /* ══ Build payload ══ */
  const buildPayload = useCallback(() => ({
    secEnabled,
    personal,
    educations:  educations.map(({ id, ...rest }) => rest),
    experiences: experiences.map(({ id, ...rest }) => rest),
    projects:    projects.map(({ id, ...rest }) => rest),
    skills,
    certs:       certs.map(({ id, certPdf, ...rest }) => rest),
    awards:      awards.map(({ id, ...rest }) => rest),
    leaders:     leaders.map(({ id, ...rest }) => rest),
    volunteers:  volunteers.map(({ id, ...rest }) => rest),
    pubs:        pubs.map(({ id, ...rest }) => rest),
    extras,
    consent,
  }), [secEnabled, personal, educations, experiences, projects, skills, certs, awards, leaders, volunteers, pubs, extras, consent]);

  /* ══ Autosave (debounced) ══ */
  const triggerAutosave = useCallback(() => {
    if (!profileLoaded) return;
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await saveProfile(buildPayload(), photoFile, certFiles, false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
      }
    }, AUTOSAVE_DELAY);
  }, [profileLoaded, buildPayload, photoFile, certFiles]);

  // Trigger autosave whenever any form state changes
  useEffect(() => { triggerAutosave(); },
    // eslint-disable-next-line
    [secEnabled, personal, educations, experiences, projects, skills, certs, awards, leaders, volunteers, pubs, extras]);

  /* ══ Validation ══ */
  const validateForm = () => {
    const errors = [];
    if (!personal.fullName.trim()) errors.push({ sectionId:'personal', message:'Full name is required.' });
    if (!personal.email.trim())    errors.push({ sectionId:'personal', message:'Email is required.' });
    else if (!/\S+@\S+\.\S+/.test(personal.email)) errors.push({ sectionId:'personal', message:'Enter a valid email.' });
    if (!educations.some(e => e.institution.trim())) errors.push({ sectionId:'education', message:'At least one institution is required.' });
    if (!projects.some(p => p.name.trim()))          errors.push({ sectionId:'projects',  message:'At least one project name is required.' });
    if (!skills.languages.length && !skills.frameworks.length && !skills.tools.length && !skills.libraries.length)
      errors.push({ sectionId:'skills', message:'Add at least one skill.' });
    return errors;
  };

  /* ══ Final submit ══ */
  const handleComplete = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0 || !bothAgreed) {
      setFormErrors(errors);
      if (!bothAgreed) {
        setConsentError(true);
        if (!errors.length) {
          document.getElementById('pb-consent-section')?.scrollIntoView({ behavior:'smooth', block:'center' });
        }
      }
      if (errors.length) {
        // Jump straight to the card that has the problem
        goToStep(stepIndexOf(errors[0].sectionId));
      }
      return;
    }
    setFormErrors([]);
    setConsentError(false);
    setSubmitting(true);
    try {
      await saveProfile(buildPayload(), photoFile, certFiles, true);
      // Update the shared auth state immediately — don't rely on the next
      // ProtectedRoute re-fetching /me, which can race the backend write
      // and briefly still report profileCompleted:false, bouncing us
      // straight back to /profile-builder.
      setUser(prev => prev ? { ...prev, profileCompleted: true } : prev);
      navigate('/dashboard/candidate');
    } catch (err) {
      setSubmitting(false);
      alert(err.response?.data?.message || 'Failed to save profile. Please try again.');
    }
  };

  /* ══ Profile strength ══ */
  const strength = (() => {
    let p = 0;
    if (personal.fullName)  p += 10; if (personal.email)    p += 8;
    if (personal.title)     p += 7;  if (personal.summary)  p += 10;
    if (personal.phone)     p += 3;  if (personal.linkedin) p += 3;
    if (personal.github)    p += 3;  if (photoPreview)      p += 6;
    if (educations.some(e => e.institution)) p += 10;
    if (secEnabled.experience && experiences.some(e => e.company)) p += 10;
    if (projects.some(p => p.name))    p += 10;
    if (skills.languages.length)       p += 5;
    if (secEnabled.certs && certs.some(c => c.name)) p += 5;
    if (secEnabled.extras && extras.achievements)    p += 5;
    if (extras.interests.length)       p += 5;
    return Math.min(p, 100);
  })();

  const errSections    = new Set(formErrors.map(e => e.sectionId));
  const sectionErrors  = formErrors.reduce((acc, err) => {
    if (!acc[err.sectionId]) acc[err.sectionId] = [];
    acc[err.sectionId].push(err.message);
    return acc;
  }, {});

  /* ══ Section / step definitions ══ */
  const NAV_SECTIONS = [
    { id:'personal',   label:'Personal',       mandatory:true  },
    { id:'education',  label:'Education',      mandatory:true  },
    { id:'experience', label:'Experience',     mandatory:false },
    { id:'projects',   label:'Projects',       mandatory:true  },
    { id:'skills',     label:'Skills',         mandatory:true  },
    { id:'certs',      label:'Certifications', mandatory:false },
    { id:'awards',     label:'Awards',         mandatory:false },
    { id:'leadership', label:'Leadership',     mandatory:false },
    { id:'volunteer',  label:'Volunteer',      mandatory:false },
    { id:'pubs',       label:'Publications',   mandatory:false },
    { id:'extras',     label:'Extras',         mandatory:false },
  ];

  // Extra virtual step at the end for consent + final submit
  const STEPS = [...NAV_SECTIONS, { id:'review', label:'Review & Submit', mandatory:true }];
  const totalSteps = STEPS.length;
  const currentId  = STEPS[step]?.id || 'personal';

  const stepIndexOf = (id) => STEPS.findIndex(s => s.id === id);

  // A card only gets a "done" checkmark once it's actually filled in
  // (or, for optional cards, once it's been skipped) — not just because
  // the user jumped past it.
  const isStepDone = (id) => {
    switch (id) {
      case 'personal':
        return !!personal.fullName.trim() && !!personal.email.trim() && /\S+@\S+\.\S+/.test(personal.email);
      case 'education':
        return educations.some(e => e.institution.trim());
      case 'experience':
        return !secEnabled.experience || experiences.some(e => e.title.trim() || e.company.trim());
      case 'projects':
        return projects.some(p => p.name.trim());
      case 'skills':
        return !!(skills.languages.length || skills.frameworks.length || skills.tools.length || skills.libraries.length);
      case 'certs':
        return !secEnabled.certs || certs.some(c => c.name.trim());
      case 'awards':
        return !secEnabled.awards || awards.some(a => a.name.trim());
      case 'leadership':
        return !secEnabled.leadership || leaders.some(l => l.position.trim());
      case 'volunteer':
        return !secEnabled.volunteer || volunteers.some(v => v.org.trim());
      case 'pubs':
        return !secEnabled.pubs || pubs.some(p => p.title.trim());
      case 'extras':
        return !secEnabled.extras || !!extras.achievements.trim() || extras.interests.length > 0;
      case 'review':
        return bothAgreed;
      default:
        return false;
    }
  };

  const goToStep = (idx) => {
    const clamped = Math.max(0, Math.min(idx, totalSteps - 1));
    setStep(clamped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goNext = () => goToStep(step + 1);
  const goBack = () => goToStep(step - 1);

  // Only the active card is visible; everything else stays mounted (state-safe) but hidden.
  const cardStyle = (idx) => (step === idx ? undefined : { display: 'none' });

  /* ══ Sub-components ══ */
  const SectionHeader = ({ id, label, mandatory }) => (
    <div className="pb-section-header">
      <div className="pb-section-icon">{NAV_ICONS[id]}</div>
      <h2 className="pb-section-title">{label}</h2>
      {mandatory
        ? <span className="pb-mandatory-badge">Required</span>
        : (
          <div className="pb-toggle-wrap">
            <span className="pb-toggle-hint">{secEnabled[id] ? 'Include' : 'Skip'}</span>
            <Toggle id={`toggle-${id}`} checked={secEnabled[id]} onChange={() => toggleSec(id)}/>
          </div>
        )
      }
    </div>
  );

  const SkippedMsg = () => (
    <div className="pb-section-skipped">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
      Section skipped — toggle the switch to add it.
    </div>
  );

  const InlineErrors = ({ id }) => sectionErrors[id] ? (
    <div className="pb-inline-error">
      {sectionErrors[id].map((msg, i) => (
        <div key={i} className="pb-inline-error-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {msg}
        </div>
      ))}
    </div>
  ) : null;

  const RemoveBtn = ({ onClick }) => (
    <button className="pb-remove-btn" type="button" onClick={onClick}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      </svg>
    </button>
  );

  const AddBtn = ({ onClick, label }) => (
    <button type="button" className="pb-add-btn" onClick={onClick}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      {label}
    </button>
  );

  /* ══ Save status indicator ══ */
  const SaveIndicator = () => {
    if (saveStatus === 'idle')   return null;
    if (saveStatus === 'saving') return <span className="pb-save-status saving">Saving…</span>;
    if (saveStatus === 'saved')  return <span className="pb-save-status saved">✓ Saved</span>;
    if (saveStatus === 'error')  return <span className="pb-save-status error">Save failed</span>;
    return null;
  };

  /* ══ RENDER ══ */
  return (
    <div className="pb-page">
      <div className="pb-bg-blobs">
        <div className="pb-blob pb-blob-1"/><div className="pb-blob pb-blob-2"/><div className="pb-blob pb-blob-3"/>
      </div>

      {/* HEADER */}
      <header className="pb-header">
        <SiteLogo/>
        <div className="pb-step-badge" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <span className="pb-step-dot"/>
          Build your profile
          <SaveIndicator/>
        </div>
        <button className="pb-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {isDark
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>
      </header>

      <div className="pb-container">
        <div className="pb-headline">
          <h1>Let's build your <span>verified profile</span></h1>
          <p>The more you share, the smarter your AI matches get. Everything marked <strong style={{color:'#22d3ee'}}>Required</strong> must be filled — optional sections can be toggled on or off.</p>
        </div>

        {/* STEP TRACKER */}
        <div className="pb-tracker">
          <div className="pb-tracker-track">
            {STEPS.map((s, i) => {
              const done = isStepDone(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`pb-tracker-step ${i === step ? 'active' : ''} ${done ? 'done' : ''}`}
                  onClick={() => goToStep(i)}
                >
                  <span className="pb-tracker-num">{done ? '✓' : i + 1}</span>
                  <span className="pb-tracker-label">{s.label}</span>
                </button>
              );
            })}
          </div>
          <div className="pb-tracker-bar">
            <div className="pb-tracker-fill" style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}/>
          </div>
        </div>

        <div className="pb-layout">
          {/* SIDEBAR */}
          <aside className="pb-sidebar">
            <div className="pb-strength-card">
              <div className="pb-strength-row">
                <span className="pb-strength-dot"/>
                <span className="pb-strength-pct">{strength}%</span>
                <div className="pb-strength-info">
                  <span className="pb-strength-label">Profile strength</span>
                  <span className="pb-strength-sub">
                    {strength < 30 ? 'Keep going' : strength < 60 ? 'Good progress' : strength < 90 ? 'Almost there!' : 'Excellent!'}
                  </span>
                </div>
              </div>
              <div className="pb-strength-track">
                <div className="pb-strength-fill" style={{ width:`${strength}%` }}/>
              </div>
            </div>
            {NAV_SECTIONS.map((s, i) => {
              const skipped = !s.mandatory && !secEnabled[s.id];
              return (
                <button key={s.id} className={`pb-nav-item ${currentId===s.id?'active':''} ${skipped?'skipped':''}`}
                  onClick={() => goToStep(i)}>
                  <span className="pb-nav-icon">{NAV_ICONS[s.id]}</span>
                  {s.label}
                  {s.mandatory && <span className="pb-nav-mandatory"/>}
                </button>
              );
            })}
          </aside>

          {/* CONTENT */}
          <main className="pb-content">

            {/* PERSONAL */}
            <section id="pb-sec-personal" style={cardStyle(0)} className={`pb-section${errSections.has('personal')?' pb-sec-error':''}`}>
              <SectionHeader id="personal" label="Personal information" mandatory/>
              <div className="pb-section-body">
                <InlineErrors id="personal"/>
                <div className="pb-photo-row">
                  <div className="pb-photo-avatar" onClick={() => fileRef.current?.click()}>
                    {photoPreview
                      ? <img src={photoPreview.startsWith('data:') ? photoPreview : `http://localhost:5000${photoPreview}`} alt="Profile"/>
                      : <span>{(personal.fullName||'Y')[0].toUpperCase()}</span>
                    }
                    <div className="pb-photo-overlay">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div className="pb-photo-text">Profile photo</div>
                    <div className="pb-photo-sub">Optional — we'll generate one from your initials if skipped.</div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhoto}/>
                </div>
                <div className="pb-grid">
                  <div className="pb-field"><label className="pb-label" htmlFor="pb-fullname">Full name *</label>
                    <input id="pb-fullname" className="pb-input" placeholder="Aarav Mehta" value={personal.fullName} onChange={e=>setPersonal(p=>({...p,fullName:e.target.value}))}/></div>
                  <div className="pb-field"><label className="pb-label" htmlFor="pb-title">Professional title</label>
                    <input id="pb-title" className="pb-input" placeholder="Full-Stack Developer" value={personal.title} onChange={e=>setPersonal(p=>({...p,title:e.target.value}))}/></div>
                  <div className="pb-field"><label className="pb-label" htmlFor="pb-email">Email *</label>
                    <input id="pb-email" className="pb-input" type="email" placeholder="you@example.com" value={personal.email} onChange={e=>setPersonal(p=>({...p,email:e.target.value}))}/></div>
                  <div className="pb-field"><label className="pb-label" htmlFor="pb-phone">Phone number</label>
                    <input id="pb-phone" className="pb-input" placeholder="+91 98765 43210" value={personal.phone} onChange={e=>setPersonal(p=>({...p,phone:e.target.value}))}/></div>
                  <div className="pb-field"><label className="pb-label" htmlFor="pb-location">Location</label>
                    <input id="pb-location" className="pb-input" placeholder="Bengaluru, India" value={personal.location} onChange={e=>setPersonal(p=>({...p,location:e.target.value}))}/></div>
                  <div className="pb-field"><label className="pb-label" htmlFor="pb-portfolio">Portfolio website</label>
                    <input id="pb-portfolio" className="pb-input" placeholder="https://yoursite.com" value={personal.portfolio} onChange={e=>setPersonal(p=>({...p,portfolio:e.target.value}))}/></div>
                  <div className="pb-field"><label className="pb-label" htmlFor="pb-linkedin">LinkedIn</label>
                    <input id="pb-linkedin" className="pb-input" placeholder="https://linkedin.com/in/..." value={personal.linkedin} onChange={e=>setPersonal(p=>({...p,linkedin:e.target.value}))}/></div>
                  <div className="pb-field"><label className="pb-label" htmlFor="pb-github">GitHub</label>
                    <input id="pb-github" className="pb-input" placeholder="https://github.com/..." value={personal.github} onChange={e=>setPersonal(p=>({...p,github:e.target.value}))}/></div>
                  <div className="pb-field pb-col-full"><label className="pb-label" htmlFor="pb-summary">Professional summary</label>
                    <textarea id="pb-summary" className="pb-textarea" rows={4} placeholder="A short pitch about who you are and what you build."
                      value={personal.summary} onChange={e=>setPersonal(p=>({...p,summary:e.target.value}))}/></div>
                </div>
              </div>
            </section>

            {/* EDUCATION */}
            <section id="pb-sec-education" style={cardStyle(1)} className={`pb-section${errSections.has('education')?' pb-sec-error':''}`}>
              <SectionHeader id="education" label="Education" mandatory/>
              <div className="pb-section-body">
                <InlineErrors id="education"/>
                {educations.map((edu,i) => (
                  <div key={edu.id} className="pb-entry-card">
                    <div className="pb-entry-label">Education #{i+1}</div>
                    {educations.length>1 && <RemoveBtn onClick={()=>removeItem(setEducations)(edu.id)}/>}
                    <div className="pb-grid">
                      <div className="pb-field"><label className="pb-label">Institution</label>
                        <input className="pb-input" placeholder="IIT Delhi" value={edu.institution} onChange={e=>updEdu(edu.id,'institution',e.target.value)}/></div>
                      <div className="pb-field"><label className="pb-label">Degree</label>
                        <input className="pb-input" placeholder="B.Tech Computer Science" value={edu.degree} onChange={e=>updEdu(edu.id,'degree',e.target.value)}/></div>
                      <div className="pb-field"><label className="pb-label">Field of study</label>
                        <input className="pb-input" placeholder="Computer Science" value={edu.field} onChange={e=>updEdu(edu.id,'field',e.target.value)}/></div>
                      <div className="pb-field"><label className="pb-label">Location</label>
                        <input className="pb-input" placeholder="New Delhi, India" value={edu.location} onChange={e=>updEdu(edu.id,'location',e.target.value)}/></div>
                      <div className="pb-field"><label className="pb-label">Start date</label>
                        <MonthYearPicker id={`edu-start-${edu.id}`} value={edu.startDate} onChange={v=>updEdu(edu.id,'startDate',v)} placeholder="Select start month"/></div>
                      <div className="pb-field"><label className="pb-label">End date</label>
                        <MonthYearPicker id={`edu-end-${edu.id}`} value={edu.endDate} onChange={v=>updEdu(edu.id,'endDate',v)} placeholder="Select end month"/></div>
                      <div className="pb-field"><label className="pb-label">GPA</label>
                        <input className="pb-input" placeholder="8.7 / 10" value={edu.gpa} onChange={e=>updEdu(edu.id,'gpa',e.target.value)}/></div>
                      <div className="pb-field pb-col-full"><label className="pb-label">Relevant coursework</label>
                        <textarea className="pb-textarea" rows={3} placeholder="Data Structures, Algorithms…" value={edu.coursework} onChange={e=>updEdu(edu.id,'coursework',e.target.value)}/></div>
                    </div>
                  </div>
                ))}
                <AddBtn onClick={addItem(setEducations,makeEdu)} label="Add education"/>
              </div>
            </section>

            {/* EXPERIENCE */}
            <section id="pb-sec-experience" style={cardStyle(2)} className="pb-section">
              <SectionHeader id="experience" label="Work experience" mandatory={false}/>
              {secEnabled.experience ? (
                <div className="pb-section-body">
                  {experiences.map((exp,i) => (
                    <div key={exp.id} className="pb-entry-card">
                      <div className="pb-entry-label">Experience #{i+1}</div>
                      {experiences.length>1 && <RemoveBtn onClick={()=>removeItem(setExperiences)(exp.id)}/>}
                      <div className="pb-grid">
                        <div className="pb-field"><label className="pb-label">Job title</label>
                          <input className="pb-input" placeholder="Software Engineer" value={exp.title} onChange={e=>updExp(exp.id,'title',e.target.value)}/></div>
                        <div className="pb-field"><label className="pb-label">Company</label>
                          <input className="pb-input" placeholder="Infosys" value={exp.company} onChange={e=>updExp(exp.id,'company',e.target.value)}/></div>
                        <div className="pb-field"><label className="pb-label">Location</label>
                          <input className="pb-input" placeholder="Pune, India" value={exp.location} onChange={e=>updExp(exp.id,'location',e.target.value)}/></div>
                        <div className="pb-field"><label className="pb-label">Start date</label>
                          <MonthYearPicker id={`exp-start-${exp.id}`} value={exp.startDate} onChange={v=>updExp(exp.id,'startDate',v)} placeholder="Select start month"/></div>
                        {!exp.current && (
                          <div className="pb-field"><label className="pb-label">End date</label>
                            <MonthYearPicker id={`exp-end-${exp.id}`} value={exp.endDate} onChange={v=>updExp(exp.id,'endDate',v)} placeholder="Select end month"/></div>
                        )}
                        <div className="pb-field pb-col-full">
                          <label className="pb-check-row" htmlFor={`cur-${exp.id}`}>
                            <input id={`cur-${exp.id}`} type="checkbox" checked={exp.current} onChange={e=>updExp(exp.id,'current',e.target.checked)}/>
                            <span className="pb-check-label">Currently working here</span>
                          </label>
                        </div>
                        <div className="pb-field pb-col-full"><label className="pb-label">Responsibilities</label>
                          <textarea className="pb-textarea" rows={4} placeholder={"• Built REST APIs\n• Reduced load time by 40%"} value={exp.responsibilities} onChange={e=>updExp(exp.id,'responsibilities',e.target.value)}/></div>
                      </div>
                    </div>
                  ))}
                  <AddBtn onClick={addItem(setExperiences,makeExp)} label="Add experience"/>
                </div>
              ) : <SkippedMsg/>}
            </section>

            {/* PROJECTS */}
            <section id="pb-sec-projects" style={cardStyle(3)} className={`pb-section${errSections.has('projects')?' pb-sec-error':''}`}>
              <SectionHeader id="projects" label="Projects" mandatory/>
              <div className="pb-section-body">
                <InlineErrors id="projects"/>
                {projects.map((proj,i) => (
                  <div key={proj.id} className="pb-entry-card">
                    <div className="pb-entry-label">Project #{i+1}</div>
                    {projects.length>1 && <RemoveBtn onClick={()=>removeItem(setProjects)(proj.id)}/>}
                    <div className="pb-grid">
                      <div className="pb-field"><label className="pb-label">Project name</label>
                        <input className="pb-input" placeholder="SkillSphere" value={proj.name} onChange={e=>updProj(proj.id,'name',e.target.value)}/></div>
                      <div className="pb-field"><label className="pb-label">Technologies</label>
                        <input className="pb-input" placeholder="React, Node.js, MongoDB" value={proj.tech} onChange={e=>updProj(proj.id,'tech',e.target.value)}/></div>
                      <div className="pb-field"><label className="pb-label">Repository</label>
                        <input className="pb-input" placeholder="https://github.com/..." value={proj.repo} onChange={e=>updProj(proj.id,'repo',e.target.value)}/></div>
                      <div className="pb-field"><label className="pb-label">Live demo</label>
                        <input className="pb-input" placeholder="https://..." value={proj.live} onChange={e=>updProj(proj.id,'live',e.target.value)}/></div>
                      <div className="pb-field"><label className="pb-label">Start date</label>
                        <MonthYearPicker id={`proj-start-${proj.id}`} value={proj.startDate} onChange={v=>updProj(proj.id,'startDate',v)} placeholder="Select start month"/></div>
                      <div className="pb-field"><label className="pb-label">End date</label>
                        <MonthYearPicker id={`proj-end-${proj.id}`} value={proj.endDate} onChange={v=>updProj(proj.id,'endDate',v)} placeholder="Select end month"/></div>
                      <div className="pb-field pb-col-full"><label className="pb-label">Description</label>
                        <textarea className="pb-textarea" rows={4} placeholder={"• Real-time collaboration\n• AI-based skill scoring"} value={proj.desc} onChange={e=>updProj(proj.id,'desc',e.target.value)}/></div>
                    </div>
                  </div>
                ))}
                <AddBtn onClick={addItem(setProjects,makeProj)} label="Add project"/>
              </div>
            </section>

            {/* SKILLS */}
            <section id="pb-sec-skills" style={cardStyle(4)} className={`pb-section${errSections.has('skills')?' pb-sec-error':''}`}>
              <SectionHeader id="skills" label="Technical skills" mandatory/>
              <div className="pb-section-body">
                <InlineErrors id="skills"/>
                <div className="pb-grid">
                  <div className="pb-field"><label className="pb-label">Programming languages</label>
                    <TagInput value={skills.languages} placeholder="Python, Java, C++…" onChange={v=>setSkills(s=>({...s,languages:v}))}/></div>
                  <div className="pb-field"><label className="pb-label">Frameworks</label>
                    <TagInput value={skills.frameworks} placeholder="React, Spring Boot…" onChange={v=>setSkills(s=>({...s,frameworks:v}))}/></div>
                  <div className="pb-field"><label className="pb-label">Developer tools</label>
                    <TagInput value={skills.tools} placeholder="Git, Docker, VS Code…" onChange={v=>setSkills(s=>({...s,tools:v}))}/></div>
                  <div className="pb-field"><label className="pb-label">Libraries</label>
                    <TagInput value={skills.libraries} placeholder="NumPy, Pandas, TensorFlow…" onChange={v=>setSkills(s=>({...s,libraries:v}))}/></div>
                </div>
                <p className="pb-hint">Press <kbd>Enter</kbd>, <kbd>Tab</kbd> or <kbd>,</kbd> to add a tag.</p>
              </div>
            </section>

            {/* CERTIFICATIONS */}
            <section id="pb-sec-certs" style={cardStyle(5)} className="pb-section">
              <SectionHeader id="certs" label="Certifications" mandatory={false}/>
              {secEnabled.certs ? (
                <div className="pb-section-body">
                  {certs.map((cert,i) => (
                    <div key={cert.id} className="pb-entry-card">
                      <div className="pb-entry-label">Certification #{i+1}</div>
                      {certs.length>1 && <RemoveBtn onClick={()=>removeItem(setCerts)(cert.id)}/>}
                      <div className="pb-grid">
                        <div className="pb-field"><label className="pb-label">Certification</label>
                          <input className="pb-input" placeholder="AWS Solutions Architect" value={cert.name} onChange={e=>updCert(cert.id,'name',e.target.value)}/></div>
                        <div className="pb-field"><label className="pb-label">Organization</label>
                          <input className="pb-input" placeholder="Amazon Web Services" value={cert.org} onChange={e=>updCert(cert.id,'org',e.target.value)}/></div>
                        <div className="pb-field"><label className="pb-label">Issue date</label>
                          <MonthYearPicker id={`cert-issue-${cert.id}`} value={cert.issueDate} onChange={v=>updCert(cert.id,'issueDate',v)} placeholder="Select issue month"/></div>
                        <div className="pb-field"><label className="pb-label">Credential URL</label>
                          <input className="pb-input" placeholder="https://..." value={cert.credUrl} onChange={e=>updCert(cert.id,'credUrl',e.target.value)}/></div>
                        <div className="pb-field pb-col-full">
                          <label className="pb-label">Certificate PDF <span className="pb-label-optional">(optional)</span></label>
                          <div className={`pb-pdf-upload${cert.certPdf?' pb-pdf-has-file':''}`}
                            onClick={() => { if(!certPdfRefs.current[cert.id]) certPdfRefs.current[cert.id]=document.getElementById(`cert-pdf-${cert.id}`); certPdfRefs.current[cert.id]?.click(); }}>
                            {cert.certPdf ? (
                              <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                <span className="pb-pdf-filename">{cert.certPdf.name}</span>
                                <span className="pb-pdf-size">({(cert.certPdf.size/1024).toFixed(0)} KB)</span>
                                <button type="button" className="pb-pdf-clear"
                                  onClick={ev=>{ev.stopPropagation();updCert(cert.id,'certPdf',null);setCertFiles(p=>{const n={...p};delete n[i];return n;});}}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                              </>
                            ) : (
                              <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                <span>Upload certificate PDF</span>
                                <span className="pb-pdf-hint">PDF up to 5 MB</span>
                              </>
                            )}
                          </div>
                          <input id={`cert-pdf-${cert.id}`} type="file" accept="application/pdf" style={{display:'none'}}
                            onChange={e=>handleCertPdf(cert.id,i,e)}/>
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="pb-hint">Add a credential URL to get a verified-source badge on your profile.</p>
                  <AddBtn onClick={addItem(setCerts,makeCert)} label="Add certification"/>
                </div>
              ) : <SkippedMsg/>}
            </section>

            {/* AWARDS */}
            <section id="pb-sec-awards" style={cardStyle(6)} className="pb-section">
              <SectionHeader id="awards" label="Awards" mandatory={false}/>
              {secEnabled.awards ? (
                <div className="pb-section-body">
                  {awards.map((award,i) => (
                    <div key={award.id} className="pb-entry-card">
                      <div className="pb-entry-label">Award #{i+1}</div>
                      {awards.length>1 && <RemoveBtn onClick={()=>removeItem(setAwards)(award.id)}/>}
                      <div className="pb-grid">
                        <div className="pb-field"><label className="pb-label">Award name</label>
                          <input className="pb-input" placeholder="Best Innovation Award" value={award.name} onChange={e=>updAward(award.id,'name',e.target.value)}/></div>
                        <div className="pb-field"><label className="pb-label">Organization</label>
                          <input className="pb-input" placeholder="Google" value={award.org} onChange={e=>updAward(award.id,'org',e.target.value)}/></div>
                        <div className="pb-field"><label className="pb-label">Year</label>
                          <input className="pb-input" placeholder="2025" value={award.year} onChange={e=>updAward(award.id,'year',e.target.value)}/></div>
                      </div>
                    </div>
                  ))}
                  <AddBtn onClick={addItem(setAwards,makeAward)} label="Add award"/>
                </div>
              ) : <SkippedMsg/>}
            </section>

            {/* LEADERSHIP */}
            <section id="pb-sec-leadership" style={cardStyle(7)} className="pb-section">
              <SectionHeader id="leadership" label="Leadership" mandatory={false}/>
              {secEnabled.leadership ? (
                <div className="pb-section-body">
                  {leaders.map((leader,i) => (
                    <div key={leader.id} className="pb-entry-card">
                      <div className="pb-entry-label">Leadership role #{i+1}</div>
                      {leaders.length>1 && <RemoveBtn onClick={()=>removeItem(setLeaders)(leader.id)}/>}
                      <div className="pb-grid">
                        <div className="pb-field"><label className="pb-label">Position</label>
                          <input className="pb-input" placeholder="Technical Head" value={leader.position} onChange={e=>updLeader(leader.id,'position',e.target.value)}/></div>
                        <div className="pb-field"><label className="pb-label">Organization</label>
                          <input className="pb-input" placeholder="IEEE Student Chapter" value={leader.org} onChange={e=>updLeader(leader.id,'org',e.target.value)}/></div>
                        <div className="pb-field"><label className="pb-label">Duration</label>
                          <input className="pb-input" placeholder="2023 — 2024" value={leader.duration} onChange={e=>updLeader(leader.id,'duration',e.target.value)}/></div>
                        <div className="pb-field pb-col-full"><label className="pb-label">Description</label>
                          <textarea className="pb-textarea" rows={3} placeholder="Led a team of 12…" value={leader.desc} onChange={e=>updLeader(leader.id,'desc',e.target.value)}/></div>
                      </div>
                    </div>
                  ))}
                  <AddBtn onClick={addItem(setLeaders,makeLeader)} label="Add leadership role"/>
                </div>
              ) : <SkippedMsg/>}
            </section>

            {/* VOLUNTEER */}
            <section id="pb-sec-volunteer" style={cardStyle(8)} className="pb-section">
              <SectionHeader id="volunteer" label="Volunteer experience" mandatory={false}/>
              {secEnabled.volunteer ? (
                <div className="pb-section-body">
                  {volunteers.map((vol,i) => (
                    <div key={vol.id} className="pb-entry-card">
                      <div className="pb-entry-label">Volunteer experience #{i+1}</div>
                      {volunteers.length>1 && <RemoveBtn onClick={()=>removeItem(setVolunteers)(vol.id)}/>}
                      <div className="pb-grid">
                        <div className="pb-field"><label className="pb-label">Organization</label>
                          <input className="pb-input" placeholder="NGO / Community" value={vol.org} onChange={e=>updVol(vol.id,'org',e.target.value)}/></div>
                        <div className="pb-field"><label className="pb-label">Role</label>
                          <input className="pb-input" placeholder="Mentor" value={vol.role} onChange={e=>updVol(vol.id,'role',e.target.value)}/></div>
                        <div className="pb-field"><label className="pb-label">Duration</label>
                          <input className="pb-input" placeholder="Jan 2023 – Mar 2023" value={vol.duration} onChange={e=>updVol(vol.id,'duration',e.target.value)}/></div>
                        <div className="pb-field pb-col-full"><label className="pb-label">Description</label>
                          <textarea className="pb-textarea" rows={3} placeholder="Mentored 20 students…" value={vol.desc} onChange={e=>updVol(vol.id,'desc',e.target.value)}/></div>
                      </div>
                    </div>
                  ))}
                  <AddBtn onClick={addItem(setVolunteers,makeVol)} label="Add volunteer experience"/>
                </div>
              ) : <SkippedMsg/>}
            </section>

            {/* PUBLICATIONS */}
            <section id="pb-sec-pubs" style={cardStyle(9)} className="pb-section">
              <SectionHeader id="pubs" label="Publications" mandatory={false}/>
              {secEnabled.pubs ? (
                <div className="pb-section-body">
                  {pubs.map((pub,i) => (
                    <div key={pub.id} className="pb-entry-card">
                      <div className="pb-entry-label">Publication #{i+1}</div>
                      {pubs.length>1 && <RemoveBtn onClick={()=>removeItem(setPubs)(pub.id)}/>}
                      <div className="pb-grid">
                        <div className="pb-field"><label className="pb-label">Title</label>
                          <input className="pb-input" placeholder="Deep Learning for NLP" value={pub.title} onChange={e=>updPub(pub.id,'title',e.target.value)}/></div>
                        <div className="pb-field"><label className="pb-label">Conference / Journal</label>
                          <input className="pb-input" placeholder="NeurIPS 2024" value={pub.conference} onChange={e=>updPub(pub.id,'conference',e.target.value)}/></div>
                        <div className="pb-field"><label className="pb-label">Year</label>
                          <input className="pb-input" placeholder="2025" value={pub.year} onChange={e=>updPub(pub.id,'year',e.target.value)}/></div>
                        <div className="pb-field"><label className="pb-label">Publication link</label>
                          <input className="pb-input" placeholder="https://arxiv.org/..." value={pub.link} onChange={e=>updPub(pub.id,'link',e.target.value)}/></div>
                      </div>
                    </div>
                  ))}
                  <AddBtn onClick={addItem(setPubs,makePub)} label="Add publication"/>
                </div>
              ) : <SkippedMsg/>}
            </section>

            {/* EXTRAS */}
            <section id="pb-sec-extras" style={cardStyle(10)} className="pb-section">
              <SectionHeader id="extras" label="Achievements & interests" mandatory={false}/>
              {secEnabled.extras ? (
                <div className="pb-section-body">
                  <div className="pb-grid">
                    <div className="pb-field pb-col-full"><label className="pb-label" htmlFor="pb-achievements">Achievements (one per line)</label>
                      <textarea id="pb-achievements" className="pb-textarea" rows={4} placeholder="Enter one achievement per line"
                        value={extras.achievements} onChange={e=>setExtras(x=>({...x,achievements:e.target.value}))}/></div>
                    <div className="pb-field pb-col-full"><label className="pb-label">Interests</label>
                      <TagInput value={extras.interests} placeholder="Chess, Cricket, Open Source…" onChange={v=>setExtras(x=>({...x,interests:v}))}/></div>
                  </div>
                </div>
              ) : <SkippedMsg/>}
            </section>

            {/* WIZARD NAV — shown on every regular card (not on the final review card) */}
            {step < NAV_SECTIONS.length && (
              <div className="pb-wizard-nav">
                <button type="button" className="pb-wizard-btn pb-wizard-back" onClick={goBack} disabled={step===0}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Back
                </button>
                <span className="pb-wizard-progress-text">Step {step+1} of {totalSteps}</span>
                <button type="button" className="pb-wizard-btn pb-wizard-next" onClick={goNext}>
                  {step === NAV_SECTIONS.length - 1 ? 'Review & Submit' : 'Next'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            )}

            {/* REVIEW & SUBMIT (final card: consent + complete profile) */}
            <div style={{ display: step === NAV_SECTIONS.length ? undefined : 'none' }}>
              <button type="button" className="pb-wizard-btn pb-wizard-back pb-review-back" onClick={goBack}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back to Extras
              </button>

              {/* CONSENT */}
              <div id="pb-consent-section" className={`pb-consent-card${consentError?' pb-consent-error':''}`}>
                <div className="auth-terms-row">
                  <input id="consent-storage" type="checkbox" className="auth-checkbox" checked={consent.storage}
                    onChange={e=>{setConsent(c=>({...c,storage:e.target.checked}));if(e.target.checked&&consent.recruiter)setConsentError(false);}}/>
                  <label htmlFor="consent-storage" className="auth-terms-text">
                    My profile data will be securely stored and used to maintain my SkillSphere profile.
                  </label>
                </div>
                <div className="auth-terms-row">
                  <input id="consent-recruiter" type="checkbox" className="auth-checkbox" checked={consent.recruiter}
                    onChange={e=>{setConsent(c=>({...c,recruiter:e.target.checked}));if(e.target.checked&&consent.storage)setConsentError(false);}}/>
                  <label htmlFor="consent-recruiter" className="auth-terms-text">
                    My skills, projects, certifications, and documents may be viewed by recruiters and hiring companies on SkillSphere.
                  </label>
                </div>
                {consentError && (
                  <p className="pb-consent-err-text">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Please tick both checkboxes to complete your profile.
                  </p>
                )}
              </div>

              {/* BOTTOM BAR */}
              <div className={`pb-bottom-bar${formErrors.length>0?' pb-bottom-bar-error':''}`}>
                <p className="pb-bottom-hint">
                  {formErrors.length>0 ? (
                    <span className="pb-bottom-err-text">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Please fix the required fields highlighted above.
                    </span>
                  ) : !bothAgreed ? (
                    <span style={{fontSize:'0.76rem',color:'rgba(255,255,255,0.35)'}}>
                      Tick both consent boxes above to enable the Complete profile button.
                    </span>
                  ) : 'You can edit any of this later from your profile.'}
                </p>
                <button
                  id="btn-complete-profile"
                  className={`pb-complete-link${(!bothAgreed||submitting)?' pb-complete-link-disabled':''}`}
                  onClick={handleComplete}
                  disabled={submitting}
                >
                  {submitting ? 'Saving…' : 'Complete profile'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}