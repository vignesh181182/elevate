import { Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from './components/RootLayout';
import RequireAuth from './components/RequireAuth';
import TabLayout from './components/TabLayout';
import Login from './routes/Login';
import Home from './routes/Home';
import Clients from './routes/Clients';
import ClientNew from './routes/ClientNew';
import ClientDetail from './routes/ClientDetail';
import ClientSchedule from './routes/ClientSchedule';
import ClientAssessment from './routes/ClientAssessment';
import ClientProgram from './routes/ClientProgram';
import ClientSession from './routes/ClientSession';
import Library from './routes/Library';
import Schedule from './routes/Schedule';
import Reports from './routes/Reports';
import More from './routes/More';
import ProfileEdit from './routes/ProfileEdit';

// Each menu item is its own route. Tab routes render inside TabLayout (with the
// bottom nav + FAB); detail/sub views render plain. More routes land in later milestones.
export default function App() {
  return (
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
          <Route path="/clients/:id/session" element={<ClientSession />} />
          <Route path="/library" element={<Library />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
        </Route>

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
