import { useNavigate } from 'react-router-dom';
import { Pencil, Dumbbell, Settings, Info, LogOut, Phone, Mail, Award } from 'lucide-react';
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
  const roleLabel = role === 'main' ? 'Head coach' : role === 'junior' ? 'Junior coach' : 'Coach';
  const chips = [...(coach?.specializations ?? []), ...(coach?.certifications ?? [])];

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
        <button
          className="more-prof-edit"
          onClick={() => toast('Edit profile — coming soon')}
          aria-label="Edit profile"
        >
          <Pencil />
        </button>
      </div>

      {/* Coach bio + contact — all from the Firestore coach doc */}
      {coach && (
        <div className="prof-card">
          {coach.tagline && <div className="prof-tagline">“{coach.tagline}”</div>}
          {chips.length > 0 && (
            <div className="prof-chips">
              {chips.map((c) => (
                <span key={c} className="tag">
                  {c}
                </span>
              ))}
            </div>
          )}
          {typeof coach.yearsExp === 'number' && (
            <div className="prof-row">
              <Award />
              <span className="prof-row-label">Experience</span>
              <span className="prof-row-val">
                {coach.yearsExp} year{coach.yearsExp === 1 ? '' : 's'}
              </span>
            </div>
          )}
          {coach.phone && (
            <div className="prof-row">
              <Phone />
              <span className="prof-row-label">Phone</span>
              <span className="prof-row-val">{coach.phone}</span>
            </div>
          )}
          {coach.email && (
            <div className="prof-row">
              <Mail />
              <span className="prof-row-label">Email</span>
              <span className="prof-row-val">{coach.email}</span>
            </div>
          )}
        </div>
      )}

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
        <div className="mrow" onClick={() => toast('Settings — coming soon')}>
          <div className="mrow-ic tint-blue">
            <Settings />
          </div>
          <div className="mrow-tx">
            <div className="mrow-t">Settings</div>
            <div className="mrow-s">Preferences and app settings</div>
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
