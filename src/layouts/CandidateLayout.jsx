import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/shared/DashboardLayout';
import GlobalChatbot from '../components/chatbot/GlobalChatbot';

const TITLES = {
  '/dashboard/candidate': 'Dashboard',
  '/jobs':                'Opportunity Hub',
  '/roadmap':             'Career Roadmap',
  '/profile':             'Profile',
  '/insights':            'Insights',
};

/* ══════════════════════════════════════════════════
   CandidateLayout — sits ABOVE the individual candidate
   pages as a nested route layout. DashboardLayout (and
   therefore Sidebar/Topbar) mounts exactly once and
   persists while candidate pages swap in and out via
   <Outlet/>. This is what stops the sidebar from
   resetting/re-expanding on every navigation.
══════════════════════════════════════════════════ */
export default function CandidateLayout() {
  const { pathname } = useLocation();
  return (
    <DashboardLayout role="Candidate" pageTitle={TITLES[pathname] || 'Dashboard'}>
      <Outlet />
      <GlobalChatbot role="candidate" />
    </DashboardLayout>
  );
}