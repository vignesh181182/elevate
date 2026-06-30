import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from './components/RootLayout';
import RequireAuth from './components/RequireAuth';
import TabLayout from './components/TabLayout';
import Login from './routes/Login';

// Login + layouts load eagerly (needed on first paint). Every screen behind auth
// is code-split with React.lazy so it ships as its own chunk, loaded on navigation
// — this keeps the initial bundle (shell + firebase + router) small.
const Home = lazy(() => import('./routes/Home'));
const Clients = lazy(() => import('./routes/Clients'));
const ClientNew = lazy(() => import('./routes/ClientNew'));
const ClientDetail = lazy(() => import('./routes/ClientDetail'));
const ClientSchedule = lazy(() => import('./routes/ClientSchedule'));
const ClientAssessment = lazy(() => import('./routes/ClientAssessment'));
const ClientProgram = lazy(() => import('./routes/ClientProgram'));
const ClientProgramEdit = lazy(() => import('./routes/ClientProgramEdit'));
const ClientSession = lazy(() => import('./routes/ClientSession'));
const ClientBasic = lazy(() => import('./routes/ClientBasic'));
const ClientScheduleView = lazy(() => import('./routes/ClientScheduleView'));
const ClientAssessmentView = lazy(() => import('./routes/ClientAssessmentView'));
const ClientProgress = lazy(() => import('./routes/ClientProgress'));
const ClientMedia = lazy(() => import('./routes/ClientMedia'));
const ClientPayment = lazy(() => import('./routes/ClientPayment'));
const ClientSessions = lazy(() => import('./routes/ClientSessions'));
const ClientEdit = lazy(() => import('./routes/ClientEdit'));
const ClientWelcome = lazy(() => import('./routes/ClientWelcome'));
const ClientReport = lazy(() => import('./routes/ClientReport'));
const Notifications = lazy(() => import('./routes/Notifications'));
const Library = lazy(() => import('./routes/Library'));
const Schedule = lazy(() => import('./routes/Schedule'));
const Reports = lazy(() => import('./routes/Reports'));
const More = lazy(() => import('./routes/More'));
const ProfileEdit = lazy(() => import('./routes/ProfileEdit'));
const Settings = lazy(() => import('./routes/Settings'));

const RouteFallback = () => (
  <div className="screen">
    <div className="cl-loading">Loading…</div>
  </div>
);

// Each menu item is its own route. Tab routes render inside TabLayout (with the
// bottom nav + FAB); detail/sub views render plain.
export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/login" element={<Login />} />

          <Route element={<RequireAuth />}>
            {/* Tab routes — show the bottom nav */}
            <Route element={<TabLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/more" element={<More />} />
            </Route>

            {/* Plain routes — no bottom nav */}
            <Route path="/clients/new" element={<ClientNew />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/clients/:id/schedule" element={<ClientSchedule />} />
            <Route path="/clients/:id/assessment" element={<ClientAssessment />} />
            <Route path="/clients/:id/library" element={<Library />} />
            <Route path="/clients/:id/program" element={<ClientProgram />} />
            <Route path="/clients/:id/program/edit" element={<ClientProgramEdit />} />
            <Route path="/clients/:id/session" element={<ClientSession />} />
            <Route path="/clients/:id/basic" element={<ClientBasic />} />
            <Route path="/clients/:id/schedule-view" element={<ClientScheduleView />} />
            <Route path="/clients/:id/assessment-view" element={<ClientAssessmentView />} />
            <Route path="/clients/:id/progress" element={<ClientProgress />} />
            <Route path="/clients/:id/media" element={<ClientMedia />} />
            <Route path="/clients/:id/payment" element={<ClientPayment />} />
            <Route path="/clients/:id/sessions" element={<ClientSessions />} />
            <Route path="/clients/:id/edit" element={<ClientEdit />} />
            <Route path="/clients/:id/welcome" element={<ClientWelcome />} />
            <Route path="/clients/:id/report" element={<ClientReport />} />
            <Route path="/library" element={<Library />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
