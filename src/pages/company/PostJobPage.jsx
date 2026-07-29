import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useJobs } from '../../context/JobsContext';
import { getJob } from '../../services/api';
import DatePicker from '../../components/shared/DatePicker';

/* ── Reusable field styling — one consistent look for every input,
   select and textarea on the page instead of ad-hoc classes per field. ── */
const FIELD_CLASS = "w-full bg-[var(--card-inner-bg)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-sans text-[0.95rem] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)] focus:border-[var(--accent-border)] transition-all placeholder:text-[var(--text-muted)]";
const errClass = (hasErr) => hasErr ? '!border-red-500/60 focus:!ring-red-500/30' : '';

/* Dropdown options render through a portal into document.body, positioned
   with `fixed` coordinates from the trigger's bounding rect. Without this,
   an absolutely-positioned dropdown is trapped inside whichever card's
   stacking context it's nested in (card-glass uses backdrop-filter, which
   creates one), so any later card in the DOM paints over it regardless of
   z-index — that's the "dropdown behind the next card" bug. */
const CustomSelect = ({ name, value, options, onChange, className = "w-full", placement = "bottom", hasError = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUpward: false });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const computeCoords = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const estimatedHeight = Math.min(options.length * 40 + 16, 208);
    const openUpward = placement === 'top' || (rect.bottom + estimatedHeight > viewportH && rect.top > estimatedHeight);
    const top = openUpward ? rect.top - 8 : rect.bottom + 8;
    setCoords({ top, left: rect.left, width: rect.width, openUpward });
  }, [placement, options.length]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    computeCoords();
  }, [isOpen, computeCoords]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleReposition = () => computeCoords();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, computeCoords]);

  const dropdown = isOpen ? createPortal(
    <div
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: coords.openUpward ? undefined : coords.top,
        bottom: coords.openUpward ? window.innerHeight - coords.top : undefined,
        left: coords.left,
        width: coords.width,
      }}
      className="z-[1000] bg-[var(--bg-panel)] border border-[var(--border-card)] rounded-xl shadow-2xl overflow-hidden py-1.5"
    >
      <ul className="max-h-52 overflow-y-auto custom-scrollbar">
        {options.map((opt) => (
          <li
            key={opt}
            onClick={() => {
              onChange({ target: { name, value: opt } });
              setIsOpen(false);
            }}
            className={`px-4 py-2.5 cursor-pointer font-sans text-[0.9rem] transition-colors ${value === opt ? 'bg-[var(--accent-bg)] text-[var(--accent)] font-semibold' : 'text-[var(--text-primary)] hover:bg-[var(--card-inner-bg)]'}`}
          >
            {opt}
          </li>
        ))}
      </ul>
    </div>,
    document.body
  ) : null;

  return (
    <div className={`relative ${className}`} ref={triggerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between cursor-pointer w-full bg-[var(--card-inner-bg)] hover:bg-[var(--bg-card-hover)] border ${hasError ? 'border-red-500/60' : isOpen ? 'border-[var(--accent-border-strong)] ring-2 ring-[var(--accent-border)]' : 'border-[var(--border-card)]'} rounded-xl px-4 py-3 text-[var(--text-primary)] font-sans text-[0.95rem] transition-all`}
      >
        <span className={value ? '' : 'text-[var(--text-muted)]'}>{value || 'Select an option'}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-[var(--text-secondary)] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdown}
    </div>
  );
};

/* ── A free-text tag input — used for required skills, so companies
   type what's actually true for them instead of picking from a
   canned checklist. ── */
const TagInput = ({ values, setValues, placeholder, suggestions = [], hasError }) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const wrapRef = useRef(null);
  const filtered = suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !values.includes(s));

  const computeCoords = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.bottom + 8, left: rect.left, width: rect.width });
  }, []);

  useLayoutEffect(() => {
    if (!showSuggestions) return;
    computeCoords();
  }, [showSuggestions, computeCoords]);

  useEffect(() => {
    if (!showSuggestions) return;
    const handleReposition = () => computeCoords();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [showSuggestions, computeCoords]);

  const addValue = (val) => {
    const clean = val.trim();
    if (clean && !values.includes(clean)) setValues([...values, clean]);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addValue(input);
    }
  };

  const dropdown = showSuggestions && input && filtered.length > 0 ? createPortal(
    <div
      style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width }}
      className="z-[1000] bg-[var(--bg-panel)] border border-[var(--border-card)] rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto custom-scrollbar animate-[fade-in_0.15s_ease-out]"
    >
      {filtered.map(s => (
        <div key={s} onClick={() => { addValue(s); setShowSuggestions(false); }} className="px-4 py-2 hover:bg-[var(--card-inner-bg)] cursor-pointer text-[var(--text-primary)] transition-colors text-sm font-sans">
          {s}
        </div>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative w-full" ref={wrapRef}>
      <div className={`w-full bg-[var(--card-inner-bg)] border rounded-xl px-4 py-3 flex flex-wrap items-center gap-2 focus-within:ring-2 focus-within:ring-[var(--accent-border)] focus-within:border-[var(--accent-border)] transition-all ${hasError ? 'border-red-500/60' : 'border-[var(--border-card)]'}`}>
        {values.map((v) => (
          <div key={v} className="inline-flex items-center gap-1.5 bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)] px-3 py-1.5 rounded-full">
            <span className="text-[0.85rem] font-medium">{v}</span>
            <button type="button" onClick={() => setValues(values.filter(x => x !== v))} className="hover:text-red-500 transition-colors"><IconX /></button>
          </div>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={values.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[140px] bg-transparent border-none outline-none text-[var(--text-primary)] font-sans text-[0.95rem] px-1 py-1 placeholder:text-[var(--text-muted)]"
        />
      </div>
      {dropdown}
    </div>
  );
};

/* ── A textarea with a live character counter and a hard maxLength,
   used for the four structured job-description fields. ── */
const LimitedTextarea = ({ name, value, onChange, placeholder, maxLength, rows = 4, hasError }) => (
  <div>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      className={`${FIELD_CLASS} resize-none ${errClass(hasError)}`}
    />
    <div className="flex justify-end mt-1">
      <span className="text-[0.7rem] font-sans text-[var(--text-muted)]">{value.length}/{maxLength}</span>
    </div>
  </div>
);

/* ── Icons ── */
const IconCheck = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const Spinner = () => (
  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);
const IconWifi = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="1"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><line x1="9" y1="18" x2="15" y2="18"/>
  </svg>
);
const IconHomeToggle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconHeart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IconGift = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
);
const IconCalendarPerk = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconChartPerk = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconClockPerk = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconFile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);

/* Field-level error text, shown right under the input it belongs to. */
const FieldError = ({ message }) => message ? (
  <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-sans font-medium"><IconAlert />{message}</p>
) : null;

const SectionHeader = ({ number, title, description }) => (
  <div className="mb-6 flex items-start gap-3">
    {number && (
      <span className="w-7 h-7 rounded-lg bg-[var(--accent-bg)] text-[var(--accent)] font-bold text-sm flex items-center justify-center shrink-0 font-sans">{number}</span>
    )}
    <div>
      <h2 className="text-lg font-bold text-[var(--text-primary)] font-sans">{title}</h2>
      {description && <p className="text-[var(--text-secondary)] text-sm font-sans mt-1">{description}</p>}
    </div>
  </div>
);

/* ── A single optional PDF attachment slot — dashed drop-style button
   that opens a hidden file input, and reflects whichever of "not
   selected yet" / "newly picked" / "already uploaded" state applies. ── */
const AttachmentSlot = ({ label, file, onSelect, existingUrl, existingName }) => {
  const inputRef = useRef(null);
  const displayName = file?.name || existingName;

  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] || null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--border-card)] hover:border-[var(--accent-border-strong)] bg-[var(--card-inner-bg)] hover:bg-[var(--bg-card-hover)] rounded-xl py-6 px-4 transition-all text-[var(--text-secondary)]"
      >
        {displayName ? (
          <>
            <IconFile />
            <span className="text-sm font-sans font-medium text-[var(--text-primary)] truncate max-w-full">{displayName}</span>
            <span className="text-xs font-sans text-[var(--accent)]">Click to replace</span>
          </>
        ) : (
          <>
            <IconUpload />
            <span className="text-sm font-sans font-medium">Upload PDF</span>
            <span className="text-xs font-sans text-[var(--text-muted)]">Max size 5MB</span>
          </>
        )}
      </button>
      {file && (
        <button type="button" onClick={() => onSelect(null)} className="mt-1.5 text-xs font-sans text-red-500 hover:text-red-400 transition-colors">
          Remove selected file
        </button>
      )}
      {!file && existingUrl && (
        <a href={existingUrl} target="_blank" rel="noreferrer" className="inline-block mt-1.5 text-xs font-sans text-[var(--accent)] hover:text-[var(--accent-strong)] transition-colors">
          View current file
        </a>
      )}
    </div>
  );
};

const SUGGESTED_SKILLS = ['React', 'Node.js', 'System Design', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST API', 'MongoDB', 'PostgreSQL', 'Redis', 'Figma', 'UI/UX', 'Product Management', 'Agile'];

const JOB_CATEGORIES = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'Customer Support', 'Operations', 'Finance', 'Human Resources', 'Legal', 'Other'];

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Netherlands',
  'Singapore', 'United Arab Emirates', 'Ireland', 'Switzerland', 'Sweden', 'Spain', 'Italy', 'Japan',
  'South Korea', 'New Zealand', 'Brazil', 'Mexico', 'South Africa', 'Israel', 'Poland', 'Other',
];

const WORK_MODES = [
  { value: 'Remote', icon: IconWifi },
  { value: 'On-site', icon: IconBuilding },
  { value: 'Hybrid', icon: IconHomeToggle },
];

const BENEFIT_OPTIONS = [
  { key: 'Health Insurance', icon: IconHeart },
  { key: 'Bonus / Incentives', icon: IconGift },
  { key: 'Paid Leave', icon: IconCalendarPerk },
  { key: 'Stock Options', icon: IconChartPerk },
  { key: 'Flexible Hours', icon: IconClockPerk },
  { key: 'Work From Home', icon: IconHomeToggle },
];

const NAV_SECTIONS = [
  { id: 'basics', label: 'Basic information' },
  { id: 'location', label: 'Location' },
  { id: 'description', label: 'Job description' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience & education' },
  { id: 'salary', label: 'Salary' },
  { id: 'hiring', label: 'Hiring details' },
  { id: 'benefits', label: 'Benefits' },
  { id: 'attachments', label: 'Attachments' },
];

const EMPTY_FORM = {
  title: '', department: '', jobCategory: '', employmentType: 'Full-time',
  workplaceType: 'Hybrid', city: '', state: '', country: '',
  jobSummary: '', responsibilities: '', requirements: '', preferredSkills: '',
  minExperience: '', maxExperience: '', educationLevel: 'No strict requirement',
  salaryType: 'Annual', minSalary: '', maxSalary: '', currency: 'INR',
  openings: '1', applicationDeadline: '', joiningDate: '',
};

const formatSalary = (min, max, currency, salaryType) => {
  if (!min && !max) return null;
  const fmt = (n) => Number(n).toLocaleString('en-IN');
  const suffix = salaryType ? ` / ${salaryType.toLowerCase()}` : '';
  if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)}${suffix}`;
  return `${currency} ${fmt(min || max)}+${suffix}`;
};

export default function PostJobPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { saveDraft, publishJob } = useJobs();

  // A dashboard "Edit draft" action can hand us a job id via route
  // state; if present we load that job and edit it in place instead
  // of starting a fresh posting.
  const editId = location.state?.editId || null;

  const [jobId, setJobId] = useState(editId);
  const [loadingJob, setLoadingJob] = useState(!!editId);
  const [loadError, setLoadError] = useState('');

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [skills, setSkills] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [customBenefitInput, setCustomBenefitInput] = useState('');
  const [existingAttachments, setExistingAttachments] = useState({ jobDescriptionPdf: null, companyBrochurePdf: null });
  const [attachmentFiles, setAttachmentFiles] = useState({ jobDescriptionPdf: null, companyBrochurePdf: null });

  const [showDraftToast, setShowDraftToast] = useState(false);
  const [showPublishToast, setShowPublishToast] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);

  /* ── Load an existing draft/job for editing ── */
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const job = await getJob(editId);
        if (cancelled) return;
        setFormData({
          title: job.title || '', department: job.department || '', jobCategory: job.jobCategory || '',
          employmentType: job.employmentType || 'Full-time',
          workplaceType: job.workplaceType || 'Hybrid',
          city: job.city || '', state: job.state || '', country: job.country || '',
          jobSummary: job.jobSummary || '', responsibilities: job.responsibilities || '',
          requirements: job.requirements || '', preferredSkills: job.preferredSkills || '',
          minExperience: job.minExperience != null ? String(job.minExperience) : '',
          maxExperience: job.maxExperience != null ? String(job.maxExperience) : '',
          educationLevel: job.educationLevel || 'No strict requirement',
          salaryType: job.salaryType || 'Annual',
          minSalary: job.salary?.min != null ? String(job.salary.min) : '',
          maxSalary: job.salary?.max != null ? String(job.salary.max) : '',
          currency: job.salary?.currency || 'INR',
          openings: String(job.openings ?? '1'),
          applicationDeadline: job.applicationDeadline ? job.applicationDeadline.slice(0, 10) : '',
          joiningDate: job.joiningDate ? job.joiningDate.slice(0, 10) : '',
        });
        setSkills(job.skills || []);
        setBenefits(job.perks || []);
        setExistingAttachments({
          jobDescriptionPdf: job.attachments?.jobDescriptionPdf || null,
          companyBrochurePdf: job.attachments?.companyBrochurePdf || null,
        });
      } catch (err) {
        if (!cancelled) setLoadError(err.response?.data?.message || 'Could not load this job posting.');
      } finally {
        if (!cancelled) setLoadingJob(false);
      }
    })();
    return () => { cancelled = true; };
  }, [editId]);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'minSalary' || name === 'maxSalary' || name === 'minExperience' || name === 'maxExperience') {
      value = value.replace(/\D/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleBenefit = (key) => {
    setBenefits(prev => prev.includes(key) ? prev.filter(b => b !== key) : [...prev, key]);
  };

  const addCustomBenefit = () => {
    const clean = customBenefitInput.trim();
    if (clean && !benefits.includes(clean)) setBenefits(prev => [...prev, clean]);
    setCustomBenefitInput('');
  };

  const customBenefits = benefits.filter(b => !BENEFIT_OPTIONS.some(o => o.key === b));

  const buildPayload = () => ({ ...formData, skills, perks: benefits, id: jobId || undefined });

  const goToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* Full validation — only enforced when actually publishing.
     Drafts can be saved in any state of completeness. */
  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Job title is required.';
    if (!formData.jobCategory.trim()) errs.jobCategory = 'Job category is required.';
    if (!formData.employmentType) errs.employmentType = 'Employment type is required.';
    if (!formData.workplaceType) errs.workplaceType = 'Work mode is required.';
    if (!formData.country.trim()) errs.country = 'Country is required.';
    if (!formData.jobSummary.trim()) errs.jobSummary = 'A job summary is required.';
    if (!formData.responsibilities.trim()) errs.responsibilities = 'Responsibilities are required.';
    if (!formData.requirements.trim()) errs.requirements = 'Requirements / qualifications are required.';
    if (skills.length === 0) errs.skills = 'Add at least one required skill.';
    if (!formData.openings || Number(formData.openings) < 1) errs.openings = 'Number of openings is required.';
    if (!formData.applicationDeadline) errs.applicationDeadline = 'An application deadline is required.';
    if (!formData.minSalary || !formData.maxSalary) errs.salary = 'A minimum and maximum salary are required.';
    return errs;
  };

  const SECTION_OF = {
    title: 'basics', jobCategory: 'basics', employmentType: 'basics',
    workplaceType: 'location', country: 'location',
    jobSummary: 'description', responsibilities: 'description', requirements: 'description',
    skills: 'skills',
    openings: 'hiring', applicationDeadline: 'hiring',
    salary: 'salary',
  };

  const handleSaveDraft = async () => {
    setFormError('');
    setSavingDraft(true);
    try {
      const job = await saveDraft(buildPayload(), attachmentFiles);
      setJobId(job.id);
      setAttachmentFiles({ jobDescriptionPdf: null, companyBrochurePdf: null });
      setExistingAttachments({
        jobDescriptionPdf: job.attachments?.jobDescriptionPdf || null,
        companyBrochurePdf: job.attachments?.companyBrochurePdf || null,
      });
      setShowDraftToast(true);
      setTimeout(() => setShowDraftToast(false), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save your draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Nothing here is persisted until Save Draft / Publish is clicked, so
  // "cancel" just means leaving without doing either — no explicit undo
  // needed. Goes back to wherever the user came from (Applications page
  // when editing, the sidebar nav when starting a fresh posting) rather
  // than a hardcoded route, since both flows land here.
  const handleCancel = () => {
    navigate(-1);
  };

  const handlePublishJob = async () => {
    setFormError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      goToSection(SECTION_OF[Object.keys(errs)[0]] || 'basics');
      return;
    }
    setFieldErrors({});

    setPublishing(true);
    try {
      await publishJob(buildPayload(), attachmentFiles);
      setShowPublishToast(true);
      setTimeout(() => {
        setShowPublishToast(false);
        setFormData(EMPTY_FORM);
        setSkills([]);
        setBenefits([]);
        setAttachmentFiles({ jobDescriptionPdf: null, companyBrochurePdf: null });
        setExistingAttachments({ jobDescriptionPdf: null, companyBrochurePdf: null });
        setJobId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 2200);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not publish this job. Please check your details and try again.');
    } finally {
      setPublishing(false);
    }
  };

  if (loadingJob) {
    return (
      <div className="w-full pt-2 flex flex-col items-center justify-center py-24 gap-3 text-[var(--text-secondary)]">
        <Spinner />
        <p className="font-sans text-sm">Loading job posting…</p>
      </div>
    );
  }

  const salaryPreview = formatSalary(formData.minSalary, formData.maxSalary, formData.currency, formData.salaryType);
  const locationPreview = [formData.city, formData.state, formData.country].filter(Boolean).join(', ');

  const ActionButtons = () => (
    <>
      {formError && <p className="flex items-center gap-1.5 text-red-500 font-sans font-semibold text-sm mb-3"><IconAlert />{formError}</p>}
      <div className="flex flex-col gap-2.5">
        <button type="button" onClick={handlePublishJob} disabled={publishing} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[length:200%_200%] bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-left hover:bg-right text-white font-sans font-bold shadow-[0_4px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_4px_25px_rgba(139,92,246,0.5)] hover:scale-[1.01] transition-all duration-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
          {publishing && <Spinner />} Publish job
        </button>
        <button type="button" onClick={handleSaveDraft} disabled={savingDraft} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--border-card)] text-[var(--text-primary)] font-sans font-semibold hover:bg-[var(--card-inner-bg)] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          {savingDraft && <Spinner />} Save as draft
        </button>
        <button type="button" onClick={handleCancel} disabled={publishing || savingDraft} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[var(--text-secondary)] font-sans font-semibold hover:text-[var(--text-primary)] hover:bg-[var(--card-inner-bg)] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          Cancel
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="w-full pt-2">

        {/* Publish Toast Notification */}
        {showPublishToast && (
          <div className="fixed top-24 right-6 sm:right-10 z-50 animate-[fade-in_0.3s_ease-out] bg-[var(--bg-card)] border border-[var(--border-card)] px-4 py-3 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <IconCheck size={18} />
            </div>
            <div>
              <h4 className="text-[var(--text-primary)] font-bold text-sm font-sans m-0 leading-tight">Job published</h4>
              <p className="text-[var(--text-secondary)] text-xs font-sans m-0 mt-0.5">Candidates can now see and apply to this listing.</p>
            </div>
          </div>
        )}

        {/* Draft Toast Notification */}
        {showDraftToast && (
          <div className="fixed top-24 right-6 sm:right-10 z-50 animate-[fade-in_0.3s_ease-out] bg-[var(--bg-card)] border border-[var(--border-card)] px-4 py-3 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <IconCheck size={18} />
            </div>
            <div>
              <h4 className="text-[var(--text-primary)] font-bold text-sm font-sans m-0 leading-tight">Draft saved</h4>
              <p className="text-[var(--text-secondary)] text-xs font-sans m-0 mt-0.5">Come back any time to finish this posting.</p>
            </div>
          </div>
        )}

        {loadError && (
          <div className="mb-6 flex items-center gap-2 bg-red-500/10 border border-red-500/25 text-red-500 rounded-xl px-4 py-3 text-sm font-sans font-medium">
            <IconAlert /> {loadError}
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-sans">
              {jobId ? 'Edit job posting' : 'Post a New Job'}
            </h1>
            <p className="font-sans text-[0.95rem] text-[var(--text-secondary)] mt-1.5">
              {jobId ? 'Update the details below and save your changes.' : 'Fill in the details below to create a new job posting.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="shrink-0 font-sans text-[0.85rem] font-semibold text-[var(--text-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-2.5 hover:bg-[var(--card-inner-bg)] hover:text-[var(--text-primary)] transition-all"
          >
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── Main form column ── */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            <section id="basics" className="card-glass rounded-2xl p-6 sm:p-8 scroll-mt-24">
              <SectionHeader number="1" title="Basic Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Job Title <span className="text-red-400">*</span></label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Senior Frontend Developer" className={`${FIELD_CLASS} ${errClass(fieldErrors.title)}`} />
                  <FieldError message={fieldErrors.title} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Department</label>
                  <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Engineering" className={FIELD_CLASS} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Job Category <span className="text-red-400">*</span></label>
                  <CustomSelect name="jobCategory" value={formData.jobCategory} onChange={handleChange} options={JOB_CATEGORIES} hasError={!!fieldErrors.jobCategory} />
                  <FieldError message={fieldErrors.jobCategory} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Employment Type <span className="text-red-400">*</span></label>
                  <CustomSelect name="employmentType" value={formData.employmentType} onChange={handleChange} options={['Full-time', 'Part-time', 'Contract', 'Internship']} hasError={!!fieldErrors.employmentType} />
                </div>
              </div>
            </section>

            <section id="location" className="card-glass rounded-2xl p-6 sm:p-8 scroll-mt-24">
              <SectionHeader number="2" title="Location" />
              <div className="mb-5">
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Work Mode <span className="text-red-400">*</span></label>
                <div className="flex flex-wrap gap-3">
                  {WORK_MODES.map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, workplaceType: value }))}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-sans text-sm font-semibold transition-all ${formData.workplaceType === value ? 'bg-[var(--accent-bg)] border-[var(--accent-border-strong)] text-[var(--accent)]' : 'bg-[var(--card-inner-bg)] border-[var(--border-card)] text-[var(--text-secondary)] hover:border-[var(--accent-border)]'}`}
                    >
                      <Icon /> {value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Bengaluru" className={FIELD_CLASS} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">State / Province</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="e.g. Karnataka" className={FIELD_CLASS} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Country <span className="text-red-400">*</span></label>
                  <CustomSelect name="country" value={formData.country} onChange={handleChange} options={COUNTRIES} hasError={!!fieldErrors.country} />
                  <FieldError message={fieldErrors.country} />
                </div>
              </div>
            </section>

            <section id="description" className="card-glass rounded-2xl p-6 sm:p-8 scroll-mt-24">
              <SectionHeader number="3" title="Job Description" />
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Job Summary <span className="text-red-400">*</span></label>
                  <LimitedTextarea name="jobSummary" value={formData.jobSummary} onChange={handleChange} placeholder="Write a short summary about the role, team and impact." maxLength={500} rows={3} hasError={fieldErrors.jobSummary} />
                  <FieldError message={fieldErrors.jobSummary} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Responsibilities <span className="text-red-400">*</span></label>
                  <LimitedTextarea name="responsibilities" value={formData.responsibilities} onChange={handleChange} placeholder="List the key responsibilities for this role." maxLength={1000} rows={4} hasError={fieldErrors.responsibilities} />
                  <FieldError message={fieldErrors.responsibilities} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Requirements / Qualifications <span className="text-red-400">*</span></label>
                  <LimitedTextarea name="requirements" value={formData.requirements} onChange={handleChange} placeholder="List the minimum requirements and qualifications." maxLength={1000} rows={4} hasError={fieldErrors.requirements} />
                  <FieldError message={fieldErrors.requirements} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Preferred Skills <span className="text-[var(--text-muted)] font-normal">(Optional)</span></label>
                  <LimitedTextarea name="preferredSkills" value={formData.preferredSkills} onChange={handleChange} placeholder="Add preferred skills or nice-to-have qualifications." maxLength={500} rows={3} />
                </div>
              </div>
            </section>

            <section id="skills" className="card-glass rounded-2xl p-6 sm:p-8 scroll-mt-24">
              <SectionHeader number="4" title="Skills" />
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Required Skills <span className="text-red-400">*</span></label>
              <TagInput values={skills} setValues={setSkills} placeholder="Type a skill and press Enter" suggestions={SUGGESTED_SKILLS} hasError={!!fieldErrors.skills} />
              <FieldError message={fieldErrors.skills} />
            </section>

            <section id="experience" className="card-glass rounded-2xl p-6 sm:p-8 scroll-mt-24">
              <SectionHeader number="5" title="Experience & Education" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Minimum Experience</label>
                  <input type="text" inputMode="numeric" name="minExperience" value={formData.minExperience} onChange={handleChange} placeholder="e.g. 2 years" className={FIELD_CLASS} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Maximum Experience <span className="text-[var(--text-muted)] font-normal">(Optional)</span></label>
                  <input type="text" inputMode="numeric" name="maxExperience" value={formData.maxExperience} onChange={handleChange} placeholder="e.g. 5 years" className={FIELD_CLASS} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Education Level</label>
                  <CustomSelect name="educationLevel" value={formData.educationLevel} onChange={handleChange} options={['No strict requirement', 'High School or equivalent', "Bachelor's Degree", "Master's Degree", "PhD or equivalent"]} />
                </div>
              </div>
            </section>

            <section id="salary" className="card-glass rounded-2xl p-6 sm:p-8 scroll-mt-24">
              <SectionHeader number="6" title="Salary" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Salary Type</label>
                  <CustomSelect name="salaryType" value={formData.salaryType} onChange={handleChange} options={['Annual', 'Monthly', 'Hourly', 'Weekly']} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Currency</label>
                  <CustomSelect name="currency" value={formData.currency} onChange={handleChange} options={['USD', 'EUR', 'GBP', 'INR', 'AUD']} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Minimum Salary <span className="text-red-400">*</span></label>
                  <input type="number" name="minSalary" min="0" placeholder="e.g. 600000" value={formData.minSalary} onChange={handleChange} className={`${FIELD_CLASS} ${errClass(fieldErrors.salary)}`} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Maximum Salary <span className="text-red-400">*</span></label>
                  <input type="number" name="maxSalary" min="0" placeholder="e.g. 1200000" value={formData.maxSalary} onChange={handleChange} className={`${FIELD_CLASS} ${errClass(fieldErrors.salary)}`} />
                </div>
              </div>
              <FieldError message={fieldErrors.salary} />
            </section>

            <section id="hiring" className="card-glass rounded-2xl p-6 sm:p-8 scroll-mt-24">
              <SectionHeader number="7" title="Hiring Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Number of Openings <span className="text-red-400">*</span></label>
                  <input type="number" name="openings" min="1" value={formData.openings} onChange={handleChange} className={`${FIELD_CLASS} ${errClass(fieldErrors.openings)}`} />
                  <FieldError message={fieldErrors.openings} />
                </div>
                <div />
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Application Deadline <span className="text-red-400">*</span></label>
                  <DatePicker
                    id="applicationDeadline"
                    value={formData.applicationDeadline}
                    onChange={(v) => setFormData(prev => ({ ...prev, applicationDeadline: v }))}
                    placeholder="Select a deadline"
                    minDate={new Date()}
                    hasError={!!fieldErrors.applicationDeadline}
                  />
                  <FieldError message={fieldErrors.applicationDeadline} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Joining Date <span className="text-[var(--text-muted)] font-normal">(Optional)</span></label>
                  <DatePicker
                    id="joiningDate"
                    value={formData.joiningDate}
                    onChange={(v) => setFormData(prev => ({ ...prev, joiningDate: v }))}
                    placeholder="Select a date"
                    minDate={new Date()}
                  />
                </div>
              </div>
            </section>

            <section id="benefits" className="card-glass rounded-2xl p-6 sm:p-8 scroll-mt-24">
              <SectionHeader number="8" title="Benefits" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {BENEFIT_OPTIONS.map(({ key, icon: Icon }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded bg-[var(--card-inner-bg)] border border-[var(--border-card)] group-hover:border-[var(--accent-border-strong)] transition-colors shrink-0">
                      <input type="checkbox" checked={benefits.includes(key)} onChange={() => toggleBenefit(key)} className="peer opacity-0 absolute inset-0 cursor-pointer" />
                      <div className="pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity text-[var(--accent)]"><IconCheck /></div>
                    </div>
                    <Icon />
                    <span className="text-[var(--text-secondary)] font-sans text-sm">{key}</span>
                  </label>
                ))}
              </div>

              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 font-sans">Other Benefits</label>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {customBenefits.map((b) => (
                  <div key={b} className="inline-flex items-center gap-1.5 bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)] px-3 py-1.5 rounded-full">
                    <span className="text-[0.85rem] font-medium">{b}</span>
                    <button type="button" onClick={() => setBenefits(prev => prev.filter(x => x !== b))} className="hover:text-red-500 transition-colors"><IconX /></button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customBenefitInput}
                  onChange={(e) => setCustomBenefitInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomBenefit(); } }}
                  placeholder="Add other benefit"
                  className={`${FIELD_CLASS} flex-1`}
                />
                <button type="button" onClick={addCustomBenefit} className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-[var(--border-card)] bg-[var(--card-inner-bg)] text-[var(--text-primary)] font-sans font-semibold text-sm hover:border-[var(--accent-border)] transition-all shrink-0">
                  <IconPlus /> Add
                </button>
              </div>
            </section>

            <section id="attachments" className="card-glass rounded-2xl p-6 sm:p-8 scroll-mt-24">
              <SectionHeader number="9" title="Attachments" description="Optional" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <AttachmentSlot
                  label="Job Description (PDF)"
                  file={attachmentFiles.jobDescriptionPdf}
                  onSelect={(f) => setAttachmentFiles(prev => ({ ...prev, jobDescriptionPdf: f }))}
                  existingUrl={existingAttachments.jobDescriptionPdf?.url}
                  existingName={existingAttachments.jobDescriptionPdf?.originalName}
                />
                <AttachmentSlot
                  label="Company Brochure (PDF)"
                  file={attachmentFiles.companyBrochurePdf}
                  onSelect={(f) => setAttachmentFiles(prev => ({ ...prev, companyBrochurePdf: f }))}
                  existingUrl={existingAttachments.companyBrochurePdf?.url}
                  existingName={existingAttachments.companyBrochurePdf?.originalName}
                />
              </div>
            </section>

            {/* Mobile-only action bar — the sidebar below handles this on larger screens */}
            <div className="lg:hidden card-glass rounded-2xl p-5">
              <ActionButtons />
            </div>
          </div>

          {/* ── Sidebar: quick nav, live preview, actions ── */}
          <div className="hidden lg:flex lg:col-span-4 lg:sticky lg:top-6 flex-col gap-4">

            <div className="card-glass rounded-2xl p-5">
              <ActionButtons />
            </div>

            <div className="card-glass rounded-2xl p-5">
              <p className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)] mb-3 font-sans">Preview</p>
              <h3 className="text-base font-bold text-[var(--text-primary)] font-sans truncate">
                {formData.title || 'Untitled role'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] font-sans mt-0.5">
                {[formData.department, locationPreview].filter(Boolean).join(' · ') || 'Department · Location'}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="px-2.5 py-1 rounded-full bg-[var(--card-inner-bg)] border border-[var(--border-card)] text-xs font-medium text-[var(--text-secondary)] font-sans">{formData.workplaceType}</span>
                <span className="px-2.5 py-1 rounded-full bg-[var(--card-inner-bg)] border border-[var(--border-card)] text-xs font-medium text-[var(--text-secondary)] font-sans">{formData.employmentType}</span>
                <span className="px-2.5 py-1 rounded-full bg-[var(--card-inner-bg)] border border-[var(--border-card)] text-xs font-medium text-[var(--text-secondary)] font-sans">{formData.openings || '1'} opening{Number(formData.openings) === 1 ? '' : 's'}</span>
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)] font-sans mt-3">
                {salaryPreview || <span className="font-normal text-[var(--text-muted)]">Salary not set yet</span>}
              </p>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[var(--border-card)]">
                  {skills.slice(0, 6).map(sk => (
                    <span key={sk} className="px-2.5 py-1 rounded-full bg-[var(--accent-bg)] text-[var(--accent)] text-xs font-medium font-sans">{sk}</span>
                  ))}
                  {skills.length > 6 && <span className="px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] font-sans">+{skills.length - 6} more</span>}
                </div>
              )}
            </div>

            <div className="card-glass rounded-2xl p-5">
              <p className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)] mb-3 font-sans">Jump to</p>
              <nav className="flex flex-col gap-1">
                {NAV_SECTIONS.map(s => (
                  <button key={s.id} type="button" onClick={() => goToSection(s.id)} className="text-left px-3 py-2 rounded-lg text-sm font-sans font-medium text-[var(--text-secondary)] hover:bg-[var(--card-inner-bg)] hover:text-[var(--text-primary)] transition-colors">
                    {s.label}
                  </button>
                ))}
              </nav>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}