import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar  from './Topbar';
export default function DashboardLayout({ children, role = 'Candidate', pageTitle = 'Dashboard' }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="flex flex-col h-screen font-sans relative overflow-hidden group/layout"
      style={{ '--sidebar-w': isExpanded ? '200px' : '64px' }}
    >
      {/* Background Glows */}
      <div className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.10)_0%,transparent_70%)] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-80px] left-[80px] w-[360px] h-[360px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.07)_0%,transparent_70%)] pointer-events-none z-0"></div>

      {/* Topbar: sits in normal flow at the top of this flex column instead
          of being position:fixed. That removes the need for every other
          piece (main's padding-top, the sidebar's top offset) to guess the
          topbar's pixel height — which is what was causing the gap/seam
          when scrolling. The topbar visually stays put simply because it's
          outside the scrollable area below, not because it's floating. */}
      <Topbar role={role} pageTitle={pageTitle} />

      {/* Body Area: fills exactly the remaining viewport height below the
          topbar. overflow-hidden here + overflow-y-auto on <main> means
          this row is the scroll boundary — the sidebar (absolutely
          positioned against this same box) never moves, and content
          starts flush against the topbar with zero gap. */}
      <div className="flex flex-1 min-w-0 z-10 relative overflow-hidden">
        <Sidebar 
          role={role} 
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
        />
        
        {/* Main Content Area — the only thing that actually scrolls */}
        <main className={`flex-1 ml-[64px] sm:group-has-[aside:hover]/layout:ml-[200px] transition-[margin] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] px-4 pt-4 pb-6 sm:px-6 sm:pt-2 sm:pb-6 md:px-8 md:pt-4 md:pb-8 overflow-y-auto ${isExpanded ? 'sm:!ml-[200px]' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}