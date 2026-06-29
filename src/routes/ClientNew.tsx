import { useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateClient } from '../hooks/useData';
import { useToast } from '../components/Toast';
import { CATS } from '../lib/categories';
import { COUNTRIES, emailOk, phoneNeed, phoneOk } from '../lib/countries';

// Staged add-client — Flow A: basics + questionnaire. Creates a fresh lead
// (coach + assessment + schedule come later from the client's pending overview).
export default function ClientNew() {
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateClient();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [dial, setDial] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('General wellness');
  const [ability, setAbility] = useState('Abled');
  const [goals, setGoals] = useState('');
  const [medical, setMedical] = useState('');
  const [activity, setActivity] = useState('');

  const digits = phone.replace(/\D/g, '');
  const pOk = phoneOk(digits, dial);
  const phoneHint = !digits ? '' : pOk ? `✓ ${digits.length} digits` : `${digits.length} / ${phoneNeed(dial)} digits`;
  const phoneColor = !digits ? 'var(--muted)' : pOk ? 'var(--green)' : 'var(--red)';
  const eTrim = email.trim();
  const eOk = emailOk(eTrim);
  const emailHint = !eTrim ? '' : eOk ? '✓ Looks good' : 'Enter a valid email';
  const emailColor = !eTrim ? 'var(--muted)' : eOk ? 'var(--green)' : 'var(--red)';

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return toast('Enter a name');
    if (!digits) return toast('Enter a phone number');
    if (!pOk) return toast(dial === '+91' ? 'Enter a valid 10-digit phone' : 'Enter a valid phone number');
    if (eTrim && !eOk) return toast('Enter a valid email');

    create.mutate(
      {
        name: n,
        age: Number(age) || 0,
        phone: `${dial} ${phone.trim()}`,
        email: eTrim,
        category,
        ability,
        goals,
        medical,
        activity,
      },
      {
        onSuccess: (id) => {
          toast(`${n.split(' ')[0]} added — assessment pending`);
          navigate(`/clients/${id}`);
        },
        onError: () => toast('Could not add client'),
      },
    );
  }

  return (
    <div className="screen">
      <div className="bar solid">
        <div className="bar-title">Add client</div>
        <button className="iconbtn" onClick={() => navigate('/clients')} aria-label="Close">
          ✕
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <div className="step-title">Client details</div>
        <div className="step-sub">The basics to set them up.</div>

        <div className="field">
          <label>Full name</label>
          <input placeholder="e.g. Rahul Sharma" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="field">
          <label>Age</label>
          <input type="number" inputMode="numeric" placeholder="e.g. 30" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>

        <div className="field">
          <label>Phone</label>
          <div className="phone-row">
            <div className="selectwrap dial">
              <select value={dial} onChange={(e) => setDial(e.target.value)}>
                {COUNTRIES.map((co) => (
                  <option key={co.d} value={co.d}>
                    {co.f} {co.d}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="phone-input"
              inputMode="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="input-hint" style={{ '--c-fg': phoneColor } as CSSProperties}>
            {phoneHint}
          </div>
        </div>

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="e.g. rahul@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="input-hint" style={{ '--c-fg': emailColor } as CSSProperties}>
            {emailHint}
          </div>
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

        <div className="step-title">Questionnaire</div>
        <div className="step-sub">Goals, history &amp; lifestyle.</div>

        <div className="field">
          <label>Fitness goals</label>
          <textarea placeholder="What do they want to achieve?" value={goals} onChange={(e) => setGoals(e.target.value)} />
        </div>

        <div className="field">
          <label>Medical history</label>
          <textarea
            placeholder="Injuries, conditions, surgeries…"
            value={medical}
            onChange={(e) => setMedical(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Current activity level</label>
          <input
            placeholder="e.g. Moderate — trains 2×/week"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
          />
        </div>

        <div className="bottom-cta sticky-cta cta-row">
          <button type="button" className="bigbtn ghost" onClick={() => navigate('/clients')} disabled={create.isPending}>
            Cancel
          </button>
          <button type="submit" className={`bigbtn${create.isPending ? ' dim' : ''}`} disabled={create.isPending}>
            {create.isPending ? 'Adding…' : 'Add client'}
          </button>
        </div>
      </form>
    </div>
  );
}
