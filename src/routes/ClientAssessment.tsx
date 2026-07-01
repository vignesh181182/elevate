import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ClipboardPen, LineChart, Calendar, Lock } from 'lucide-react';
import { useClient, useSaveAssessment } from '../hooks/useData';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';
import { ASSESS_DIMS, ASSESS_PROFILE, mergeBaselineMeasures } from '../domain/assessment';
import type { Assessment, Client } from '../domain/types';

const todayISO = () => new Date().toISOString().slice(0, 10);
const PROFILE_FIELDS = ['bodyType', 'fitnessLevel', 'primaryGoal', 'focusAreas'] as const;
type ProfileField = (typeof PROFILE_FIELDS)[number];

/** Empty string / non-positive → undefined (so the field is omitted, not written as 0). */
const num = (s: string): number | undefined => {
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export default function ClientAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { coach } = useAuth();
  const { data: client, isLoading } = useClient(id);
  const save = useSaveAssessment(id);

  // Pop the pushed entry to return to the detail page we came from. Navigating to the URL with
  // replace would instead create a second detail entry next to the original, so detail's Back
  // would need two taps to leave.
  const back = () => navigate(-1);

  if (isLoading) return <div className="screen"><div className="cl-loading">Loading…</div></div>;
  if (!client) return <div className="screen"><div className="empty"><p>Client not found.</p></div></div>;

  return (
    <Form key={client.id} client={client} coachId={coach?.id ?? ''} save={save} toast={toast} back={back} />
  );
}

// Inner form, keyed on client so initial state seeds once from any existing assessment (redo).
function Form({
  client,
  coachId,
  save,
  toast,
  back,
}: {
  client: Client;
  coachId: string;
  save: ReturnType<typeof useSaveAssessment>;
  toast: (m: string) => void;
  back: () => void;
}) {
  const a = client.assessment;
  // Assessment fee — the measurement/rating/profile/notes cards stay locked until Paid.
  // An already-completed assessment (e.g. a redo, or a pre-gate client) counts as paid so
  // edits aren't re-gated; only fresh leads must mark the fee.
  const [paid, setPaid] = useState(client.assessmentPaid ?? client.assessmentDone);
  const [paidOn, setPaidOn] = useState(client.assessmentPaidOn || todayISO());
  const [weight, setWeight] = useState(a?.weight ? String(a.weight) : '');
  const [height, setHeight] = useState(a?.height ? String(a.height) : '');
  const [waist, setWaist] = useState(a?.waist ? String(a.waist) : '');
  const [ratings, setRatings] = useState<Record<string, number>>({ ...(a?.ratings ?? {}) });
  const [bodyType, setBodyType] = useState(a?.bodyType ?? '');
  const [fitnessLevel, setFitnessLevel] = useState(a?.fitnessLevel ?? '');
  const [primaryGoal, setPrimaryGoal] = useState(a?.primaryGoal ?? '');
  const [focusAreas, setFocusAreas] = useState<string[]>([...(a?.focusAreas ?? [])]);
  const [notes, setNotes] = useState(a?.notes ?? '');

  // single-select values + setters, indexed by profile field
  const single: Record<Exclude<ProfileField, 'focusAreas'>, [string, (v: string) => void]> = {
    bodyType: [bodyType, setBodyType],
    fitnessLevel: [fitnessLevel, setFitnessLevel],
    primaryGoal: [primaryGoal, setPrimaryGoal],
  };

  const setRate = (k: string, n: number) =>
    setRatings((prev) => ({ ...prev, [k]: prev[k] === n ? 0 : n }));
  const toggleFocus = (v: string) =>
    setFocusAreas((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!paid) return toast('Mark the assessment fee as Paid first');
    const w = num(weight);
    const h = num(height);
    const wa = num(waist);
    const ratePairs = Object.entries(ratings).filter(([, n]) => n >= 1 && n <= 5);
    const note = notes.trim();
    if (!w && !h && !wa && !ratePairs.length && !note) {
      return toast('Add at least one measurement, rating or note');
    }

    const assessment: Assessment = {
      date: todayISO(),
      by: coachId,
      ...(w ? { weight: w } : {}),
      ...(h ? { height: h } : {}),
      ...(wa ? { waist: wa } : {}),
      ratings: Object.fromEntries(ratePairs),
      ...(bodyType ? { bodyType } : {}),
      ...(fitnessLevel ? { fitnessLevel } : {}),
      ...(primaryGoal ? { primaryGoal } : {}),
      focusAreas,
      ...(note ? { notes: note } : {}),
    };
    const measures = mergeBaselineMeasures(client.measures, { weight: w, waist: wa });

    save.mutate(
      { assessment, measures, paid, paidOn: paid ? paidOn : null },
      {
        onSuccess: () => {
          toast(`Assessment saved for ${client.name.split(' ')[0]}`);
          back();
        },
        onError: () => toast('Could not save assessment'),
      },
    );
  }

  const first = client.name.split(' ')[0];

  return (
    <div className="screen as-screen">
      <div className="as-head">
        <div className="as-head-tx">
          <div className="as-head-t">{a ? 'Update assessment' : 'Add assessment'}</div>
          <div className="as-head-s">{client.name}</div>
        </div>
        <button className="iconbtn" onClick={back} aria-label="Close">
          ✕
        </button>
      </div>

      <form onSubmit={onSubmit} className="pad as-body">
        <div className="as-hero">
          <div className="as-hero-ic">
            <LineChart />
          </div>
          <div className="as-hero-tx">
            <div className="as-hero-t">Assessment</div>
            <div className="as-hero-s">Capture {first}&rsquo;s baseline measurements and movement quality.</div>
          </div>
        </div>

        <div className="as-card">
          <div className="as-card-t">Assessment fee</div>
          <div className="as-fee">
            <div className="as-fee-opts">
              <button type="button" className={`as-radio${!paid ? ' on' : ''}`} onClick={() => setPaid(false)}>
                <span className="as-dot" />
                Pending
              </button>
              <button type="button" className={`as-radio${paid ? ' on' : ''}`} onClick={() => setPaid(true)}>
                <span className="as-dot" />
                Paid
              </button>
            </div>
            <div className={`as-fee-date${paid ? '' : ' is-disabled'}`}>
              <label>Payment date</label>
              <div className="as-date">
                <Calendar />
                <input
                  type="date"
                  value={paidOn}
                  max={todayISO()}
                  disabled={!paid}
                  onChange={(e) => setPaidOn(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {!paid && (
          <div className="as-gate-note">
            <span className="as-gate-ic">
              <Lock />
            </span>
            <div>
              Mark the assessment fee as <b>Paid</b> to record measurements, ratings and notes.
            </div>
          </div>
        )}

        <div className={`as-gated${paid ? '' : ' is-locked'}`} aria-hidden={!paid}>
        <div className="as-card">
          <div className="as-card-t">Baseline measurements</div>
          <div className="as-measures">
            <Measure label="Weight" unit="kg" value={weight} onChange={setWeight} />
            <Measure label="Height" unit="cm" value={height} onChange={setHeight} />
            <Measure label="Waist" unit="cm" value={waist} onChange={setWaist} />
          </div>
        </div>

        <div className="as-card">
          <div className="as-card-h">
            <div className="as-card-t">Performance ratings</div>
            <div className="as-scale">
              <span>1 = Poor</span>
              <span>5 = Excellent</span>
            </div>
          </div>
          {ASSESS_DIMS.map((d) => (
            <div className="as-rrow" key={d.k}>
              <div className="as-rlabel">
                {d.ic} {d.label}
              </div>
              <div className="as-rbtns">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={`as-rbtn${ratings[d.k] === n ? ' on' : ''}`}
                    onClick={() => setRate(d.k, n)}
                    aria-label={`${d.label} ${n} of 5`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="as-card">
          <div className="as-card-t">Client profile</div>
          <div className="as-card-sub">Used in the welcome letter&rsquo;s assessment summary.</div>
          <div className="as-profile">
            {PROFILE_FIELDS.map((field) => {
              const cfg = ASSESS_PROFILE[field];
              const isMulti = field === 'focusAreas';
              return (
                <div className="as-chipgroup" key={field}>
                  <div className="as-chip-label">
                    {cfg.ic} {cfg.label}
                    {isMulti && <span className="as-chip-hint"> (pick any)</span>}
                  </div>
                  <div className="as-chips">
                    {cfg.opts.map((v) => {
                      const on = isMulti ? focusAreas.includes(v) : single[field][0] === v;
                      const onClick = isMulti
                        ? () => toggleFocus(v)
                        : () => single[field][1](single[field][0] === v ? '' : v);
                      return (
                        <button type="button" key={v} className={`as-chip${on ? ' on' : ''}`} onClick={onClick}>
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="as-card">
          <div className="as-card-h">
            <div className="as-card-t">
              <span className="as-note-ic">
                <ClipboardPen size={15} />
              </span>{' '}
              Assessment notes
            </div>
            <span className="as-count">{notes.length} / 500</span>
          </div>
          <textarea
            className="as-textarea"
            maxLength={500}
            placeholder="Posture, movement quality, strengths, limitations…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        </div>

        <div className="as-foot">
          <button
            type="submit"
            className={`as-btn-primary${save.isPending || !paid ? ' is-off' : ''}`}
            disabled={save.isPending || !paid}
          >
            {save.isPending ? 'Saving…' : 'Save assessment'}
          </button>
        </div>
        <div className="sp24" />
      </form>
    </div>
  );
}

function Measure({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="as-mcell">
      <span className="as-mlabel">{label}</span>
      <div className="as-minput">
        <input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
        <span className="as-unit">{unit}</span>
      </div>
    </div>
  );
}
