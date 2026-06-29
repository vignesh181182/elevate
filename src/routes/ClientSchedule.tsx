import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, Calendar } from 'lucide-react';
import { useClient, useCoaches, useSetSchedule } from '../hooks/useData';
import { useToast } from '../components/Toast';
import { parseDays } from '../domain/client';
import { to12h, to24h } from '../lib/format';
import type { Client, Coach } from '../domain/types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LENGTHS = [4, 5, 6];
const DURATIONS = [45, 60, 75, 90];

export default function ClientSchedule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: client, isLoading } = useClient(id);
  const { data: coaches = [] } = useCoaches();
  const save = useSetSchedule(id);

  const back = () => navigate(`/clients/${id}`);

  if (isLoading) return <div className="screen"><div className="cl-loading">Loading…</div></div>;
  if (!client) return <div className="screen"><div className="empty"><p>Client not found.</p></div></div>;

  return <Form key={client.id} client={client} coaches={coaches} save={save} toast={toast} back={back} />;
}

// Inner form, keyed on client so initial state is seeded once from real data.
function Form({
  client,
  coaches,
  save,
  toast,
  back,
}: {
  client: Client;
  coaches: Coach[];
  save: ReturnType<typeof useSetSchedule>;
  toast: (m: string) => void;
  back: () => void;
}) {
  const editing = client.scheduleSet;
  const [coachId, setCoachId] = useState(client.coachId ?? '');
  const [days, setDays] = useState<string[]>(editing ? parseDays(client.days) : ['Mon', 'Wed', 'Fri']);
  const [time, setTime] = useState(to24h(client.time)); // '' for a fresh lead
  const [weeks, setWeeks] = useState(client.program?.weeks ?? 4);
  const [duration, setDuration] = useState(client.sessionDuration ?? 60);
  const [startDate, setStartDate] = useState(client.programStartDate || new Date().toISOString().slice(0, 10));

  const toggleDay = (d: string) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!coachId) return toast('Assign a coach');
    if (!days.length) return toast('Pick training days');
    if (!time) return toast('Pick a session time');

    save.mutate(
      {
        coachId,
        days: DAYS.filter((d) => days.includes(d)), // keep canonical week order
        time: to12h(time),
        weeks,
        sessionDuration: duration,
        programStartDate: startDate,
      },
      {
        onSuccess: () => {
          toast(editing ? 'Schedule updated' : `${client.name.split(' ')[0]} activated`);
          back();
        },
        onError: () => toast('Could not save schedule'),
      },
    );
  }

  const total = weeks * 3;
  const orderedDays = DAYS.filter((d) => days.includes(d));

  return (
    <div className="screen">
      <div className="bar solid">
        <div className="bar-title">{editing ? 'Edit schedule' : 'Schedule & coach'}</div>
        <button className="iconbtn" onClick={back} aria-label="Close">
          ✕
        </button>
      </div>

      <form onSubmit={onSubmit} className="pad">
        <div className="as-card">
          <div className="as-card-t">Training schedule</div>

          <div className="as-field">
            <label>Training days</label>
            <div className="daygrid">
              {DAYS.map((d) => (
                <button
                  type="button"
                  key={d}
                  className={`pill-sel${days.includes(d) ? ' sel' : ''}`}
                  onClick={() => toggleDay(d)}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="pick-hint">{orderedDays.length ? orderedDays.join(', ') : 'Tap days to select'}</div>
          </div>

          <div className="as-field">
            <label>Time</label>
            <div className="as-date">
              <Clock />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="as-card">
          <div className="as-card-t">Coach &amp; program</div>

          <div className="as-field">
            <label>Assigned coach</label>
            <div className="selectwrap">
              <select value={coachId} onChange={(e) => setCoachId(e.target.value)}>
                <option value="" disabled>
                  Select a coach…
                </option>
                {coaches.map((co) => (
                  <option key={co.id} value={co.id}>
                    {co.name}
                    {co.role === 'main' ? ' — Head coach' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="as-field">
            <label>Program length</label>
            <div className="seg">
              {LENGTHS.map((w) => (
                <button type="button" key={w} className={weeks === w ? 'on' : ''} onClick={() => setWeeks(w)}>
                  {w} weeks
                </button>
              ))}
            </div>
            <div className="pick-hint">3 sessions / week · {total} sessions total</div>
          </div>

          <div className="as-field">
            <label>Session duration</label>
            <div className="seg">
              {DURATIONS.map((d) => (
                <button type="button" key={d} className={duration === d ? 'on' : ''} onClick={() => setDuration(d)}>
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div className="as-field">
            <label>Program start date</label>
            <div className="as-date">
              <Calendar />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="bottom-cta sticky-cta cta-row">
          <button type="button" className="bigbtn ghost" onClick={back} disabled={save.isPending}>
            Cancel
          </button>
          <button type="submit" className={`bigbtn${save.isPending ? ' dim' : ''}`} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Activate client'}
          </button>
        </div>
      </form>
    </div>
  );
}
