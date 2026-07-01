import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ChevronLeft, Pencil, KeyRound, LogOut, UserRound, Mail, ShieldCheck, Server, Database } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { auth } from '../firebase';
import { useToast } from '../components/Toast';

// Account + app settings. Everything shown is real — the signed-in coach (from auth)
// and the backend the build points at (from import.meta.env). No fabricated toggles:
// the prototype never built this screen, and there are no real preferences to store.
export default function Settings() {
  const { coach, role, user, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [resetting, setResetting] = useState(false);

  const name = coach?.name ?? user?.email ?? 'Coach';
  const email = coach?.email ?? user?.email ?? '';
  const roleLabel = role === 'main' ? 'Head coach' : 'Coach';
  const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true';
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '—';

  async function onReset() {
    if (!email) return toast('No email on this account');
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast('Password reset email sent');
    } catch {
      toast('Could not send reset email');
    } finally {
      setResetting(false);
    }
  }

  async function onLogout() {
    await signOut();
    toast('Signed out');
    navigate('/login', { replace: true });
  }

  return (
    <div className="fadein">
      <div className="bar solid">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft />
        </button>
        <div className="bar-title">Settings</div>
      </div>

      <div className="more-sec">Account</div>
      <div className="prof-card">
        <div className="prof-row">
          <UserRound />
          <span className="prof-row-label">Name</span>
          <span className="prof-row-val">{name}</span>
        </div>
        {email && (
          <div className="prof-row">
            <Mail />
            <span className="prof-row-label">Email</span>
            <span className="prof-row-val">{email}</span>
          </div>
        )}
        <div className="prof-row">
          <ShieldCheck />
          <span className="prof-row-label">Role</span>
          <span className="prof-row-val">{roleLabel}</span>
        </div>
      </div>
      <div className="mgroup">
        <div className="mrow" onClick={() => navigate('/profile/edit')}>
          <div className="mrow-ic tint-purple">
            <Pencil />
          </div>
          <div className="mrow-tx">
            <div className="mrow-t">Edit profile</div>
            <div className="mrow-s">Name, photo, bio and contact</div>
          </div>
          <div className="mrow-chev">›</div>
        </div>
        <div className={`mrow${resetting ? ' dim' : ''}`} onClick={() => !resetting && onReset()}>
          <div className="mrow-ic tint-blue">
            <KeyRound />
          </div>
          <div className="mrow-tx">
            <div className="mrow-t">Reset password</div>
            <div className="mrow-s">{resetting ? 'Sending…' : `Email a reset link to ${email || 'your account'}`}</div>
          </div>
          <div className="mrow-chev">›</div>
        </div>
      </div>

      <div className="more-sec">App</div>
      <div className="prof-card">
        <div className="prof-row">
          <Server />
          <span className="prof-row-label">Backend</span>
          <span className="prof-row-val">{useEmulator ? 'Local emulator' : 'Live project'}</span>
        </div>
        <div className="prof-row">
          <Database />
          <span className="prof-row-label">Project</span>
          <span className="prof-row-val">{projectId}</span>
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
