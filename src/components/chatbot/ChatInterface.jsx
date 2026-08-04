import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const MAX_TEXTAREA_HEIGHT = 120; // px, ~5 lines before it scrolls internally

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  };

  useEffect(() => {
    resizeTextarea();
  }, [message]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatHistory, isSending]);

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
  const firstName = user?.displayName?.trim().split(' ')[0];
  const userName = firstName || (role === 'company' ? 'Recruiter' : 'there');
  const subtitle = role === 'company' ? 'Your recruiting assistant' : 'Your career companion';

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = message.trim();
    if (!text || isSending) return;

    // "/start" is a client-side command that brings back the feature
    // menu instead of round-tripping to the backend.
    if (text.toLowerCase() === '/start') {
      setChatHistory((prev) => [
        ...prev,
        { text, sender: 'user' },
        { text: 'Sure! Here are the things I can help you with:', sender: 'menu' },
      ]);
      setMessage('');
      return;
    }

    // Conversation so far, in the { role, content } shape the backend
    // expects — sent alongside the new message so it has context.
    const historyForApi = chatHistory.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    setChatHistory((prev) => [...prev, { text, sender: 'user' }]);
    setMessage('');
    setIsSending(true);

    try {
      const reply = await sendChatMessage(text, historyForApi);
      setChatHistory((prev) => [...prev, { text: reply, sender: 'ai' }]);
    } catch (err) {
      const status = err.response?.status;
      let errorText = 'Something went wrong. Please try again.';
      if (!err.response) {
        errorText = "I couldn't reach the server. Please check your connection and try again.";
      } else if (status === 429) {
        errorText = "You're sending messages a bit too fast — please wait a moment and try again.";
      } else if (status === 504) {
        errorText = 'That took too long to respond. Please try again.';
      } else if (err.response?.data?.message) {
        errorText = err.response.data.message;
      }
      setChatHistory((prev) => [...prev, { text: errorText, sender: 'ai', isError: true }]);
    } finally {
      setIsSending(false);
    }
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 bg-[var(--bg-body)] relative">
        
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
          msg.sender === 'menu' ? (
            <div key={idx} className="flex w-full justify-start">
              <div className="max-w-[85%] flex flex-col gap-2.5">
                <div className="p-3 rounded-2xl rounded-bl-none text-[0.9rem] leading-relaxed shadow-sm bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)]">
                  {msg.text}
                </div>
                <div className="flex flex-col gap-2">
                  {suggestedPrompts.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
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
            </div>
          ) : (
            <div key={idx} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] min-w-0 p-3 rounded-2xl text-[0.9rem] leading-relaxed shadow-sm whitespace-pre-wrap break-words ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-none'
                    : msg.isError
                    ? 'bg-red-500/10 border border-red-500/25 text-red-400 rounded-bl-none'
                    : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          )
        ))}

        {/* Typing indicator while waiting on the assistant */}
        {isSending && (
          <div className="flex w-full justify-start">
            <div className="max-w-[85%] p-3.5 rounded-2xl rounded-bl-none bg-[var(--bg-card)] border border-[var(--border-card)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[var(--bg-panel)] border-t border-[var(--border-card)] shrink-0">
        <form 
          onSubmit={handleSend}
          className="flex items-end gap-2 bg-[var(--bg-body)] border border-[var(--border-card)] rounded-3xl px-4 py-2 focus-within:border-cyan-400 dark:focus-within:border-cyan-500/50 transition-colors shadow-sm"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={chatHistory.length > 0 ? 'Type a message... (/start for menu)' : 'Type a message...'}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isSending}
            className="flex-1 bg-transparent border-none outline-none resize-none text-[0.95rem] text-[var(--text-primary)] placeholder-[var(--text-muted)] py-1 disabled:opacity-60 leading-relaxed"
            style={{ maxHeight: `${MAX_TEXTAREA_HEIGHT}px` }}
          />
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="text-cyan-600 dark:text-cyan-400 disabled:text-gray-300 dark:disabled:text-gray-600 hover:scale-110 transition-transform p-1 cursor-pointer shrink-0"
          >
            <IconSend />
          </button>
        </form>
      </div>

    </div>
  );
}