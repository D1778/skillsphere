import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/shared/DashboardLayout';
<<<<<<< HEAD
import GlobalChatbot from '../components/chatbot/GlobalChatbot';
=======
>>>>>>> 47426fbb288e3196aea1ad02eb03427e6ffb1254

const TITLES = {
  '/dashboard/company': 'Dashboard',
  '/company-profile':   'Company Profile',
  '/postings':          'Post a Job',
  '/applications':      'Applications',
  '/candidates':        'Candidates',
};

/* ══════════════════════════════════════════════════
   CompanyLayout — same idea as CandidateLayout: keeps
   Sidebar/Topbar mounted once across all company pages.
══════════════════════════════════════════════════ */
export default function CompanyLayout() {
  const { pathname } = useLocation();
  return (
    <DashboardLayout role="Recruiter" pageTitle={TITLES[pathname] || 'Dashboard'}>
      <Outlet />
<<<<<<< HEAD
      <GlobalChatbot role="company" />
=======
>>>>>>> 47426fbb288e3196aea1ad02eb03427e6ffb1254
    </DashboardLayout>
  );
}