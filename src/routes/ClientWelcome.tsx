import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import { useClient, useCoachNameMap, useCompleteWelcome } from '../hooks/useData';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';
import type { Client } from '../domain/types';

// Preset welcome messages (mirrors the prototype). The coach picks one; it's what
// gets saved and sent over WhatsApp.
const MSGS = [
  'Welcome to Elevate Fitness! Excited to start this journey with you. 💪',
  "So glad to have you on board. Let's build something great together, one session at a time.",
  "Welcome aboard! Your program is ready. Show up, trust the process, and we'll get results. 🙌",
];

export default function ClientWelcome() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: client, isLoading } = useClient(id);
  const coachName = useCoachNameMap();
  const { coach: me } = useAuth();
  const save = useCompleteWelcome(id);

  if (isLoading) return <div className="screen"><div className="cl-loading">Loading…</div></div>;
  if (!client) return <div className="screen"><div className="empty"><p>Client not found.</p></div></div>;

  const assigned = client.coachId ? coachName[client.coachId] ?? '—' : '—';
  const from = me?.name ?? 'Your coach';
  return (
    <Form
      key={client.id}
      client={client}
      assigned={assigned}
      from={from}
      save={save}
      navigate={navigate}
      toast={toast}
    />
  );
}

function Form({
  client,
  assigned,
  from,
  save,
  navigate,
  toast,
}: {
  client: Client;
  assigned: string;
  from: string;
  save: ReturnType<typeof useCompleteWelcome>;
  navigate: ReturnType<typeof useNavigate>;
  toast: (m: string) => void;
}) {
  const first = client.name.split(' ')[0];
  // Preselect the saved message if it's one of the presets, else the first.
  const initial = Math.max(0, MSGS.indexOf(client.welcomeMsg ?? ''));
  const [sel, setSel] = useState(initial);
  const [summary, setSummary] = useState(client.assessment?.summary ?? '');
  // Pop back to the detail entry already in history (schedule replaced itself with this welcome
  // step, so -1 lands on detail). Navigating to the URL with replace would instead create a
  // second detail entry next to the original, so detail's Back would need two taps to leave.
  const done = () => navigate(-1);

  const p = client.program;
  const days = client.days && client.days !== '—' ? client.days : '—';
  const programLine = `${p?.weeks ?? 4}-week · 3×/week · ${p?.paid ? 'Paid' : 'Pending'}`;

  function send() {
    const msg = MSGS[sel];
    const digits = client.phone.replace(/\D/g, '');
    if (!digits) return toast('No phone number on file');
    save.mutate(
      { message: msg, summary },
      {
        onSuccess: () => {
          window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
          toast(`${first} is all set 🎉`);
          done();
        },
        onError: () => toast('Could not complete onboarding'),
      },
    );
  }

  return (
    <div className="screen as-screen">
      <div className="as-head">
        <div className="as-head-tx">
          <div className="as-head-t">Welcome note</div>
          <div className="as-head-s">{client.name}</div>
        </div>
        <button className="iconbtn" onClick={done} aria-label="Skip">
          ✕
        </button>
      </div>

      <div className="pad as-body">
        <div className="as-hero">
          <div className="as-hero-ic">
            <Mail />
          </div>
          <div className="as-hero-tx">
            <div className="as-hero-t">Welcome note</div>
            <div className="as-hero-s">Sent from you to {first}. Review everything before sending.</div>
          </div>
        </div>

        <div className="as-card">
          <div className="as-card-t">Message</div>

          <div className="as-field">
            <label>
              First assessment summary <span className="lbl-hint">(coach fills — included in the note)</span>
            </label>
            <textarea
              className="cmp-note"
              placeholder={`Summarise the assessment for ${first}…`}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className="as-field">
            <label>Welcome message</label>
            {MSGS.map((m, i) => (
              <div key={i} className={`msg-card${sel === i ? ' sel' : ''}`} onClick={() => setSel(i)}>
                {m}
              </div>
            ))}
          </div>
        </div>

        <div className="as-card">
          <div className="as-card-t">In the note</div>
          <div className="kv">
            <span className="k">📅 Days</span>
            <span className="v">{days}</span>
          </div>
          <div className="kv">
            <span className="k">⏰ Time</span>
            <span className="v">{client.time || '—'}</span>
          </div>
          <div className="kv">
            <span className="k">🏋️ Program</span>
            <span className="v">{programLine}</span>
          </div>
          <div className="kv">
            <span className="k">👤 Coach</span>
            <span className="v">{assigned}</span>
          </div>
          <div className="kv">
            <span className="k">✉️ From</span>
            <span className="v">{from}</span>
          </div>
        </div>
      </div>

      <div className="as-foot">
        <button
          type="button"
          className={`as-btn-primary${save.isPending ? ' is-off' : ''}`}
          onClick={send}
          disabled={save.isPending}
        >
          <Send /> {save.isPending ? 'Sending…' : 'Save & send welcome note'}
        </button>
      </div>
    </div>
  );
}
