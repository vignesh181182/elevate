import type { ComponentType } from 'react';
import { Wallet, CalendarCheck, PlayCircle, RotateCcw, CreditCard, ClipboardList } from 'lucide-react';
import { useBilling, usePayments } from '../hooks/useData';
import { useToast } from './Toast';
import { fmtPayDate, fmtShortDate } from '../lib/format';
import {
  paymentStatus,
  daysOverdue,
  projectedRenewalDate,
  totalPurchased,
  lastPayment,
  paymentLabel,
} from '../domain/payments';
import type { Client } from '../domain/types';

function KV({ icon: Icon, k, v }: { icon: ComponentType<{ size?: number }>; k: string; v: string }) {
  return (
    <div className="cp-kv">
      <span className="cp-kic">
        <Icon size={15} />
      </span>
      <span className="cp-kk">{k}</span>
      <span className="cp-kvv">{v}</span>
    </div>
  );
}

// Head-coach-only payment card. Money-free: shows what was bought, sessions
// remaining, the projected due date, and each payment's status + date — never an amount.
export default function PaymentCard({ client }: { client: Client }) {
  const toast = useToast();
  const { data: billing, isLoading: bLoading } = useBilling(client.id);
  const { data: payments = [], isLoading: pLoading } = usePayments(client.id);

  if (bLoading || pLoading)
    return (
      <div className="cp-card">
        <div className="cl-loading">Loading payment…</div>
      </div>
    );

  const status = paymentStatus(billing ?? null, payments);
  const cadence = client.days && client.days !== '—' ? client.days : '—';

  const statusPill =
    status === 'Paid' ? (
      <span className="pp-pill paid">Paid</span>
    ) : status === 'DueSoon' ? (
      <span className="pp-pill due">Due soon</span>
    ) : status === 'Overdue' ? (
      <span className="pp-pill over">Overdue · {daysOverdue(billing ?? null, payments)} days</span>
    ) : null;

  return (
    <div className="cp-card">
      <div className="cp-sec">
        <div className="cp-sec-t">
          <Wallet size={16} className="t-amber" />
          Payment
        </div>
        {statusPill}
      </div>

      {status === 'New' || !billing ? (
        <div className="cp-about-v">No sessions purchased yet.</div>
      ) : (
        <>
          <KV
            icon={PlayCircle}
            k="Sessions left"
            v={`${billing.sessionsRemaining} of ${totalPurchased(payments, billing.packageSize)}`}
          />
          <KV icon={ClipboardList} k="Package" v={`${billing.packageSize} sessions · ${cadence}`} />
          {lastPayment(payments) && (
            <KV icon={CalendarCheck} k="Last paid" v={fmtPayDate(lastPayment(payments)!.date)} />
          )}
          {billing.sessionsRemaining > 0 && projectedRenewalDate(billing, client.days) && (
            <KV icon={RotateCcw} k="Likely renewal" v={`~${fmtShortDate(projectedRenewalDate(billing, client.days))}`} />
          )}
        </>
      )}

      {payments.length > 0 && (
        <>
          <div className="cp-about-k cp-hist-h">
            <CreditCard size={15} /> Payment history
          </div>
          {payments.map((p) => (
            <div className="cp-kv" key={p.id}>
              <span className="cp-kic">
                <CreditCard size={15} />
              </span>
              <span className="cp-kk">{fmtPayDate(p.date)}</span>
              <span className="cp-kvv">
                {paymentLabel(p)} · {p.status}
              </span>
            </div>
          ))}
        </>
      )}

      <button className="cp-link" onClick={() => toast('Record payment — coming soon')}>
        + Record payment
      </button>
    </div>
  );
}
