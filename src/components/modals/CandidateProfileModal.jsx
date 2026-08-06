import React, { useState, useEffect } from 'react';
import { getCandidateProfile } from '../../services/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Free-text link fields may be saved without a scheme (e.g. "linkedin.com/in/x"),
// which the browser would otherwise resolve against our own origin.
const externalUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};
const fileUrl = (path) => (path ? (/^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`) : null);

/* ─── Icons ─── */
const IconClose = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconMapPin = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
const IconMail = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
const IconLinkedin = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>;
const IconGithub = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>;
const IconGlobe = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const IconAlert = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;

const fmtDate = (ym, current) => {
  if (current) return 'Present';
  if (!ym) return '';
  const [y, m] = ym.split('-');
  if (!m) return y || '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(m) - 1] || ''} ${y}`;
};

/* ─── Small building blocks ─── */
const SectionTitle = ({ children }) => (
  <h4 className="font-sans text-[0.95rem] font-bold text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border-subtle)]">{children}</h4>
);

const EmptyNote = ({ label }) => (
  <p className="font-sans text-[0.8rem] text-[var(--text-muted)] italic">No {label} added.</p>
);

const SkillPills = ({ items }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((s, i) => (
      <span key={i} className="px-2.5 py-1 bg-[var(--bg-body)] border border-[var(--border-card)] rounded-md font-sans text-[0.78rem] text-[var(--text-secondary)]">{s}</span>
    ))}
  </div>
);

export default function CandidateProfileModal({ isOpen, onClose, candidateId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revealedEmail, setRevealedEmail] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    if (!isOpen || !candidateId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setProfile(null);
    setRevealedEmail(false);
    setPhotoFailed(false);
    (async () => {
      try {
        const p = await getCandidateProfile(candidateId);
        if (!cancelled) setProfile(p);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.status === 404
              ? "This candidate's profile isn't available for viewing right now."
              : 'Could not load this candidate\'s profile. Please try again.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, candidateId]);

  if (!isOpen) return null;

  const p = profile;
  const personal = p?.personal || {};
  const sec = p?.secEnabled || {};
  const initials = (personal.fullName || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '—';
  const skills = p ? [
    ...(p.skills?.languages || []),
    ...(p.skills?.frameworks || []),
    ...(p.skills?.tools || []),
    ...(p.skills?.libraries || []),
  ] : [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-[720px] bg-[var(--bg-card)] rounded-2xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.6)] border border-[var(--border-card)] overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-card)] shrink-0">
          <h3 className="font-sans text-[1.05rem] font-bold text-[var(--text-primary)]">Candidate Profile</h3>
          <button onClick={onClose} className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">
            <IconClose />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex flex-col gap-6">
          {loading && (
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="h-24 rounded-xl bg-[var(--bg-card-hover)]" />
              <div className="h-32 rounded-xl bg-[var(--bg-card-hover)]" />
              <div className="h-32 rounded-xl bg-[var(--bg-card-hover)]" />
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 font-sans text-[0.85rem]">
              <IconAlert /> {error}
            </div>
          )}

          {!loading && !error && p && (
            <>
              {/* Profile header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center overflow-hidden border border-[var(--border-card)] shrink-0">
                  {personal.photoUrl && !photoFailed ? (
                    <img
                      src={fileUrl(personal.photoUrl)}
                      alt={personal.fullName}
                      onError={() => setPhotoFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-sans text-2xl font-black text-white tracking-widest">{initials}</span>
                  )}
                </div>
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-sans text-xl font-extrabold text-[var(--text-primary)] tracking-tight">{personal.fullName || 'Unnamed Candidate'}</h2>
                    {p.user?.isVerified && <IconCheck className="text-[var(--accent)]" />}
                  </div>
                  {personal.title && <p className="font-sans text-[0.95rem] text-[var(--accent)] font-semibold">{personal.title}</p>}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2">
                    {personal.location && (
                      <span className="flex items-center gap-1 font-sans text-[0.8rem] text-[var(--text-muted)]"><IconMapPin /> {personal.location}</span>
                    )}
                    {typeof p.experienceYears === 'number' && (
                      <span className="font-sans text-[0.8rem] text-[var(--text-muted)]">{p.experienceYears} yrs experience</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    {personal.linkedin && (
                      <a href={externalUrl(personal.linkedin)} target="_blank" rel="noreferrer" className="p-1.5 rounded-md border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[#0077b5] hover:border-[#0077b5]/40 transition-colors"><IconLinkedin /></a>
                    )}
                    {personal.github && (
                      <a href={externalUrl(personal.github)} target="_blank" rel="noreferrer" className="p-1.5 rounded-md border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"><IconGithub /></a>
                    )}
                    {personal.portfolio && (
                      <a href={externalUrl(personal.portfolio)} target="_blank" rel="noreferrer" className="p-1.5 rounded-md border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"><IconGlobe /></a>
                    )}
                    <button
                      onClick={() => setRevealedEmail((v) => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border-card)] text-[0.78rem] font-sans font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                    >
                      <IconMail /> {revealedEmail ? (personal.email || p.user?.email) : 'Email'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {personal.summary && (
                <div>
                  <SectionTitle>Summary</SectionTitle>
                  <p className="font-sans text-[0.88rem] text-[var(--text-secondary)] leading-relaxed">{personal.summary}</p>
                </div>
              )}

              {/* Education */}
              <div>
                <SectionTitle>Education</SectionTitle>
                {(p.educations || []).length ? (
                  <div className="flex flex-col gap-3">
                    {p.educations.map((e, i) => (
                      <div key={i} className="bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] rounded-xl p-4">
                        <p className="font-sans text-[0.9rem] font-semibold text-[var(--text-primary)]">{e.degree}{e.field ? ` in ${e.field}` : ''}</p>
                        <p className="font-sans text-[0.85rem] text-[var(--text-secondary)]">{e.institution}{e.location ? ` · ${e.location}` : ''}</p>
                        <p className="font-sans text-[0.75rem] text-[var(--text-muted)] mt-1">{fmtDate(e.startDate)} – {fmtDate(e.endDate, e.endDate === 'Present')}{e.gpa ? ` · GPA ${e.gpa}` : ''}</p>
                      </div>
                    ))}
                  </div>
                ) : <EmptyNote label="education" />}
              </div>

              {/* Experience */}
              {sec.experience !== false && (
                <div>
                  <SectionTitle>Experience</SectionTitle>
                  {(p.experiences || []).length ? (
                    <div className="flex flex-col gap-3">
                      {p.experiences.map((e, i) => (
                        <div key={i} className="bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] rounded-xl p-4">
                          <p className="font-sans text-[0.9rem] font-semibold text-[var(--text-primary)]">{e.title}</p>
                          <p className="font-sans text-[0.85rem] text-[var(--text-secondary)]">{e.company}{e.location ? ` · ${e.location}` : ''}</p>
                          <p className="font-sans text-[0.75rem] text-[var(--text-muted)] mt-1">{fmtDate(e.startDate)} – {e.current ? 'Present' : fmtDate(e.endDate)}</p>
                          {e.responsibilities && <p className="font-sans text-[0.82rem] text-[var(--text-secondary)] mt-2 leading-relaxed">{e.responsibilities}</p>}
                        </div>
                      ))}
                    </div>
                  ) : <EmptyNote label="experience" />}
                </div>
              )}

              {/* Projects */}
              <div>
                <SectionTitle>Projects</SectionTitle>
                {(p.projects || []).length ? (
                  <div className="flex flex-col gap-3">
                    {p.projects.map((pr, i) => (
                      <div key={i} className="bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] rounded-xl p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-sans text-[0.9rem] font-semibold text-[var(--text-primary)]">{pr.name}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            {pr.repo && <a href={externalUrl(pr.repo)} target="_blank" rel="noreferrer" className="font-sans text-[0.75rem] font-semibold text-[var(--accent)] hover:underline">Repo</a>}
                            {pr.live && <a href={externalUrl(pr.live)} target="_blank" rel="noreferrer" className="font-sans text-[0.75rem] font-semibold text-[var(--accent)] hover:underline">Live</a>}
                          </div>
                        </div>
                        {pr.tech && <p className="font-sans text-[0.78rem] text-[var(--text-muted)] mt-1">{pr.tech}</p>}
                        {pr.desc && <p className="font-sans text-[0.82rem] text-[var(--text-secondary)] mt-2 leading-relaxed">{pr.desc}</p>}
                      </div>
                    ))}
                  </div>
                ) : <EmptyNote label="projects" />}
              </div>

              {/* Skills */}
              <div>
                <SectionTitle>Technical Skills</SectionTitle>
                {skills.length ? <SkillPills items={skills} /> : <EmptyNote label="skills" />}
              </div>

              {/* Certifications */}
              {sec.certs !== false && (
                <div>
                  <SectionTitle>Certifications</SectionTitle>
                  {(p.certs || []).length ? (
                    <div className="flex flex-col gap-3">
                      {p.certs.map((c, i) => (
                        <div key={i} className="bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] rounded-xl p-4 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-sans text-[0.9rem] font-semibold text-[var(--text-primary)] truncate">{c.name}</p>
                            <p className="font-sans text-[0.8rem] text-[var(--text-secondary)] truncate">{c.org}{c.issueDate ? ` · ${c.issueDate}` : ''}</p>
                          </div>
                          {(c.credUrl || c.certPdfUrl) && (
                            <a href={externalUrl(c.credUrl) || fileUrl(c.certPdfUrl)} target="_blank" rel="noreferrer" className="font-sans text-[0.75rem] font-semibold text-[var(--accent)] hover:underline shrink-0">View</a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : <EmptyNote label="certifications" />}
                </div>
              )}

              {/* Awards */}
              {sec.awards !== false && (
                <div>
                  <SectionTitle>Awards</SectionTitle>
                  {(p.awards || []).length ? (
                    <div className="flex flex-col gap-2">
                      {p.awards.map((a, i) => (
                        <p key={i} className="font-sans text-[0.85rem] text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">{a.name}</span> — {a.org} {a.year ? `(${a.year})` : ''}</p>
                      ))}
                    </div>
                  ) : <EmptyNote label="awards" />}
                </div>
              )}

              {/* Leadership */}
              {sec.leadership !== false && (
                <div>
                  <SectionTitle>Leadership</SectionTitle>
                  {(p.leaders || []).length ? (
                    <div className="flex flex-col gap-2">
                      {p.leaders.map((l, i) => (
                        <div key={i}>
                          <p className="font-sans text-[0.85rem] text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">{l.position}</span> — {l.org} {l.duration ? `(${l.duration})` : ''}</p>
                          {l.desc && <p className="font-sans text-[0.8rem] text-[var(--text-muted)] mt-0.5">{l.desc}</p>}
                        </div>
                      ))}
                    </div>
                  ) : <EmptyNote label="leadership roles" />}
                </div>
              )}

              {/* Volunteer */}
              {sec.volunteer !== false && (
                <div>
                  <SectionTitle>Volunteer</SectionTitle>
                  {(p.volunteers || []).length ? (
                    <div className="flex flex-col gap-2">
                      {p.volunteers.map((v, i) => (
                        <div key={i}>
                          <p className="font-sans text-[0.85rem] text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">{v.role}</span> — {v.org} {v.duration ? `(${v.duration})` : ''}</p>
                          {v.desc && <p className="font-sans text-[0.8rem] text-[var(--text-muted)] mt-0.5">{v.desc}</p>}
                        </div>
                      ))}
                    </div>
                  ) : <EmptyNote label="volunteer work" />}
                </div>
              )}

              {/* Publications */}
              {sec.pubs !== false && (
                <div>
                  <SectionTitle>Publications</SectionTitle>
                  {(p.pubs || []).length ? (
                    <div className="flex flex-col gap-2">
                      {p.pubs.map((pub, i) => (
                        <p key={i} className="font-sans text-[0.85rem] text-[var(--text-secondary)]">
                          <span className="font-semibold text-[var(--text-primary)]">{pub.title}</span> — {pub.conference} {pub.year ? `(${pub.year})` : ''}
                          {pub.link && <> · <a href={externalUrl(pub.link)} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">Link</a></>}
                        </p>
                      ))}
                    </div>
                  ) : <EmptyNote label="publications" />}
                </div>
              )}

              {/* Achievements */}
              {sec.extras !== false && (
                <div>
                  <SectionTitle>Achievements</SectionTitle>
                  {p.extras?.achievements ? (
                    <p className="font-sans text-[0.85rem] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">{p.extras.achievements}</p>
                  ) : <EmptyNote label="achievements" />}
                  {(p.extras?.interests || []).length > 0 && (
                    <div className="mt-3">
                      <SkillPills items={p.extras.interests} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}