import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Eye, Lock, Pencil, ChevronRight, Calendar, Phone, Mail, Tag, Medal } from 'lucide-react';
import type { Client } from '../domain/types';

interface StepProps {
  n: number;
  done: boolean;
  active: boolean;
  title: string;
  sub: string;
  right: ReactNode;
}

// A step is locked (ns-locked) whenever it is neither done nor active.
function Step({ n, done, active, title, sub, right }: StepProps) {
  const cls = done ? 'done' : active ? 'active' : 'ns-locked';
  return (
    <div className={`ns-step ${cls}`}>
      <div className="ns-num-wrap">
        <div className={`ns-num ${cls}`}>{done ? <Check size={15} /> : n}</div>
      </div>
      <div className="ns-box">
        <div className="ns-body">
          <div className="ns-step-t">{title}</div>
          <div className="ns-step-s">{sub}</div>
        </div>
        <div className="ns-right">{right}</div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="pd-row">
      <div className="pd-ic">
        <Icon size={16} />
      </div>
      <div className="pd-l">{label}</div>
      <div className="pd-v">{value}</div>
    </div>
  );
}

// Gated 3-step onboarding overview shown for a lead (until scheduleSet activates them):
// 1 Assessment → 2 Schedule & coach (locked until 1) → 3 Welcome note (locked until 2).
export default function PendingOnboarding({ client: c }: { client: Client }) {
  const navigate = useNavigate();
  const first = c.name.split(' ')[0];
  const go = (sub: string) => navigate(`/clients/${c.id}/${sub}`);

  const aDone = c.assessmentDone;
  const sDone = c.scheduleDone;
  const aDraft = !aDone && !!c.assessment;
  const completed = (aDone ? 1 : 0) + (sDone ? 1 : 0);

  const arrow = (sub: string, label: string) => (
    <button className="ns-btn ns-btn-arrow" onClick={() => go(sub)} aria-label={label}>
      <ChevronRight size={18} />
    </button>
  );
  const lockIcon = (
    <div className="ns-lock">
      <Lock size={15} />
    </div>
  );

  return (
    <div className="fadein pending-wrap">
      <div className="pending-foot">
        <div className="pf-ic">
          <Check size={18} />
        </div>
        <div className="pf-tx">
          <b>Complete all three steps to activate {first}&rsquo;s training journey.</b>
          <span>You can edit or update details anytime.</span>
        </div>
        <div className="pf-leaf">🌿</div>
      </div>

      <div className="block ns-card">
        <div className="ns-head">
          <span className="ns-h-t">Next steps</span>
          <span className="ns-count">{completed} of 3 completed</span>
        </div>
        <div className="ns-steps">
          <Step
            n={1}
            done={aDone}
            active={!aDone}

            title="Add assessment"
            sub={aDraft ? 'Draft saved — continue to complete it' : 'Capture baseline measurements & ratings'}
            right={
              aDone ? (
                <button className="ns-view" onClick={() => go('assessment-view')}>
                  <Eye size={14} /> View
                </button>
              ) : (
                arrow('assessment', aDraft ? 'Continue assessment' : 'Add assessment')
              )
            }
          />
          <Step
            n={2}
            done={sDone}
            active={aDone && !sDone}

            title="Add schedule & coach"
            sub="Plan training schedule & assign a coach"
            right={
              !aDone ? (
                lockIcon
              ) : sDone ? (
                <button className="ns-view" onClick={() => go('schedule')}>
                  <Pencil size={14} /> Edit
                </button>
              ) : (
                arrow('schedule', 'Add schedule and coach')
              )
            }
          />
          <Step
            n={3}
            done={false}
            active={sDone}

            title="Welcome note"
            sub="Review & send the welcome note to finish"
            right={sDone ? arrow('welcome', 'Welcome note') : lockIcon}
          />
        </div>
      </div>

      <div className="pending-cols">
        <div className="block pd-card">
          <div className="pd-head">
            <span>Client details</span>
            <button className="pd-link pd-link-ic" onClick={() => go('edit')} aria-label="Edit client details">
              <Pencil size={15} />
            </button>
          </div>
          <Row icon={Calendar} label="Age" value={`${c.age} yrs`} />
          <Row icon={Phone} label="Phone" value={c.phone} />
          <Row icon={Mail} label="Email" value={c.email || '—'} />
          <Row icon={Tag} label="Category" value={c.category} />
          {c.category === 'Sports specific' && <Row icon={Medal} label="Ability" value={c.ability} />}
        </div>

        <div className="block qs-card">
          <div className="pd-head">
            <span>Questionnaire summary</span>
          </div>
          <div className="qs-item">
            <span className="qs-dot" />
            <div className="qs-tx">
              <div className="qs-t">Fitness Goals</div>
              <div className="qs-s">{c.goals || '—'}</div>
            </div>
          </div>
          <div className="qs-item">
            <span className="qs-dot" />
            <div className="qs-tx">
              <div className="qs-t">Medical History</div>
              <div className="qs-s">{c.medical || '—'}</div>
            </div>
          </div>
          <div className="qs-item">
            <span className="qs-dot" />
            <div className="qs-tx">
              <div className="qs-t">Activity Level</div>
              <div className="qs-s">{c.activity || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sp18" />
    </div>
  );
}
