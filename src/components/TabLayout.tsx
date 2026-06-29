import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, CalendarDays, FileText, Plus } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { initials } from '../lib/format';

// Bottom-nav tabs. The 5th ("Profile") opens More and shows the coach avatar,
// matching the prototype. Chrome (tabbar + FAB) renders only on these tab routes;
// detail/sub views use a plain layout (added in later milestones).
const TABS = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/reports', label: 'Reports', icon: FileText },
] as const;

export default function TabLayout() {
  const { coach } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const onClients = location.pathname === '/clients';
  const moreActive = location.pathname === '/more';

  return (
    <>
      <div className="screen">
        <Outlet />
      </div>

      {onClients && (
        <button className="fab" onClick={() => navigate('/clients/new')} aria-label="Add client">
          <Plus />
        </button>
      )}

      <nav className="tabbar">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `tabitem${isActive ? ' on' : ''}`}>
            <span className="ic">
              <Icon />
            </span>
            {label}
          </NavLink>
        ))}
        <NavLink to="/more" className={`tabitem${moreActive ? ' on' : ''}`}>
          <span className={`tab-ava${coach?.photo ? ' has-photo' : ''}`}>
            {coach?.photo ? <img src={coach.photo} alt="Profile" /> : initials(coach?.name)}
          </span>
          Profile
        </NavLink>
      </nav>
    </>
  );
}
