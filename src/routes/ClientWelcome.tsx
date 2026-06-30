import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useClient, useCoachNameMap, useSaveWelcome } from '../hooks/useData';
import { useToast } from '../components/Toast';
import type { Client } from '../domain/types';

/** Editable starter note — real first name + coach name; coach edits before sending. */
function welcomeTemplate(first: string, coach: string): string {
  return (
    `Hi ${first}, welcome to Elevate Fitness! 🎉\n\n` +
    `I'm ${coach}, your coach. Your training schedule is set and I'm excited to start ` +
    `working towards your goals with you.\n\n` +
    `See you at your first session!`
  );
}

export default function ClientWelcome() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: client, isLoading } = useClient(id);
  const coachName = useCoachNameMap();
  const save = useSaveWelcome(id);

  if (isLoading) return <div className="screen"><div className="cl-loading">Loading…</div></div>;
  if (!client) return <div className="screen"><div className="empty"><p>Client not found.</p></div></div>;

  const coach = client.coachId ? coachName[client.coachId] ?? 'your coach' : 'your coach';
  return <Form key={client.id} client={client} coach={coach} save={save} navigate={navigate} toast={toast} />;
}

function Form({
  client,
  coach,
  save,
  navigate,
  toast,
}: {
  client: Client;
  coach: string;
  save: ReturnType<typeof useSaveWelcome>;
  navigate: ReturnType<typeof useNavigate>;
  toast: (m: string) => void;
}) {
  const first = client.name.split(' ')[0];
  const [message, setMessage] = useState(client.welcomeMsg || welcomeTemplate(first, coach));
  const done = () => navigate(`/clients/${client.id}`);

  function send() {
    const msg = message.trim();
    if (!msg) return toast('Write a message first');
    const digits = client.phone.replace(/\D/g, '');
    if (!digits) return toast('No phone number on file');
    save.mutate(msg, {
      onSuccess: () => {
        window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
        toast('Opening WhatsApp…');
        done();
      },
      onError: () => toast('Could not save the message'),
    });
  }

  return (
    <div className="screen">
      <div className="bar solid">
        <div className="bar-title">Welcome message</div>
        <button className="iconbtn" onClick={done} aria-label="Skip">
          ✕
        </button>
      </div>

      <div className="pad">
        <div className="step-title">Send {first} a welcome</div>
        <div className="step-sub">Edit the note, then send it over WhatsApp. Saved to their profile.</div>

        <div className="field">
          <label>Message</label>
          <textarea
            className="welcome-ta"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a welcome note…"
          />
        </div>

        <div className="bottom-cta sticky-cta cta-row">
          <button type="button" className="bigbtn ghost" onClick={done} disabled={save.isPending}>
            Skip for now
          </button>
          <button type="button" className={`bigbtn${save.isPending ? ' dim' : ''}`} onClick={send} disabled={save.isPending}>
            <Send size={18} /> {save.isPending ? 'Sending…' : 'Send via WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}
