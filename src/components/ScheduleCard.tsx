import type { ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Calendar, Clock, UserRound, Flag, Timer } from 'lucide-react';
import { useCoachNameMap } from '../hooks/useData';
import { fmtPayDate } from '../lib/format';
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

// Current training schedule for an active client — days / time / coach / program
// start / session length. Edit routes to the schedule & coach screen.
export default function ScheduleCard({ client }: { client: Client }) {
  const navigate = useNavigate();
  const coachName = useCoachNameMap();
  const days = client.days && client.days !== '—' ? client.days : 'Not set';
  const time = client.time && client.time !== '—' ? client.time : 'Not set';
  const coach = client.coachId ? coachName[client.coachId] ?? 'Not assigned' : 'Not assigned';

  return (
    <div className="cp-card">
      <div className="cp-sec">
        <div className="cp-sec-t">
          <CalendarClock size={16} className="t-amber" />
          Current schedule
        </div>
        <button className="cp-link" onClick={() => navigate(`/clients/${client.id}/schedule`)}>
          Edit
        </button>
      </div>
      <KV icon={Calendar} k="Training days" v={days} />
      <KV icon={Clock} k="Time" v={time} />
      <KV icon={UserRound} k="Coach" v={coach} />
      {client.programStartDate && <KV icon={Flag} k="Program start" v={fmtPayDate(client.programStartDate)} />}
      {client.sessionDuration && <KV icon={Timer} k="Session length" v={`${client.sessionDuration} min`} />}
    </div>
  );
}
