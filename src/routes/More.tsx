import { useNavigate } from 'react-router-dom';
import { Pencil, Dumbbell, KeyRound, Info, LogOut } from 'lucide-react';
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
  const roleLabel = role === 'main' ? 'Head coach' : 'Coach';

  return (
    <div className="fadein">
      <div className="bar">
        <div className="bar-title">Profile</div>
      </div>

      <div className="more-prof">
        <div className="more-prof-ava">
          {coach?.photo ? <img src={coach.photo} alt={name} /> : initials(name)}
        </div>
        <div className="more-prof-tx">
          <div className="more-prof-n">{name}</div>
          <div className="more-prof-r">{roleLabel}</div>
        </div>
        <button className="more-prof-edit" onClick={() => navigate('/profile/edit')} aria-label="Edit profile">
          <Pencil />
        </button>
      </div>

      <div className="more-sec">Manage</div>
      <div className="mgroup">
        <div className="mrow" onClick={() => navigate('/library')}>
          <div className="mrow-ic tint-purple">
            <Dumbbell />
          </div>
          <div className="mrow-tx">
            <div className="mrow-t">Exercise library</div>
            <div className="mrow-s">Browse and manage exercises</div>
          </div>
          <div className="mrow-chev">›</div>
        </div>
        <div className="mrow" onClick={() => navigate('/reset-password')}>
          <div className="mrow-ic tint-blue">
            <KeyRound />
          </div>
          <div className="mrow-tx">
            <div className="mrow-t">Reset password</div>
            <div className="mrow-s">Email a password reset link</div>
          </div>
          <div className="mrow-chev">›</div>
        </div>
        <div className="mrow" onClick={() => toast('Elevate Fitness')}>
          <div className="mrow-ic tint-amber">
            <Info />
          </div>
          <div className="mrow-tx">
            <div className="mrow-t">About Elevate Fitness</div>
            <div className="mrow-s">Coach portal</div>
          </div>
          <div className="mrow-chev">›</div>
        </div>
      </div>

      <div className="mgroup">
        <div className="mrow danger" onClick={onLogout}>
          <div className="mrow-ic tint-red">
            <LogOut />
          </div>
          <div className="mrow-tx">
            <div className="mrow-t">Log out</div>
          </div>
          <div className="mrow-chev">›</div>
        </div>
      </div>

      <div className="sp80" />
    </div>
  );
}
