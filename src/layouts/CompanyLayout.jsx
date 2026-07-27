import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/shared/DashboardLayout';

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
    </DashboardLayout>
  );
}