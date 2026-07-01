import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  updatePassword,
} from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';

// Change the signed-in coach's password: re-authenticate with the current password,
// then set a new one. "Forgot password" instead emails a reset link.
export default function ResetPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const back = () => navigate(-1);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const email = user?.email;
    if (!email) return toast('Not signed in');
    if (!oldPassword) return toast('Enter your current password');
    if (newPassword.length < 6) return toast('New password must be at least 6 characters');
    if (newPassword !== confirm) return toast('New passwords do not match');
    if (newPassword === oldPassword) return toast('New password must be different');

    setBusy(true);
    try {
      const cred = EmailAuthProvider.credential(email, oldPassword);
      await reauthenticateWithCredential(auth.currentUser!, cred);
      await updatePassword(auth.currentUser!, newPassword);
      toast('Password updated');
      back();
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast('Current password is incorrect');
      } else {
        toast('Could not update password');
      }
      setBusy(false);
    }
  }

  async function onForgot() {
    const email = user?.email;
    if (!email) return toast('No email on file');
    try {
      await sendPasswordResetEmail(auth, email);
      toast(`Reset link sent to ${email}`);
    } catch {
      toast('Could not send reset email');
    }
  }

  return (
    <div className="screen">
      <div className="bar solid">
        <button className="iconbtn" onClick={back} aria-label="Back">
          <ChevronLeft />
        </button>
        <div className="bar-title">Reset password</div>
      </div>

      <form onSubmit={onSubmit} className="pad">
        <div className="as-card">
          <div className="as-card-t">Change your password</div>

          <div className="field">
            <label htmlFor="rp-old">Current password</label>
            <input
              id="rp-old"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="rp-new">New password</label>
            <input
              id="rp-new"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="rp-confirm">Re-enter new password</label>
            <input
              id="rp-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <div className="login-forgot" onClick={onForgot}>
            Forgot password?
          </div>
        </div>

        <div className="bottom-cta sticky-cta cta-row">
          <button type="button" className="bigbtn ghost" onClick={back} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={`bigbtn${busy ? ' dim' : ''}`} disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  );
}
