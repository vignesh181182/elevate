import { useState, type FormEvent } from 'react';
import { useSavePayment } from '../hooks/useData';
import { useToast } from './Toast';
import { nextPaymentId, PACKAGE_SIZES } from '../domain/payments';
import type { Client, Payment, PaymentStatusValue, PaymentType } from '../domain/types';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Bottom-sheet form to record a new payment or edit an existing one (head-coach-only).
// Money-free: the coach picks what was bought (package size or assessment) and a
// status — never an amount. Saving updates the payment doc + billing balance.
export default function PaymentForm({
  client,
  payments,
  editing,
  onClose,
}: {
  client: Client;
  payments: Payment[];
  editing: Payment | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const save = useSavePayment(client.id);

  const [type, setType] = useState<PaymentType>(editing?.type ?? 'package');
  const [date, setDate] = useState(editing?.date ?? todayISO());
  const [size, setSize] = useState<number>(editing?.sessions ?? editing?.packageSize ?? PACKAGE_SIZES[0]);
  const [status, setStatus] = useState<PaymentStatusValue>(editing?.status ?? 'Paid');
  const [notes, setNotes] = useState(editing?.notes ?? '');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const isPackage = type === 'package';
    const payment: Payment = {
      id: editing ? editing.id : nextPaymentId(payments),
      date,
      type,
      packageSize: isPackage ? size : null,
      sessions: isPackage ? size : null,
      status,
      notes: notes.trim(),
    };
    save.mutate(
      { payment, prev: editing },
      {
        onSuccess: () => {
          toast(editing ? 'Payment updated' : 'Payment recorded');
          onClose();
        },
        onError: () => toast('Could not save payment'),
      },
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{editing ? 'Edit payment' : 'Record payment'}</div>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Type</label>
            <div className="seg">
              <button type="button" className={type === 'package' ? 'on' : ''} onClick={() => setType('package')}>
                Package
              </button>
              <button type="button" className={type === 'assessment' ? 'on' : ''} onClick={() => setType('assessment')}>
                Assessment fee
              </button>
            </div>
          </div>

          {type === 'package' && (
            <div className="field">
              <label>Package size</label>
              <div className="seg">
                {PACKAGE_SIZES.map((n) => (
                  <button type="button" key={n} className={size === n ? 'on' : ''} onClick={() => setSize(n)}>
                    {n} sessions
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <div className="field">
            <label>Status</label>
            <div className="seg">
              <button type="button" className={status === 'Paid' ? 'on' : ''} onClick={() => setStatus('Paid')}>
                Paid
              </button>
              <button type="button" className={status === 'Pending' ? 'on' : ''} onClick={() => setStatus('Pending')}>
                Pending
              </button>
            </div>
          </div>

          <div className="field">
            <label>Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. renewal, referral" />
          </div>

          <div className="bottom-cta cta-row">
            <button type="button" className="bigbtn ghost" onClick={onClose} disabled={save.isPending}>
              Cancel
            </button>
            <button type="submit" className={`bigbtn${save.isPending ? ' dim' : ''}`} disabled={save.isPending}>
              {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Record payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
