import React, { useState, useEffect, useRef } from 'react';
import ChatInterface from './ChatInterface';
import { LogoMark } from '../shared/Topbar';

export default function GlobalChatbot({ role = 'candidate' }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef}>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center transition-all z-50 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] border border-[#22d3ee]/50 cursor-pointer ${
          isOpen 
            ? 'bg-[var(--bg-card)] border-[var(--border-hover)] scale-90 opacity-0 pointer-events-none' 
            : 'bg-[var(--bg-card)] hover:scale-105 opacity-100'
        }`}
        aria-label="Open AI Assistant"
      >
        <div className="scale-125">
          <LogoMark />
        </div>
      </button>

      {/* Chat Interface Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[60] animate-in fade-in slide-in-from-bottom-5 duration-300">
          <ChatInterface role={role} onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}
