import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useSaveProfile } from '../hooks/useData';
import { useToast } from '../components/Toast';

// Edit the signed-in coach's own profile (name / phone / email / tagline). Writes to
// coaches/{uid} — a coach may write only their own doc per the security rules.
export default function ProfileEdit() {
  const navigate = useNavigate();
  const toast = useToast();
  const { coach, refreshCoach } = useAuth();
  const save = useSaveProfile(coach?.id);

  const back = () => navigate('/more');

  const [name, setName] = useState(coach?.name ?? '');
  const [phone, setPhone] = useState(coach?.phone ?? '');
  const [email, setEmail] = useState(coach?.email ?? '');
  const [tagline, setTagline] = useState(coach?.tagline ?? '');

  if (!coach) {
    return (
      <div className="screen">
        <div className="empty">
          <p>Not signed in.</p>
        </div>
      </div>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return toast('Add your name');
    save.mutate(
      { name: n, phone: phone.trim(), email: email.trim(), tagline: tagline.trim() },
      {
        onSuccess: async () => {
          await refreshCoach();
          toast('Profile updated');
          back();
        },
        onError: () => toast('Could not save profile'),
      },
    );
  }

  return (
    <div className="screen">
      <div className="bar solid">
        <button className="iconbtn" onClick={back} aria-label="Back">
          <ChevronLeft />
        </button>
        <div className="bar-title">Edit profile</div>
      </div>

      <form onSubmit={onSubmit} className="pad">
        <div className="as-card">
          <div className="as-card-t">Your details</div>

          <div className="field">
            <label>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Madhan" />
          </div>
          <div className="field">
            <label>Phone</label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 91234 56789"
            />
          </div>
          <div className="field">
            <label>Contact email</label>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. coach@elevatefitness.com"
            />
          </div>
          <div className="field">
            <label>Tagline</label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A short line shown on your profile"
            />
          </div>
        </div>

        <div className="bottom-cta sticky-cta cta-row">
          <button type="button" className="bigbtn ghost" onClick={back} disabled={save.isPending}>
            Cancel
          </button>
          <button type="submit" className={`bigbtn${save.isPending ? ' dim' : ''}`} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
