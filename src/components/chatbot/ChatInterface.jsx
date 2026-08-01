import React, { useState } from 'react';

// Icons
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconSend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconFileText = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconCheckCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconTrendingUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
const IconMessageSquare = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

import { Logo, SkillSphereWordmark } from '../shared/Logo';

export default function ChatInterface({ role, onClose }) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  // Prompts tailored to actual features available on SkillSphere
  const candidatePrompts = [
    { label: 'Find relevant jobs', icon: <IconSearch /> },
    { label: 'Generate career roadmap', icon: <IconTrendingUp /> },
    { label: 'View application insights', icon: <IconCheckCircle /> },
    { label: 'Update my profile', icon: <IconUsers /> },
    { label: 'Review my resume', icon: <IconFileText /> },
  ];

  const companyPrompts = [
    { label: 'Draft a job description', icon: <IconFileText /> },
    { label: 'Screen candidates', icon: <IconSearch /> },
    { label: 'Review applications', icon: <IconCheckCircle /> },
    { label: 'Update company profile', icon: <IconUsers /> },
    { label: 'Schedule interviews', icon: <IconCalendar /> },
  ];

  const suggestedPrompts = role === 'company' ? companyPrompts : candidatePrompts;
  const userName = role === 'company' ? 'Recruiter' : 'Aarav';
  const subtitle = role === 'company' ? 'Your recruiting assistant' : 'Your career companion';

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Add user message to history
    setChatHistory([...chatHistory, { text: message, sender: 'user' }]);
    setMessage('');
    
    // Simulate AI response (Mockup for now)
    setTimeout(() => {
      setChatHistory(prev => [
        ...prev, 
        { text: "I'm currently a mockup frontend AI! Please hook me up to a real backend API to process this request.", sender: 'ai' }
      ]);
    }, 1000);
  };

  const handlePromptClick = (text) => {
    setMessage(text);
  };

  return (
    <div className="w-[360px] h-[600px] max-h-[80vh] flex flex-col bg-[var(--bg-panel)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-card)] font-sans">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-cyan-700 dark:from-cyan-600 dark:to-cyan-900 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-start gap-2.5">
          <div className="mt-1 shrink-0">
            <Logo size={28} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <SkillSphereWordmark fontSize="1.3rem" />
              <span className="text-[var(--text-primary)] font-extrabold text-[1.15rem] tracking-tight">Assistant</span>
            </div>
            <p className="text-[var(--text-secondary)] text-[0.77rem] font-medium tracking-wide -mt-0.5">{subtitle}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-black/60 hover:text-black dark:text-white/70 dark:hover:text-white transition-colors p-1 cursor-pointer"
        >
          <IconClose />
        </button>
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 bg-[var(--bg-body)] relative">
        
        {/* Welcome Message */}
        {chatHistory.length === 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-[1.3rem] font-bold text-[var(--text-primary)]">
              Hi {userName}! <span className="inline-block animate-waving-hand">👋</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-[0.95rem] leading-relaxed font-medium">
              I'm your AI {role === 'company' ? 'recruiting' : 'career'} assistant.<br/>
              How can I help you today?
            </p>
            
            {/* Suggested Prompts List */}
            <div className="mt-4 flex flex-col gap-2.5">
              {suggestedPrompts.map((prompt, idx) => (
                <button 
                  key={idx}
                  onClick={() => handlePromptClick(prompt.label)}
                  className="flex items-center gap-3 w-full p-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-cyan-400 dark:hover:border-cyan-400/50 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 text-[var(--text-primary)] transition-all text-left shadow-sm group"
                >
                  <span className="text-cyan-500 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                    {prompt.icon}
                  </span>
                  <span className="text-[0.9rem] font-medium">{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat History */}
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] p-3 rounded-2xl text-[0.9rem] leading-relaxed shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-cyan-600 text-white rounded-br-none' 
                  : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[var(--bg-panel)] border-t border-[var(--border-card)] shrink-0">
        <form 
          onSubmit={handleSend}
          className="flex items-center gap-2 bg-[var(--bg-body)] border border-[var(--border-card)] rounded-full px-4 py-2 focus-within:border-cyan-400 dark:focus-within:border-cyan-500/50 transition-colors shadow-sm"
        >
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[0.95rem] text-[var(--text-primary)] placeholder-[var(--text-muted)] py-1"
          />
          <button 
            type="submit"
            disabled={!message.trim()}
            className="text-cyan-600 dark:text-cyan-400 disabled:text-gray-300 dark:disabled:text-gray-600 hover:scale-110 transition-transform p-1 cursor-pointer"
          >
            <IconSend />
          </button>
        </form>
      </div>

    </div>
  );
}
