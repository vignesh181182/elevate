import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Stethoscope, Calendar, CheckCircle2, CreditCard, Clock } from 'lucide-react';
import type { Billing, Client } from '../domain/types';
import { catStyle } from '../lib/categories';
import { initials } from '../lib/format';
import { paymentStatusFromBilling, daysOverdueFromBilling } from '../domain/payments';

// Payment cell. Lifecycle pills (assessment/schedule pending) come from client
// flags and show for everyone. The Paid/Due/Overdue pills are payment data and
// render only for the main coach (juniors never receive billing — see rules).
function PaymentCell({ c, billing, isMain }: { c: Client; billing?: Billing | null; isMain: boolean }) {
  if (!c.assessmentDone)
    return (
      <span className="clt-pill amber">
        <Stethoscope size={13} /> Assessment pending
      </span>
    );
  if (!c.scheduleDone)
    return (
      <span className="clt-pill blue">
        <Calendar size={13} /> Schedule pending
      </span>
    );
  if (!isMain) return null;
  if (!billing) return <span className="clt-dash">—</span>;

  const ps = paymentStatusFromBilling(billing);
  if (ps === 'Paid')
    return (
      <span className="clt-pill green">
        <CheckCircle2 size={13} /> Paid
      </span>
    );
  if (ps === 'DueSoon')
    return (
      <span className="clt-pill amber">
        <CreditCard size={13} /> Due soon
      </span>
    );
  return (
    <span className="clt-pill red">
      <Clock size={13} /> Overdue · {daysOverdueFromBilling(billing)} days
    </span>
  );
}

export default function ClientCard({
  c,
  coachName,
  billing,
  isMain,
}: {
  c: Client;
  coachName: string;
  billing?: Billing | null;
  isMain: boolean;
}) {
  const navigate = useNavigate();
  const cat = catStyle(c.category);
  const avaStyle = { '--c-bg': cat.b, '--c-fg': cat.c } as CSSProperties;
  const remaining = billing?.sessionsRemaining ?? 0;

  return (
    <div
      className={`clc-card${c.status === 'Paused' ? ' paused' : ''}`}
      onClick={() => navigate(`/clients/${c.id}`)}
    >
      <div className="clc-top">
        <div className="ava clc-ava tint-cat" style={avaStyle}>
          {initials(c.name)}
        </div>
        <div className="clc-id">
          <div className="clc-name">{c.name}</div>
          <div className="clc-coach">
            <User size={13} /> Coach: {coachName || 'Not assigned'}
          </div>
        </div>
      </div>
      <div className="clc-foot">
        <PaymentCell c={c} billing={billing} isMain={isMain} />
        {isMain && c.scheduleSet && billing && (
          <span className="clc-sess">
            {remaining} session{remaining === 1 ? '' : 's'} left
          </span>
        )}
      </div>
    </div>
  );
}
