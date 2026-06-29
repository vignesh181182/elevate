import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';

const DEMO = { email: 'madhan@elevatefitness.com', password: 'coach123' };

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in → bounce to where they were headed (or Home).
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/home';
  if (!loading && user) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch {
      setErr('Incorrect email or password.');
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <div className="login fadein">
        <form className="login-card" onSubmit={onSubmit}>
          <img className="login-logo-img" src="/assets/images/logo.jpg" alt="Elevate Fitness" />
          <div className="login-sub">Trainer portal · sign in</div>
          <div className="login-fields">
            <div className="field">
              <label htmlFor="lg-email">Email</label>
              <input
                id="lg-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="you@elevatefitness.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="lg-password">Password</label>
              <input
                id="lg-password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {err && <div className="login-err">⚠️ {err}</div>}
          <button className="bigbtn" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <div
            className="login-forgot"
            onClick={() => toast('Contact your gym admin to reset your password')}
          >
            Forgot password?
          </div>
          <div className="login-hint">
            Demo login
            <br />
            <b>{DEMO.email}</b> · <b>{DEMO.password}</b>
            <button
              type="button"
              className="login-demo"
              onClick={() => {
                setEmail(DEMO.email);
                setPassword(DEMO.password);
              }}
            >
              Use demo login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
