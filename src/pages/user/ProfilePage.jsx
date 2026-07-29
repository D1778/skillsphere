import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LogoMark } from '../../components/shared/Topbar';
import { getProfile, saveProfile } from '../../services/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Social/portfolio links are free-text fields, so a candidate might save
// "linkedin.com/in/name" without a scheme. A scheme-less href is treated
// as relative by the browser and resolves against our own origin
// (localhost/production) instead of opening the external site — prefix
// https:// whenever one isn't already present.
const externalUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

/* ─── Inline SVG Icons ─── */
const IconUser = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconGraduationCap = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const IconBriefcase = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const IconRocket = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>;
const IconWrench = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const IconAward = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>;
const IconTrophy = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
const IconUsers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconHeart = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IconBookOpen = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconStar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconMapPin = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconCamera = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IconEdit2 = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
const IconClose = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

/* ── One cohesive color family (cyan → indigo → blue → violet) instead of
   an 11-hue rainbow — cycled across sections so the page reads as one
   consistent product instead of every tab having its own random theme. ── */
const THEMES = {
  cyan:   { bg: 'bg-cyan-500',   bgHover: 'hover:bg-cyan-600',   shadow: 'shadow-cyan-500/20',   textMuted: 'text-cyan-400/80',   blob: 'bg-cyan-500/5',   btnBg: 'bg-cyan-500/10',   btnHover: 'hover:bg-cyan-500/20',   btnBorder: 'border-cyan-500/30',   focus: 'focus:border-cyan-500/50',   color: 'text-cyan-400',   glow: 'shadow-[0_0_15px_rgba(34,211,238,0.2)]',   solid: '#22d3ee' },
  indigo: { bg: 'bg-indigo-500', bgHover: 'hover:bg-indigo-600', shadow: 'shadow-indigo-500/20', textMuted: 'text-indigo-400/80', blob: 'bg-indigo-500/5', btnBg: 'bg-indigo-500/10', btnHover: 'hover:bg-indigo-500/20', btnBorder: 'border-indigo-500/30', focus: 'focus:border-indigo-500/50', color: 'text-indigo-300', glow: 'shadow-[0_0_15px_rgba(129,140,248,0.2)]', solid: '#818cf8' },
  blue:   { bg: 'bg-blue-500',   bgHover: 'hover:bg-blue-600',   shadow: 'shadow-blue-500/20',   textMuted: 'text-blue-400/80',   blob: 'bg-blue-500/5',   btnBg: 'bg-blue-500/10',   btnHover: 'hover:bg-blue-500/20',   btnBorder: 'border-blue-500/30',   focus: 'focus:border-blue-500/50',   color: 'text-blue-400',   glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]',   solid: '#3b82f6' },
  violet: { bg: 'bg-violet-500', bgHover: 'hover:bg-violet-600', shadow: 'shadow-violet-500/20', textMuted: 'text-violet-400/80', blob: 'bg-violet-500/5', btnBg: 'bg-violet-500/10', btnHover: 'hover:bg-violet-500/20', btnBorder: 'border-violet-500/30', focus: 'focus:border-violet-500/50', color: 'text-violet-300', glow: 'shadow-[0_0_15px_rgba(167,139,250,0.2)]', solid: '#a78bfa' },
};
const THEME_CYCLE = ['cyan', 'indigo', 'blue', 'violet'];

/* ─── Profile section registry ───
   'Address' was dropped — nothing in profile.model.js backs Country/City/
   Postal Code, so keeping it would mean data that silently vanishes on
   save. Add those fields to the schema first if it's needed back. */
const PROFILE_SECTIONS = [
  { id: 'personal', title: 'Personal info', icon: IconUser },
  { id: 'education', title: 'Education', icon: IconGraduationCap },
  { id: 'experience', title: 'Experience', icon: IconBriefcase },
  { id: 'projects', title: 'Projects', icon: IconRocket },
  { id: 'skills', title: 'Technical skills', icon: IconWrench },
  { id: 'certifications', title: 'Certifications', icon: IconAward },
  { id: 'awards', title: 'Awards', icon: IconTrophy },
  { id: 'leadership', title: 'Leadership', icon: IconUsers },
  { id: 'volunteer', title: 'Volunteer', icon: IconHeart },
  { id: 'publications', title: 'Publications', icon: IconBookOpen },
  { id: 'achievements', title: 'Achievements', icon: IconStar },
].map((s, i) => {
  const themeKey = THEME_CYCLE[i % THEME_CYCLE.length];
  const theme = THEMES[themeKey];
  return { ...s, baseColor: themeKey, color: theme.color, glow: theme.glow };
});

/* ─── Dynamic Form Configuration ───
   Skills categories are narrowed to the 4 the schema actually has
   (languages/frameworks/tools/libraries) — the old dropdown offered
   Databases/Cloud/Soft Skills/Other, which had nowhere to be saved. */
const FORM_CONFIGS = {
  personal: {
    type: 'single',
    fields: [
      { name: 'Full Name' },
      { name: 'Role / Headline' },
      { name: 'Location' },
      { name: 'Email Address' },
      { name: 'Phone Number' },
      { name: 'LinkedIn' },
      { name: 'GitHub' },
      { name: 'Portfolio / Website' },
    ]
  },
  education: {
    type: 'list', itemLabel: 'Education',
    fields: [
      { name: 'School / University' },
      { name: 'Degree' },
      { name: 'Start Year', options: Array.from({length: 51}, (_, i) => String(2025 - i)) },
      { name: 'End Year', options: ['Present', ...Array.from({length: 56}, (_, i) => String(2030 - i))] }
    ]
  },
  experience: {
    type: 'list', itemLabel: 'Experience',
    fields: [
      { name: 'Company' },
      { name: 'Job Title' },
      { name: 'Start Date' },
      { name: 'End Date' },
      { name: 'Description' }
    ]
  },
  projects: {
    type: 'list', itemLabel: 'Project',
    fields: [
      { name: 'Project Name' },
      { name: 'Link' },
      { name: 'Tech Stack' },
      { name: 'Description' }
    ]
  },
  skills: {
    type: 'list', itemLabel: 'Skill Category',
    fields: [
      { name: 'Category Name', options: ['Languages', 'Frameworks', 'Tools', 'Libraries'] },
      { name: 'Skills (comma separated)' }
    ]
  },
  certifications: {
    type: 'list', itemLabel: 'Certification',
    fields: [
      { name: 'Certification Name' },
      { name: 'Issuing Organization' },
      { name: 'Issue Date' },
      { name: 'Credential URL' }
    ]
  },
  awards: {
    type: 'list', itemLabel: 'Award',
    fields: [
      { name: 'Award Title' },
      { name: 'Issuer' },
      { name: 'Date' }
    ]
  },
  leadership: {
    type: 'list', itemLabel: 'Leadership Role',
    fields: [
      { name: 'Role' },
      { name: 'Organization' },
      { name: 'Duration' }
    ]
  },
  volunteer: {
    type: 'list', itemLabel: 'Volunteer Work',
    fields: [
      { name: 'Role' },
      { name: 'Organization' },
      { name: 'Duration' }
    ]
  },
  publications: {
    type: 'list', itemLabel: 'Publication',
    fields: [
      { name: 'Title' },
      { name: 'Conference / journal' },
      { name: 'Year' },
      { name: 'Publication link' }
    ]
  },
  achievements: {
    type: 'list', itemLabel: 'Achievement',
    fields: [
      { name: 'Achievement / Highlight' }
    ]
  }
};

const uid = () => Math.random().toString(36).slice(2, 11);

/* ═══════════════════════════════════════════════════
   SECTION ADAPTERS
   Convert between the profile document's real shape and the flat
   { 'Display Label': value } rows the generic form renders, and back.
   Unexposed backend fields (e.g. education.gpa, project.live) are kept
   on `_raw` and spread back in on save so editing one field never wipes
   fields this form doesn't show.
═══════════════════════════════════════════════════ */
const SECTION_ADAPTERS = {
  personal: {
    backendKey: 'personal',
    toItems: (profile) => {
      const p = profile.personal || {};
      return [{
        _id: 'personal', _raw: p,
        'Full Name': p.fullName || '',
        'Role / Headline': p.title || '',
        'Location': p.location || '',
        'Email Address': p.email || '',
        'Phone Number': p.phone || '',
        'LinkedIn': p.linkedin || '',
        'GitHub': p.github || '',
        'Portfolio / Website': p.portfolio || '',
      }];
    },
    fromItems: (items, profile) => {
      const item = items[0] || {};
      return {
        ...(profile.personal || {}),
        fullName: item['Full Name'] || '',
        title: item['Role / Headline'] || '',
        location: item['Location'] || '',
        email: item['Email Address'] || '',
        phone: item['Phone Number'] || '',
        linkedin: item['LinkedIn'] || '',
        github: item['GitHub'] || '',
        portfolio: item['Portfolio / Website'] || '',
      };
    },
  },
  education: {
    backendKey: 'educations',
    toItems: (profile) => (profile.educations || []).map((e, i) => ({
      _id: `edu-${i}`, _raw: e,
      'School / University': e.institution || '', 'Degree': e.degree || '',
      'Start Year': e.startDate || '', 'End Year': e.endDate || '',
    })),
    fromItems: (items) => items.map((item) => ({
      ...(item._raw || {}),
      institution: item['School / University'] || '', degree: item['Degree'] || '',
      startDate: item['Start Year'] || '', endDate: item['End Year'] || '',
    })),
  },
  experience: {
    backendKey: 'experiences',
    toItems: (profile) => (profile.experiences || []).map((e, i) => ({
      _id: `exp-${i}`, _raw: e,
      'Company': e.company || '', 'Job Title': e.title || '',
      'Start Date': e.startDate || '', 'End Date': e.endDate || '', 'Description': e.responsibilities || '',
    })),
    fromItems: (items) => items.map((item) => ({
      ...(item._raw || {}),
      company: item['Company'] || '', title: item['Job Title'] || '',
      startDate: item['Start Date'] || '', endDate: item['End Date'] || '', responsibilities: item['Description'] || '',
    })),
  },
  projects: {
    backendKey: 'projects',
    toItems: (profile) => (profile.projects || []).map((p, i) => ({
      _id: `proj-${i}`, _raw: p,
      'Project Name': p.name || '', 'Link': p.repo || p.live || '',
      'Tech Stack': p.tech || '', 'Description': p.desc || '',
    })),
    fromItems: (items) => items.map((item) => ({
      ...(item._raw || {}),
      name: item['Project Name'] || '', repo: item['Link'] || '',
      tech: item['Tech Stack'] || '', desc: item['Description'] || '',
    })),
  },
  skills: {
    backendKey: 'skills',
    toItems: (profile) => {
      const s = profile.skills || {};
      const cats = [['Languages', 'languages'], ['Frameworks', 'frameworks'], ['Tools', 'tools'], ['Libraries', 'libraries']];
      const rows = cats
        .filter(([, key]) => (s[key] || []).length)
        .map(([label, key]) => ({ _id: key, 'Category Name': label, 'Skills (comma separated)': (s[key] || []).join(', ') }));
      return rows.length ? rows : [{ _id: 'languages', 'Category Name': 'Languages', 'Skills (comma separated)': '' }];
    },
    fromItems: (items) => {
      const result = { languages: [], frameworks: [], tools: [], libraries: [] };
      const labelToKey = { Languages: 'languages', Frameworks: 'frameworks', Tools: 'tools', Libraries: 'libraries' };
      items.forEach((item) => {
        const key = labelToKey[item['Category Name']];
        if (!key) return;
        const list = (item['Skills (comma separated)'] || '').split(',').map((s) => s.trim()).filter(Boolean);
        result[key] = [...result[key], ...list];
      });
      return result;
    },
  },
  certifications: {
    backendKey: 'certs',
    toItems: (profile) => (profile.certs || []).map((c, i) => ({
      _id: `cert-${i}`, _raw: c,
      'Certification Name': c.name || '', 'Issuing Organization': c.org || '',
      'Issue Date': c.issueDate || '', 'Credential URL': c.credUrl || '',
    })),
    fromItems: (items) => items.map((item) => ({
      ...(item._raw || {}),
      name: item['Certification Name'] || '', org: item['Issuing Organization'] || '',
      issueDate: item['Issue Date'] || '', credUrl: item['Credential URL'] || '',
    })),
  },
  awards: {
    backendKey: 'awards',
    toItems: (profile) => (profile.awards || []).map((a, i) => ({
      _id: `award-${i}`, _raw: a,
      'Award Title': a.name || '', 'Issuer': a.org || '', 'Date': a.year || '',
    })),
    fromItems: (items) => items.map((item) => ({
      ...(item._raw || {}),
      name: item['Award Title'] || '', org: item['Issuer'] || '', year: item['Date'] || '',
    })),
  },
  leadership: {
    backendKey: 'leaders',
    toItems: (profile) => (profile.leaders || []).map((l, i) => ({
      _id: `lead-${i}`, _raw: l,
      'Role': l.position || '', 'Organization': l.org || '', 'Duration': l.duration || '',
    })),
    fromItems: (items) => items.map((item) => ({
      ...(item._raw || {}),
      position: item['Role'] || '', org: item['Organization'] || '', duration: item['Duration'] || '',
    })),
  },
  volunteer: {
    backendKey: 'volunteers',
    toItems: (profile) => (profile.volunteers || []).map((v, i) => ({
      _id: `vol-${i}`, _raw: v,
      'Role': v.role || '', 'Organization': v.org || '', 'Duration': v.duration || '',
    })),
    fromItems: (items) => items.map((item) => ({
      ...(item._raw || {}),
      role: item['Role'] || '', org: item['Organization'] || '', duration: item['Duration'] || '',
    })),
  },
  publications: {
    backendKey: 'pubs',
    toItems: (profile) => (profile.pubs || []).map((p, i) => ({
      _id: `pub-${i}`, _raw: p,
      'Title': p.title || '', 'Conference / journal': p.conference || '',
      'Year': p.year || '', 'Publication link': p.link || '',
    })),
    fromItems: (items) => items.map((item) => ({
      ...(item._raw || {}),
      title: item['Title'] || '', conference: item['Conference / journal'] || '',
      year: item['Year'] || '', link: item['Publication link'] || '',
    })),
  },
  achievements: {
    backendKey: 'extras',
    toItems: (profile) => {
      const lines = (profile.extras?.achievements || '').split('\n').map((s) => s.trim()).filter(Boolean);
      return (lines.length ? lines : ['']).map((line, i) => ({ _id: `ach-${i}`, 'Achievement / Highlight': line }));
    },
    fromItems: (items, profile) => ({
      ...(profile.extras || {}),
      achievements: items.map((i) => (i['Achievement / Highlight'] || '').trim()).filter(Boolean).join('\n'),
    }),
  },
};

/* ═══════════════════════════════════════════════════
   CUSTOM SELECT
═══════════════════════════════════════════════════ */
const CustomSelect = ({ value, options, onChange, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-4 py-2.5 text-[0.9rem] text-[var(--text-primary)] font-sans flex items-center justify-between cursor-pointer hover:border-[var(--border-hover)] transition-all shadow-inner"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate pr-2">{value || 'Select an option'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-card)] rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.35)] z-[100] overflow-hidden max-h-36 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => (
            <div
              key={opt}
              className={`px-4 py-2.5 text-[0.9rem] font-sans cursor-pointer transition-colors ${value === opt ? `${theme.btnBg} ${theme.color}` : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`}
              onClick={() => { onChange(opt); setIsOpen(false); }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   SKELETON — used both for the hover preview tooltip and
   the brief "just committed" transition after clicking a tab.
═══════════════════════════════════════════════════ */
const SectionSkeleton = ({ solid = '#22d3ee', rows = 3, compact = false }) => (
  <div className={`flex flex-col gap-3 ${compact ? '' : 'animate-pulse'}`}>
    <div className="h-4 w-32 rounded" style={{ background: `${solid}26` }} />
    <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl" style={{ background: `${solid}14`, border: `1px solid ${solid}22` }} />
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   SECTION CONTENT
═══════════════════════════════════════════════════ */
const ProfileSectionContent = ({ sectionId, isEditing, setIsEditing, initialItems, onSave, justSwitched, readOnly }) => {
  const config = FORM_CONFIGS[sectionId];
  const sectionInfo = PROFILE_SECTIONS.find((s) => s.id === sectionId);
  const theme = THEMES[sectionInfo.baseColor] || THEMES.cyan;
  const [items, setItems] = useState(initialItems);
  const [backupItems, setBackupItems] = useState(initialItems);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (isEditing) return;
    setItems(initialItems);
    setBackupItems(initialItems);
  }, [sectionId, initialItems, isEditing]);

  const handleAddItem = () => {
    const newItem = { ...config.fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {}), _id: uid() };
    setItems([...items, newItem]);
  };
  const handleRemoveItem = (index) => setItems(items.filter((_, i) => i !== index));
  const handleChange = (index, fieldName, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [fieldName]: value };
    setItems(newItems);
  };

  const handleToggleEdit = async () => {
    if (isEditing) {
      setSaving(true);
      setSaveError('');
      try {
        await onSave(items);
        setBackupItems(items);
        setIsEditing(false);
      } catch {
        setSaveError('Could not save your changes. Please try again.');
      } finally {
        setSaving(false);
      }
    } else {
      setBackupItems(items);
      setIsEditing(true);
    }
  };
  const handleCancel = () => {
    setItems(backupItems);
    setIsEditing(false);
    setSaveError('');
  };

  if (justSwitched) {
    return (
      <div className="w-full card-glass rounded-2xl p-6 md:p-8">
        <SectionSkeleton solid={theme.solid} rows={config.type === 'list' ? 4 : 5} />
      </div>
    );
  }

  return (
    <div className="w-full card-glass rounded-2xl p-6 md:p-8 animate-in fade-in duration-300 relative group">
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 ${theme.blob} rounded-full blur-[60px] transition-all duration-700`}></div>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-card)] shadow-sm ${sectionInfo.color}`}>
            <sectionInfo.icon />
          </div>
          <h3 className="font-sans text-[1.1rem] font-semibold text-[var(--text-primary)] tracking-wide">{sectionInfo.title}</h3>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {saveError && <span className="font-sans text-[0.78rem] text-red-400">{saveError}</span>}
          {isEditing && (
            <button onClick={handleCancel} disabled={saving} className="px-4 py-2 rounded-lg bg-transparent border border-[var(--border-card)] text-[var(--text-secondary)] font-sans text-[0.8rem] font-semibold hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50">
              Cancel
            </button>
          )}
          <button
            onClick={handleToggleEdit}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${theme.bg} text-white font-sans text-[0.85rem] font-semibold ${theme.bgHover} transition-all shadow-md ${theme.shadow} active:scale-95 disabled:opacity-70`}
          >
            {saving ? 'Saving…' : (isEditing ? 'Save changes' : 'Edit')} {!saving && (isEditing ? <IconCheck /> : <IconEdit2 />)}
          </button>
        </div>
      </div>

      <div className="relative z-10">
        {config.type === 'list' ? (
          <div className="flex flex-col gap-6">
            {items.map((item, index) => (
              <div key={item._id} className="relative bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] rounded-xl p-5 md:p-6 hover:border-[var(--border-hover)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                {items.length > 1 && (
                  <div className="absolute -top-3 left-6 bg-[var(--bg-card)] px-3 text-[0.7rem] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    {config.itemLabel} {index + 1}
                  </div>
                )}
                {items.length > 1 && isEditing && (
                  <button onClick={() => handleRemoveItem(index)} className="absolute -top-3.5 right-6 text-red-400 hover:text-red-300 flex items-center justify-center bg-[var(--bg-card)] hover:bg-red-500/20 rounded-full w-7 h-7 transition-colors border border-red-500/30 z-10 shadow-sm">
                    <IconClose />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
                  {config.fields.map((field) => (
                    <div key={field.name} className={`flex flex-col gap-1.5 ${field.name.toLowerCase().includes('description') ? 'md:col-span-2' : ''} ${!isEditing ? 'bg-[var(--bg-card)] border border-[var(--border-subtle)] p-4 rounded-xl' : ''}`}>
                      <label className={`font-sans text-[0.75rem] font-semibold uppercase tracking-widest ${!isEditing ? theme.textMuted : 'text-[var(--text-muted)]'}`}>{field.name}</label>
                      {isEditing ? (
                        field.name.toLowerCase().includes('description') ? (
                          <textarea value={item[field.name]} onChange={(e) => handleChange(index, field.name, e.target.value)} rows={3}
                            className={`w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-4 py-2.5 text-[0.9rem] text-[var(--text-primary)] placeholder-[var(--text-muted)] font-sans focus:outline-none ${theme.focus} transition-all resize-none shadow-inner`} />
                        ) : field.options ? (
                          <CustomSelect value={item[field.name]} options={field.options} onChange={(val) => handleChange(index, field.name, val)} theme={theme} />
                        ) : (
                          <input type="text" value={item[field.name]} onChange={(e) => handleChange(index, field.name, e.target.value)}
                            className={`w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-4 py-2.5 text-[0.9rem] text-[var(--text-primary)] placeholder-[var(--text-muted)] font-sans focus:outline-none ${theme.focus} transition-all shadow-inner`} />
                        )
                      ) : (
                        <p className="font-sans text-[0.95rem] font-medium text-[var(--text-primary)] leading-relaxed">{item[field.name] || '—'}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {isEditing && (
              <button onClick={handleAddItem} className={`self-start flex items-center gap-2 font-sans text-[0.85rem] font-semibold ${sectionInfo.color} ${theme.btnBg} ${theme.btnHover} border ${theme.btnBorder} px-5 py-2.5 rounded-lg transition-all shadow-sm active:scale-95`}>
                <IconPlus /> Add {config.itemLabel.toLowerCase()}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6">
            {config.fields.map((field) => (
              <div key={field.name} className={`flex flex-col gap-1.5 ${!isEditing ? 'bg-[var(--bg-card)] border border-[var(--border-subtle)] p-4 rounded-xl' : ''}`}>
                <label className={`font-sans text-[0.75rem] font-semibold uppercase tracking-widest ${!isEditing ? theme.textMuted : 'text-[var(--text-muted)]'}`}>{field.name}</label>
                {isEditing ? (
                  field.options ? (
                    <CustomSelect value={items[0]?.[field.name] || ''} options={field.options} onChange={(val) => handleChange(0, field.name, val)} theme={theme} />
                  ) : (
                    <input type="text" value={items[0]?.[field.name] || ''} onChange={(e) => handleChange(0, field.name, e.target.value)}
                      className={`w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-4 py-2.5 text-[0.9rem] text-[var(--text-primary)] placeholder-[var(--text-muted)] font-sans focus:outline-none ${theme.focus} transition-all shadow-inner`} />
                  )
                ) : (
                  <p className="font-sans text-[0.95rem] font-medium text-[var(--text-primary)]">{items[0]?.[field.name] || '—'}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
const computeCompletion = (p) => {
  if (!p) return 0;
  const checks = [
    !!(p.personal?.fullName && p.personal?.title),
    (p.educations || []).some((e) => e.institution?.trim()),
    (p.experiences || []).some((e) => e.company?.trim()),
    (p.projects || []).some((pr) => pr.name?.trim()),
    Object.values(p.skills || {}).some((arr) => (arr || []).length),
    (p.certs || []).some((c) => c.name?.trim()),
    (p.awards || []).some((a) => a.name?.trim()),
    (p.leaders || []).some((l) => l.position?.trim()),
    (p.volunteers || []).some((v) => v.role?.trim() || v.org?.trim()),
    (p.pubs || []).some((pu) => pu.title?.trim()),
    !!p.extras?.achievements?.trim(),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

/* ═══════════════════════════════════════════════════
   HOVER PREVIEW — reads the already-loaded profile through the same
   adapters the real section uses, so what you see on hover is exactly
   what's saved (no placeholder skeleton, no extra fetch needed).
═══════════════════════════════════════════════════ */
const getSectionPreview = (sectionId, profile) => {
  if (!profile) return [];
  const config = FORM_CONFIGS[sectionId];
  const adapter = SECTION_ADAPTERS[sectionId];
  const items = adapter.toItems(profile);

  if (config.type === 'single') {
    return config.fields
      .map((f) => ({ label: f.name, value: (items[0]?.[f.name] || '').trim() }))
      .filter((f) => f.value);
  }
  const [primaryField, secondaryField] = config.fields;
  return items
    .filter((it) => (it[primaryField.name] || '').trim())
    .slice(0, 2)
    .map((it) => ({
      title: it[primaryField.name],
      subtitle: secondaryField ? it[secondaryField.name] : '',
    }));
};

const SectionHoverPreview = ({ sectionId, profile, solid }) => {
  const config = FORM_CONFIGS[sectionId];
  const preview = getSectionPreview(sectionId, profile);

  if (!preview.length) {
    const label = PROFILE_SECTIONS.find((s) => s.id === sectionId)?.title.toLowerCase() || 'info';
    return (
      <p className="font-sans text-[0.78rem] text-[var(--text-muted)] text-center py-2">
        No {label} added yet
      </p>
    );
  }

  if (config.type === 'single') {
    return (
      <div className="flex flex-col gap-2">
        {preview.map((f) => (
          <div key={f.label} className="flex flex-col gap-0.5">
            <span className="font-sans text-[0.62rem] font-bold uppercase tracking-widest" style={{ color: solid }}>{f.label}</span>
            <span className="font-sans text-[0.85rem] font-medium text-[var(--text-primary)] truncate">{f.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {preview.map((it, i) => (
        <div key={i} className={`flex flex-col gap-0.5 ${i > 0 ? 'pt-2.5 border-t' : ''}`} style={{ borderColor: 'var(--border-subtle)' }}>
          <span className="font-sans text-[0.85rem] font-semibold text-[var(--text-primary)] truncate">{it.title}</span>
          {it.subtitle && <span className="font-sans text-[0.72rem] text-[var(--text-muted)] truncate">{it.subtitle}</span>}
        </div>
      ))}
    </div>
  );
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);

  const [activeSection, setActiveSection] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);

  // Hover-preview: hovering an inactive chip fetches nothing new (the
  // profile is already loaded) but renders a live preview of that
  // section's real, saved data after a short delay. Nothing becomes
  // "current" until clicked — clicking is what makes a section stick.
  const [hoverPreview, setHoverPreview] = useState(null);
  const hoverTimer = useRef(null);

  // After clicking a chip, the panel shows a brief skeleton before the
  // (already-loaded) real content settles in and "sticks".
  const [justSwitched, setJustSwitched] = useState(false);
  const switchTimer = useRef(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getProfile();
        if (!cancelled) setProfile(p);
      } catch {
        if (!cancelled) setProfileError('Could not load your profile. Please refresh the page.');
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handlePhotoClick = () => fileInputRef.current?.click();
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const updated = await saveProfile({}, file);
      setProfile(updated);
    } catch {
      setProfileError('Could not upload photo. Please try again.');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  // Clears the photo — falls back to the initials placeholder, same as
  // before any photo was ever uploaded. Sends the full `personal`
  // object back with photoUrl cleared (rather than a brand-new /photo
  // endpoint) since that's exactly what the existing PATCH /api/profile
  // route already knows how to merge and save.
  const handleRemovePhoto = async (e) => {
    e.stopPropagation(); // don't also trigger handlePhotoClick on the parent
    setPhotoUploading(true);
    try {
      const updated = await saveProfile({ personal: { ...(profile?.personal || {}), photoUrl: '' } });
      setProfile(updated);
    } catch {
      setProfileError('Could not remove photo. Please try again.');
    } finally {
      setPhotoUploading(false);
    }
  };


  const selectSection = (id) => {
    if (isEditing || id === activeSection) return;
    clearTimeout(hoverTimer.current);
    setHoverPreview(null);
    setActiveSection(id);
    setJustSwitched(true);
    clearTimeout(switchTimer.current);
    switchTimer.current = setTimeout(() => setJustSwitched(false), 360);
  };

  const handleChipEnter = (id) => {
    if (id === activeSection || isEditing) return;
    hoverTimer.current = setTimeout(() => setHoverPreview(id), 200);
  };
  const handleChipLeave = () => {
    clearTimeout(hoverTimer.current);
    setHoverPreview(null);
  };

  const handleSectionSave = async (items) => {
    const adapter = SECTION_ADAPTERS[activeSection];
    const value = adapter.fromItems(items, profile);
    const updated = await saveProfile({ [adapter.backendKey]: value });
    setProfile(updated);
  };

  const initialItems = useMemo(
    () => (profile ? SECTION_ADAPTERS[activeSection].toItems(profile) : []),
    [activeSection, profile]
  );

  const completion = useMemo(() => computeCompletion(profile), [profile]);
  const personal = profile?.personal || {};
  const initials = (personal.fullName || '')
    .split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '—';
  const photoSrc = personal.photoUrl ? `${BASE_URL}${personal.photoUrl}` : null;

  if (loadingProfile) {
    return (
      <div className="w-full flex flex-col gap-6 pb-12">
        <div className="w-full card-glass rounded-2xl p-6 md:p-8 animate-pulse h-40" />
        <div className="w-full card-glass rounded-2xl p-6 md:p-8 animate-pulse h-80" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 mt-0">
        <div className="flex flex-col">
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-heading)] font-sans flex items-center gap-2 tracking-tight leading-tight">My Profile</div>
          <p className="font-sans text-[0.95rem] text-[var(--text-muted)] mt-1.5 font-medium">Manage your personal information and verified skills.</p>
        </div>
        <div className="font-sans text-[0.8rem] text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 font-semibold tracking-widest uppercase">
          {completion}% Complete
        </div>
      </div>

      {profileError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 font-sans text-[0.85rem]">
          <IconAlert /> {profileError}
        </div>
      )}

      {/* Top Profile Banner */}
      <div className="w-full card-glass rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <div className="relative z-10 shrink-0 group/avatar cursor-pointer" onClick={handlePhotoClick}>
          <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)] overflow-hidden border border-[var(--border-card)] transition-transform duration-300 group-hover/avatar:scale-105">
            {photoUploading ? (
              <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : photoSrc ? (
              <img src={photoSrc} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="font-sans text-3xl sm:text-4xl font-black text-white tracking-widest drop-shadow-md">{initials}</span>
            )}
          </div>
          <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-cyan-400 border border-cyan-500/30 shadow-[0_4px_12px_rgba(34,211,238,0.2)] hover:bg-cyan-500/20 hover:text-cyan-300 transition-all z-20">
            <IconCamera />
          </div>
          {photoSrc && !photoUploading && (
            <button
              onClick={handleRemovePhoto}
              title="Remove photo"
              className="absolute top-0 right-0 w-7 h-7 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-red-400 border border-red-500/30 shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:bg-red-500/20 hover:text-red-300 transition-all z-20"
            >
              <IconClose />
            </button>
          )}
        </div>

        <div className="relative z-10 flex flex-col items-center sm:items-start gap-1 mt-2 text-center sm:text-left flex-1">
          <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-[var(--text-heading)] tracking-tight drop-shadow-sm">{personal.fullName || 'Add your name'}</h2>
          <p className="font-sans text-[0.95rem] text-indigo-400 font-semibold tracking-wide">{personal.title || 'Add a headline'}</p>
          {personal.location && (
            <p className="font-sans text-[0.85rem] text-[var(--text-muted)] mt-1 flex items-center gap-1.5 justify-center sm:justify-start">
              <span className="text-[var(--text-muted)]"><IconMapPin /></span> {personal.location}
            </p>
          )}
          {(personal.linkedin || personal.github || personal.portfolio) && (
            <div className="flex items-center gap-3 mt-1.5">
              {personal.linkedin && (
                <a href={externalUrl(personal.linkedin)} target="_blank" rel="noreferrer" className="font-sans text-[0.8rem] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">LinkedIn</a>
              )}
              {personal.github && (
                <a href={externalUrl(personal.github)} target="_blank" rel="noreferrer" className="font-sans text-[0.8rem] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">GitHub</a>
              )}
              {personal.portfolio && (
                <a href={externalUrl(personal.portfolio)} target="_blank" rel="noreferrer" className="font-sans text-[0.8rem] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Portfolio</a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section nav — one wrapping pill row for every screen size. No
          carousel, no scroll arrows, no cropped chips: it just wraps. */}
      <div className="w-full flex flex-col gap-3 mb-6 mt-2 relative z-20">
        <div className="flex flex-wrap gap-2">
          {PROFILE_SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            const isDisabled = isEditing && !isActive;
            const previewing = hoverPreview === section.id;
            const theme = THEMES[section.baseColor];
            return (
              <div key={section.id} className="relative" onMouseEnter={() => handleChipEnter(section.id)} onMouseLeave={handleChipLeave}>
                <button
                  id={`chip-${section.id}`}
                  onClick={() => selectSection(section.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 px-3 py-2 sm:py-1.5 rounded-lg font-sans text-[0.82rem] sm:text-[0.85rem] font-bold transition-all duration-300 ${
                    isActive
                      ? `${theme.bg} text-white ${theme.bgHover} shadow-md ${theme.shadow} scale-[1.03]`
                      : `bg-[var(--bg-nav)] text-[var(--text-primary)] border border-[var(--border-card)] ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-hover)] hover:-translate-y-0.5'}`
                  }`}
                >
                  <span className={`transition-colors duration-300 scale-90 shrink-0 ${isActive ? 'text-white' : section.color}`}><section.icon /></span>
                  <span className="truncate max-w-[130px] sm:max-w-none">{section.title}</span>
                </button>

                {/* Hover preview — shows the section's real saved data (via the
                    same adapter the section itself uses). Nothing "sticks"
                    until the chip is actually clicked. */}
                {previewing && !isDisabled && (
                  <div
                    className="absolute top-full mt-2 left-0 w-64 rounded-xl p-3.5 z-30 shadow-[0_16px_36px_rgba(0,0,0,0.35)] animate-in fade-in slide-in-from-top-1 duration-200"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', backdropFilter: 'blur(12px)' }}
                  >
                    <div className="flex items-center gap-2 mb-2.5 pb-2.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                      <span className={section.color}><section.icon /></span>
                      <span className="font-sans text-[0.78rem] font-bold text-[var(--text-primary)]">{section.title}</span>
                    </div>
                    <SectionHoverPreview sectionId={section.id} profile={profile} solid={theme.solid} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active section */}
      <div className="w-full pb-0">
        <ProfileSectionContent
          sectionId={activeSection}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          initialItems={initialItems}
          onSave={handleSectionSave}
          justSwitched={justSwitched}
        />
      </div>

      {/* Floating AI Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[var(--bg-card)] border border-[#22d3ee]/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-110 active:scale-95 transition-transform duration-300 z-50 hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]">
        <div className="scale-125"><LogoMark /></div>
      </button>
    </div>
  );
}