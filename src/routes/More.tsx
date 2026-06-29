import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';
import { initials } from '../lib/format';

export default function More() {
  const { coach, role, user, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  async function onLogout() {
    await signOut();
    toast('Signed out');
    navigate('/login', { replace: true });
  }

  const name = coach?.name ?? user?.email ?? 'Coach';
  const roleLabel = role === 'main' ? 'Head coach' : role === 'junior' ? 'Junior coach' : '—';

  return (
    <div className="fadein">
      <div className="more-prof">
        <div className="more-prof-ava">
          {coach?.photo ? <img src={coach.photo} alt={name} /> : initials(name)}
        </div>
        <div className="more-prof-tx">
          <div className="more-prof-n">{name}</div>
          <div className="more-prof-r">
            {roleLabel}
            {coach?.email ? ` · ${coach.email}` : ''}
          </div>
        </div>
      </div>

      <button className="bigbtn ghost narrow" onClick={onLogout}>
        <LogOut size={18} /> Log out
      </button>
    </div>
  );
}
