import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Homepage          from './pages/home/HomePage';
import SignInPage        from './pages/auth/SignInPage';
import GetStartedPage    from './pages/auth/GetStartedPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ProfileBuilderPage    from './pages/profile-builder/ProfileBuilderPage';
import StudentDashboardPage from './pages/user/StudentDashboardPage';
import CareerRoadmapPage   from './pages/user/CareerRoadmapPage';
import ProfilePage         from './pages/user/ProfilePage';
import JobsPage            from './pages/user/JobsPage';
import InsightsPage from './pages/user/InsightsPage';
import AccountPage         from './pages/account/AccountPage';
import CompanyDashboardPage from './pages/company/CompanyDashboardPage';
import CompanyProfilePage   from './pages/company/CompanyProfilePage';
import PostJobPage          from './pages/company/PostJobPage';
import ApplicationsPage     from './pages/company/ApplicationPages';
import CandidatesPage       from './pages/company/CandidatesPage';
import CandidateLayout      from './layouts/CandidateLayout';
import CompanyLayout        from './layouts/CompanyLayout';
import DashboardLayout      from './components/shared/DashboardLayout';
import LoadingScreen        from './components/shared/LoadingScreen';
import { NotificationProvider } from './context/NotificationContext';
import { JobsProvider }     from './context/JobsContext';
import { RoadmapProvider }  from './context/RoadmapContext';

/* ══════════════════════════════════════════════════
   ProtectedRoute
   — Not signed in           → /signin
   — Signed in, candidate,
     profile not completed   → /profile-builder
   — Signed in, company      → children (company dashboard)
   — Signed in, candidate,
     profile complete        → children (candidate dashboard)
══════════════════════════════════════════════════ */
function ProtectedRoute({ children, requireRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div style={{ position: 'relative', zIndex: 9999, display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-page)' }}>
      <div style={{ width:36, height:36, border:'3px solid var(--border-card)', borderTopColor:'var(--text-primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return <Navigate to="/signin" replace />;

  // Candidate who hasn't completed profile → force profile builder
  // (skip this check if we're already ON the profile builder, or we'll
  // redirect to ourselves forever and never render the page)
  if (user.role === 'candidate' && !user.profileCompleted && location.pathname !== '/profile-builder') {
    return <Navigate to="/profile-builder" replace />;
  }

  // Role guard (optional — pass requireRole="company" to company-only routes)
  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/* ══════════════════════════════════════════════════
   GuestRoute — redirects signed-in users away from
   auth pages (signin, get-started, forgot-password).
══════════════════════════════════════════════════ */
function GuestRoute({ children }) {
  return children;
}

/* ══════════════════════════════════════════════════
   AccountRoute — /account is shared by both candidates
   and companies (the sidebar's bottom user-row links
   here for either role), so it can't live inside either
   role-scoped layout block — that would either 404/bounce
   the other role, or (worse) create two routes at the
   same path, which React Router resolves by declaration
   order regardless of which role guard wraps them. This
   picks the matching sidebar/layout at render time from
   the real signed-in user's role instead.
══════════════════════════════════════════════════ */
function AccountRoute() {
  const { user } = useAuth();
  const role = user?.role === 'company' ? 'Recruiter' : 'Candidate';
  return (
    <DashboardLayout role={role} pageTitle="Account">
      <AccountPage />
    </DashboardLayout>
  );
}

/* ══════════════════════════════════════════════════
   AppShell
   — Shows the full branded LoadingScreen exactly once,
     on initial app boot, driven by the real auth
     `loading` state (not a fixed timer).
   — Once it's done, it unmounts itself for good — the
     rest of the app's life uses ProtectedRoute's small
     inline spinner for any further loading, so routing
     between pages never re-triggers the full splash.
══════════════════════════════════════════════════ */
function AppShell() {
  const { loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <LoadingScreen
        isLoading={loading}
        onLoadingComplete={() => setShowSplash(false)}
      />
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Homepage />} />

      {/* Auth pages — redirect away if already signed in */}
      <Route path="/signin"          element={<GuestRoute><SignInPage /></GuestRoute>} />
      <Route path="/get-started"     element={<GuestRoute><GetStartedPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

      {/* Profile builder — candidates only, before dashboard */}
      <Route path="/profile-builder" element={
        <ProtectedRoute>
          <ProfileBuilderPage />
        </ProtectedRoute>
      } />

      {/* Account — shared by both roles, see AccountRoute above */}
      <Route path="/account" element={
        <ProtectedRoute>
          <AccountRoute />
        </ProtectedRoute>
      } />

      {/* Candidate area — Sidebar/Topbar mount once via CandidateLayout
          and stay mounted while these child pages swap via <Outlet/> */}
      <Route element={
        <ProtectedRoute requireRole="candidate">
          <CandidateLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard/candidate" element={<StudentDashboardPage />} />
        <Route path="/roadmap"             element={<CareerRoadmapPage />} />
        <Route path="/jobs"                element={<JobsPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/profile"             element={<ProfilePage />} />
      </Route>

      {/* Company area — same persistent-layout pattern */}
      <Route element={
        <ProtectedRoute requireRole="company">
          <CompanyLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard/company" element={<CompanyDashboardPage />} />
        <Route path="/company-profile"   element={<CompanyProfilePage />} />
        <Route path="/postings"          element={<PostJobPage />} />
        <Route path="/candidates"         element={<CandidatesPage />} />
        <Route path="/applications"      element={<ApplicationsPage />} />
      </Route>
    </Routes>
  );
}

/* ══════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════ */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <RoadmapProvider>
      <JobsProvider>
      <NotificationProvider>
        <AppShell />
      </NotificationProvider>
      </JobsProvider>
      </RoadmapProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;