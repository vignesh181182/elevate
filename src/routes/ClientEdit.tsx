import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useClient, useCoaches, useUpdateClient } from '../hooks/useData';
import { useToast } from '../components/Toast';
import { CATS } from '../lib/categories';

// Edit an existing client's profile — identity, category/ability, assigned coach.
// Mirrors the prototype's vEditClient (no profile photo: clients use initials avatars).
export default function ClientEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: client, isLoading } = useClient(id);
  const { data: coaches = [] } = useCoaches();
  const update = useUpdateClient(id);

  if (isLoading)
    return (
      <div className="screen center-screen">
        <div className="cl-loading">Loading…</div>
      </div>
    );
  if (!client)
    return (
      <div className="screen">
        <div className="bar solid">
          <button className="iconbtn" onClick={() => navigate('/clients')} aria-label="Back">
            <ChevronLeft />
          </button>
          <div className="bar-title">Edit client</div>
        </div>
        <div className="empty">
          <div className="em">🔍</div>
          <p>Client not found.</p>
        </div>
      </div>
    );

  return <Form key={client.id} client={client} coaches={coaches} update={update} navigate={navigate} toast={toast} />;
}

function Form({
  client,
  coaches,
  update,
  navigate,
  toast,
}: {
  client: import('../domain/types').Client;
  coaches: import('../domain/types').Coach[];
  update: ReturnType<typeof useUpdateClient>;
  navigate: ReturnType<typeof useNavigate>;
  toast: ReturnType<typeof useToast>;
}) {
  const [name, setName] = useState(client.name);
  const [age, setAge] = useState(String(client.age || ''));
  const [phone, setPhone] = useState(client.phone);
  const [email, setEmail] = useState(client.email ?? '');
  const [category, setCategory] = useState(client.category);
  const [ability, setAbility] = useState(client.ability || 'Abled');
  const [coachId, setCoachId] = useState(client.coachId ?? '');

  const back = () => navigate(`/clients/${client.id}`);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return toast('Enter a name');
    if (!phone.trim()) return toast('Enter a phone number');

    update.mutate(
      {
        name: n,
        age: Number(age) || 0,
        phone: phone.trim(),
        email: email.trim(),
        category,
        ability,
        coachId: coachId || null,
      },
      {
        onSuccess: () => {
          toast('Client updated');
          back();
        },
        onError: () => toast('Could not update client'),
      },
    );
  }

  return (
    <div className="screen">
      <div className="bar solid">
        <button className="iconbtn" onClick={back} aria-label="Back">
          <ChevronLeft />
        </button>
        <div className="bar-title">Edit client</div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Full name</label>
          <input autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" />
        </div>

        <div className="field">
          <label>Age</label>
          <input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" />
        </div>

        <div className="field">
          <label>Phone</label>
          <input
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            inputMode="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
          />
        </div>

        <div className="field">
          <label>Category</label>
          <div className="chips">
            {Object.keys(CATS).map((c) => (
              <button
                type="button"
                key={c}
                className={`cat-chip${category === c ? ' sel' : ''}`}
                onClick={() => setCategory(c)}
              >
                {CATS[c].ic} {c}
              </button>
            ))}
          </div>
        </div>

        {category === 'Sports specific' && (
          <div className="field">
            <label>Ability</label>
            <div className="seg">
              <button type="button" className={ability === 'Abled' ? 'on' : ''} onClick={() => setAbility('Abled')}>
                Abled
              </button>
              <button type="button" className={ability === 'Disabled' ? 'on' : ''} onClick={() => setAbility('Disabled')}>
                Disabled
              </button>
            </div>
          </div>
        )}

        <div className="field">
          <label>Coach</label>
          <div className="selectwrap">
            <select value={coachId} onChange={(e) => setCoachId(e.target.value)}>
              <option value="">Not assigned</option>
              {coaches.map((co) => (
                <option key={co.id} value={co.id}>
                  {co.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bottom-cta sticky-cta cta-row">
          <button type="button" className="bigbtn ghost" onClick={back} disabled={update.isPending}>
            Cancel
          </button>
          <button type="submit" className={`bigbtn${update.isPending ? ' dim' : ''}`} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
