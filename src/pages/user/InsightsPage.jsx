import React, { useState, useEffect } from 'react';
import CustomDatePicker from '../../components/shared/CustomDatePicker';

/* ─── Inline SVG Icons ─── */
const IconSend = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconBookmark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconHourglass = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IconUsers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconBriefcase = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconSparkles = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

/* ─── Mock Data ─── */
const STATUS_STATS = [
  { id: 'applied', label: 'Applied', count: 28, color: 'indigo', hex: '#8b5cf6', icon: <IconSend /> },
  { id: 'shortlisted', label: 'Shortlisted', count: 8, color: 'emerald', hex: '#10b981', icon: <IconBookmark /> },
  { id: 'in_review', label: 'In Review / Waiting', count: 12, color: 'amber', hex: '#f59e0b', icon: <IconHourglass /> },
  { id: 'interviewed', label: 'Interviewed', count: 5, color: 'blue', hex: '#3b82f6', icon: <IconUsers /> },
  { id: 'rejected', label: 'Rejected', count: 3, color: 'red', hex: '#f43f5e', icon: <IconBriefcase /> }
];

const ROLES_CHART = [
  { label: 'Frontend Developer', count: 12, percent: 42.9, color: '#8b5cf6' }, // 0 - 42.9%
  { label: 'Full Stack Developer', count: 6, percent: 21.4, color: '#10b981' }, // 42.9 - 64.3%
  { label: 'UI/UX Designer', count: 5, percent: 17.9, color: '#f59e0b' },      // 64.3 - 82.2%
  { label: 'Backend Developer', count: 3, percent: 10.7, color: '#3b82f6' },   // 82.2 - 92.9%
  { label: 'Other', count: 2, percent: 7.1, color: '#f43f5e' }                 // 92.9 - 100%
];

const RECENT_APPS = [
  { id: 1, company: 'Tata Consultancy Services', logo: 'TCS', role: 'Frontend Developer', status: 'shortlisted', date: '2 days ago' },
  { id: 2, company: 'Microsoft', logo: 'M', role: 'UI/UX Designer', status: 'in_review', date: '3 days ago' },
  { id: 3, company: 'Google', logo: 'G', role: 'Frontend Developer', status: 'interviewed', date: '5 days ago' },
  { id: 4, company: 'Infosys', logo: 'INF', role: 'Software Engineer', status: 'in_review', date: '1 week ago' },
  { id: 5, company: 'Accenture', logo: 'A', role: 'Full Stack Developer', status: 'rejected', date: '1 week ago' }
];

const UPCOMING = [
  { id: 1, company: 'Zoho', role: 'Product Developer', stage: 'Assessment', date: '20 May 2025', time: '11:00 AM' },
  { id: 2, company: 'Cognizant', role: 'Frontend Developer', stage: 'HR Round', date: '22 May 2025', time: '02:00 PM' },
  { id: 3, company: 'Capgemini', role: 'UI Developer', stage: 'Technical Round', date: '24 May 2025', time: '10:00 AM' },
  { id: 4, company: 'Wipro', role: 'Software Engineer', stage: 'Waiting for Response', date: 'Applied on 18 May 2025', time: '' }
];

const ALL_MOCK_APPS = [
  ...RECENT_APPS,
  { id: 6, company: 'Amazon', logo: 'AMZ', role: 'Frontend Developer', status: 'applied', date: '2 weeks ago' },
  { id: 7, company: 'Netflix', logo: 'N', role: 'UI/UX Designer', status: 'shortlisted', date: '3 weeks ago' },
  { id: 8, company: 'Apple', logo: 'AAPL', role: 'Backend Developer', status: 'rejected', date: '1 month ago' },
  { id: 9, company: 'Meta', logo: 'M', role: 'Full Stack Developer', status: 'interviewed', date: '1 month ago' },
  { id: 10, company: 'IBM', logo: 'IBM', role: 'Software Engineer', status: 'applied', date: '1 month ago' }
];

/* ─── Helpers ─── */
const getStatusClasses = (status) => {
  const map = {
    applied: 'text-[#818cf8] bg-[#818cf8]/10 border border-[#818cf8]/30',
    shortlisted: 'text-[#00e676] bg-[#00e676]/10 border border-[#00e676]/30',
    in_review: 'text-[#ffb300] bg-[#ffb300]/10 border border-[#ffb300]/30',
    interviewed: 'text-[#2979ff] bg-[#2979ff]/10 border border-[#2979ff]/30',
    rejected: 'text-[#ff1744] bg-[#ff1744]/10 border border-[#ff1744]/30'
  };
  return map[status] || map.applied;
};
const getStatusLabel = (status) => {
  const map = {
    applied: 'Applied', shortlisted: 'Shortlisted', in_review: 'In Review', interviewed: 'Interviewed', rejected: 'Rejected'
  };
  return map[status];
};

/* ─── Modal Component ─── */
const StatusModal = ({ isOpen, onClose, statusObj }) => {
  if (!isOpen || !statusObj) return null;

  // Mock filtering based on clicked status
  const filteredApps = ALL_MOCK_APPS.filter(app => app.status === statusObj.id);

  // Fallback to show some apps if the mock data doesn't have enough to match the count
  const appsToShow = filteredApps.length > 0 ? filteredApps : ALL_MOCK_APPS.slice(0, Math.min(statusObj.count, 5));

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div 
        className="w-full max-w-lg rounded-2xl flex flex-col max-h-[85vh] bg-[var(--bg-page)] border-x border-b border-[var(--border-card)] overflow-hidden transform scale-100 transition-all animate-in zoom-in-95 duration-300"
        style={{ 
          boxShadow: `0 20px 60px -10px ${statusObj.hex}30, 0 0 20px ${statusObj.hex}10`,
          borderTop: `4px solid ${statusObj.hex}`
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-5 border-b border-[var(--border-card)] flex items-center justify-between relative overflow-hidden"
        >
          {/* Subtle background gradient matching the status color */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: `linear-gradient(135deg, ${statusObj.hex} 0%, transparent 100%)` }}
          />
          
          <div className="flex items-center gap-4 relative z-10">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner" 
              style={{ backgroundColor: `${statusObj.hex}15`, color: statusObj.hex, borderColor: `${statusObj.hex}30` }}
            >
              {statusObj.icon}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-wide drop-shadow-sm">{statusObj.label} Applications</h2>
              <p className="text-sm font-medium" style={{ color: statusObj.hex }}>{statusObj.count} application{statusObj.count !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all bg-[var(--card-inner-bg)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] hover:scale-105"
          >
            <IconX />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {appsToShow.map((app, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-hover)] transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm border bg-[var(--card-inner-bg)] border-[var(--border-subtle)] text-[var(--text-primary)]">
                  {app.logo}
                </div>
                <div>
                  <h4 className="font-semibold text-[0.95rem] text-[var(--text-primary)] tracking-wide">{app.role}</h4>
                  <p className="text-[0.82rem] mt-0.5 text-[var(--text-muted)] font-medium">{app.company}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide ${getStatusClasses(app.status)}`}>
                  {getStatusLabel(app.status)}
                </span>
                <p className="text-[0.75rem] mt-1.5 text-[var(--text-muted)] font-medium">{app.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function InsightsPage() {
  const [activeModal, setActiveModal] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('Last 30 Days');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleWindowClick = () => setIsDatePickerOpen(false);
    if (isDatePickerOpen) {
      window.addEventListener('click', handleWindowClick);
    }
    return () => window.removeEventListener('click', handleWindowClick);
  }, [isDatePickerOpen]);

  const dateOptions = ['Last 7 Days', 'Last 30 Days', 'This Month', 'This Year', 'All Time', 'Custom Range'];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 relative mt-5 pb-8 font-sans">
      
      {/* ─── Ambient Background Blobs (Matches Student Dashboard) ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
        <div 
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.10), transparent 70%)', filter: 'blur(90px)', top: '-10%', left: '-5%' }}
        />
        <div 
          className="absolute w-[420px] h-[420px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.10), transparent 70%)', filter: 'blur(90px)', bottom: '-10%', right: '-5%' }}
        />
      </div>

      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-sans flex items-center gap-2 tracking-tight leading-tight mb-2">
            Insights
          </h1>
          <p className="font-sans text-[0.9rem] text-[var(--text-muted)] tracking-wide">Track your job application journey and see how you're progressing.</p>
        </div>
        
        {/* Date Picker Group */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          
          {/* Custom Date Inputs (Appears when Custom Range is selected) */}
          {dateFilter === 'Custom Range' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <CustomDatePicker 
                value={customStartDate} 
                onChange={setCustomStartDate} 
                placeholder="Start Date" 
              />
              <span className="text-gray-500 text-sm font-medium">to</span>
              <CustomDatePicker 
                value={customEndDate} 
                onChange={setCustomEndDate} 
                placeholder="End Date" 
              />
            </div>
          )}

          {/* Main Dropdown Button */}
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsDatePickerOpen(!isDatePickerOpen); }}
              className={`flex items-center gap-2.5 px-4 py-2 border rounded-xl font-sans text-[0.9rem] font-medium transition-all ${isDatePickerOpen ? 'bg-[var(--card-inner-bg)] border-[var(--border-hover)] text-[var(--text-primary)] shadow-sm' : 'bg-[var(--card-inner-bg)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`}
            >
              <span className="text-[var(--text-muted)]"><IconCalendar /></span>
              <span>{dateFilter}</span>
              <span className="text-[var(--text-muted)]"><IconChevronDown /></span>
            </button>
            
            {/* Dropdown Menu */}
            {isDatePickerOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                {dateOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setDateFilter(option);
                      setIsDatePickerOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${dateFilter === option ? 'bg-[var(--accent-bg)] text-[var(--accent)] font-bold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] font-medium'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Top Stats Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-12">
        {STATUS_STATS.map((stat) => {
          const bgMap = {
            indigo: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400',
            emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            red: 'bg-red-500/10 text-red-600 dark:text-red-400',
          };
          
          return (
            <div 
              key={stat.id}
              onClick={() => setActiveModal(stat)}
              className="relative overflow-hidden p-5 rounded-2xl border cursor-pointer transition-all duration-300 group shadow-lg bg-[var(--bg-card)] border-[var(--border-card)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-hover)] hover:-translate-y-1"
            >
              {/* Bottom colored border highlight */}
              <div 
                className="absolute bottom-0 left-6 right-6 h-1 rounded-t-full opacity-70 transition-all duration-300 group-hover:left-0 group-hover:right-0 group-hover:opacity-100 group-hover:h-1.5" 
                style={{ backgroundColor: stat.hex }}
              />
              
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-[var(--border-subtle)] shadow-inner ${bgMap[stat.color]}`}>
                  {stat.icon}
                </div>
                <div className="flex flex-col mt-0.5">
                  <span className="font-sans text-[0.75rem] font-semibold tracking-wide uppercase mb-1 text-[var(--text-muted)]">
                    {stat.label}
                  </span>
                  <span className="font-sans text-2xl font-extrabold text-[var(--text-primary)]">
                    {stat.count}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Chart & Stats Area (Middle Row) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Pie Chart Card */}
        <div className="p-7 rounded-2xl border shadow-lg flex flex-col bg-[var(--bg-card)] border-[var(--border-card)]">
          <h3 className="font-sans text-[1.05rem] font-bold mb-6 text-[var(--text-primary)] tracking-wide">Top Job Roles Applied</h3>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-12 flex-1 pt-4">
            {/* CSS Conic Gradient Donut Chart */}
            <div 
              className="w-64 h-64 sm:w-72 sm:h-72 rounded-full relative flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.1)] shrink-0"
              style={{ background: 'conic-gradient(#8b5cf6 0% 42.9%, #10b981 42.9% 64.3%, #f59e0b 64.3% 82.2%, #3b82f6 82.2% 92.9%, #f43f5e 92.9% 100%)' }}
            >
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_15px_rgba(0,0,0,0.2)] z-10 bg-[var(--bg-card)]">
                <span className="font-sans text-4xl font-extrabold text-[var(--text-primary)]">28</span>
                <span className="font-sans text-[0.8rem] font-medium mt-1 text-[var(--text-muted)] tracking-wide uppercase">Total</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-col gap-4">
              {ROLES_CHART.map((role, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-md shadow-sm border border-black/10 dark:border-black/30" style={{ backgroundColor: role.color }}></span>
                  <div>
                    <p className="font-sans text-[0.9rem] font-bold leading-tight text-[var(--text-primary)] tracking-wide">{role.label}</p>
                    <p className="font-sans text-[0.8rem] text-[var(--text-muted)] font-medium">{role.count} ({role.percent}%)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-6 rounded-2xl border shadow-lg flex flex-col bg-[var(--bg-card)] border-[var(--border-card)]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-sans text-[1.05rem] font-bold text-[var(--text-primary)] tracking-wide">Recent Applications</h3>
          </div>
          
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
            {RECENT_APPS.map(app => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-xl transition-colors bg-[var(--card-inner-bg)] hover:bg-[var(--bg-card-hover)] border border-transparent hover:border-[var(--border-hover)] cursor-pointer">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-inner bg-[var(--card-inner-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                    {app.logo}
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-[0.9rem] text-[var(--text-primary)] tracking-wide">{app.role}</h4>
                    <p className="font-sans text-[0.8rem] mt-0.5 text-[var(--text-muted)] font-medium">{app.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded-full font-sans text-[0.7rem] font-bold uppercase tracking-wide ${getStatusClasses(app.status)}`}>
                    {getStatusLabel(app.status)}
                  </span>
                  <span className="font-sans text-[0.75rem] w-16 text-[var(--text-muted)] font-medium">{app.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Bottom Row (Upcoming Schedule) ─── */}
      <div className="p-6 rounded-2xl border shadow-lg mb-6 bg-[var(--bg-card)] border-[var(--border-card)]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-sans text-[1.05rem] font-bold text-[var(--text-primary)] tracking-wide">Upcoming Schedule</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {UPCOMING.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border transition-colors bg-[var(--card-inner-bg)] border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner bg-[var(--card-inner-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <IconCalendar />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-[0.9rem] text-[var(--text-primary)] tracking-wide">{item.role}</h4>
                  <p className="font-sans text-[0.8rem] mt-0.5 text-[var(--text-muted)] font-medium">{item.company}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1.5 rounded-full font-sans text-[0.7rem] font-bold tracking-wide uppercase mb-1 bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]">
                  {item.stage}
                </span>
                <p className="font-sans text-[0.75rem] text-[var(--text-muted)] font-medium">{item.date} {item.time && `• ${item.time}`}</p>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Modals */}
      <StatusModal 
        isOpen={!!activeModal} 
        onClose={() => setActiveModal(null)} 
        statusObj={activeModal} 
      />
      
      {/* Spacer to guarantee scrollable bottom space */}
      <div className="h-12 shrink-0"></div>
    </div>
  );
}
