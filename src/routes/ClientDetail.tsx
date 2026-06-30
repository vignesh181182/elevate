import type { CSSProperties, ComponentType } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  MoreHorizontal,
  User,
  UserRound,
  Phone,
  Mail,
  Tag,
  Calendar,
  ClipboardList,
  Target,
  Stethoscope,
  Activity,
  AlertTriangle,
  CalendarPlus,
  PlayCircle,
} from 'lucide-react';
import { useClient, useCoachNameMap } from '../hooks/useData';
import { useIsMainCoach } from '../auth/AuthProvider';
import AssessmentCard from '../components/AssessmentCard';
import ScheduleCard from '../components/ScheduleCard';
import PaymentCard from '../components/PaymentCard';
import ProgramCard from '../components/ProgramCard';
import SessionsCard from '../components/SessionsCard';
import MediaCard from '../components/MediaCard';
import ProgressCard from '../components/ProgressCard';
import { useToast } from '../components/Toast';
import { catStyle } from '../lib/categories';
import { initials } from '../lib/format';
import { clientStage } from '../domain/client';

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

function About({ icon: Icon, k, v }: { icon: ComponentType<{ size?: number }>; k: string; v: string }) {
  return (
    <div className="cp-about-row">
      <div className="cp-about-k">
        <Icon size={15} /> {k}
      </div>
      <div className="cp-about-v">{v || '—'}</div>
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: c, isLoading } = useClient(id);
  const coachName = useCoachNameMap();
  const isMain = useIsMainCoach();

  if (isLoading)
    return (
      <div className="screen center-screen">
        <div className="cl-loading">Loading…</div>
      </div>
    );
  if (!c)
    return (
      <div className="screen">
        <div className="bar solid">
          <button className="iconbtn" onClick={() => navigate('/clients')} aria-label="Back">
            <ChevronLeft />
          </button>
        </div>
        <div className="empty">
          <div className="em">🔍</div>
          <p>Client not found.</p>
        </div>
      </div>
    );

  const cat = catStyle(c.category);
  const avaStyle = { '--c-bg': cat.b, '--c-fg': cat.c } as CSSProperties;
  const catTagStyle = { '--c-bg': cat.b, '--c-fg': cat.c } as CSSProperties;
  const active = c.status === 'Active';
  const statusTagStyle = {
    '--c-bg': active ? 'var(--green-bg)' : 'var(--bg)',
    '--c-fg': active ? 'var(--green)' : 'var(--muted)',
  } as CSSProperties;
  const coach = c.coachId ? coachName[c.coachId] ?? 'Not assigned' : 'Not assigned';
  const stage = clientStage(c);
  const stageStyle = { '--c-bg': 'var(--blue-bg)', '--c-fg': 'var(--blue)' } as CSSProperties;

  return (
    <div className="screen">
      <div className="fadein cprofile">
        <div className="cp-top">
          <button className="iconbtn" onClick={() => navigate('/clients')} aria-label="Back">
            <ChevronLeft />
          </button>
          <div className="cp-top-r">
            <button className="iconbtn" onClick={() => toast('More options — coming soon')} aria-label="More options">
              <MoreHorizontal />
            </button>
          </div>
        </div>

        <div className="cp-prof">
          <div className="cp-ava tint-cat" style={avaStyle}>
            {initials(c.name)}
            <span className={`cp-on${active ? '' : ' off'}`} />
          </div>
          <div className="cp-id">
            <div className="cp-name">{c.name}</div>
            <div className={`cp-status ${active ? 'on' : 'off'}`}>
              <span className="cp-dot" />
              {c.status}
            </div>
            <div className="cp-meta">
              <span>
                <User size={14} />
                {c.age} yrs
              </span>
              <span>
                <ClipboardList size={14} />
                {c.sessions} sessions
              </span>
              <span>
                <UserRound size={14} />
                {coach}
              </span>
            </div>
          </div>
        </div>

        <div className="cp-tags">
          <span className="tag tint-cat" style={catTagStyle}>
            {cat.ic} {c.category}
            {c.category === 'Sports specific' ? ` · ${c.ability}` : ''}
          </span>
          <span className="tag tint-cat" style={statusTagStyle}>
            ● {c.status}
          </span>
          {stage && (
            <span className="tag tint-cat" style={stageStyle}>
              📅 {stage}
            </span>
          )}
        </div>

        {c.scheduleSet && (
          <button className="bigbtn cp-session-cta" onClick={() => navigate(`/clients/${c.id}/session`)}>
            <PlayCircle size={18} /> Today&rsquo;s session
          </button>
        )}

        <div className="cp-card">
          <div className="cp-sec">
            <div className="cp-sec-t">
              <UserRound size={16} className="t-blue" />
              Basic information
            </div>
            <button className="cp-link" onClick={() => toast('Edit client — coming soon')}>
              Edit
            </button>
          </div>
          <KV icon={User} k="Name" v={c.name} />
          <KV icon={Phone} k="Phone number" v={c.phone} />
          <KV icon={Mail} k="Email" v={c.email || 'Not provided'} />
          <KV icon={Tag} k="Category" v={c.category} />
          <KV icon={Calendar} k="Start date" v={c.start} />
          <KV icon={UserRound} k="Coach" v={coach} />
        </div>

        <div className="cp-card">
          <div className="cp-sec">
            <div className="cp-sec-t">
              <Target size={16} className="t-green" />
              Goals &amp; health
            </div>
          </div>
          <About icon={Target} k="Goals" v={c.goals} />
          <About icon={Stethoscope} k="Medical notes" v={c.medical} />
          <About icon={Activity} k="Activity level" v={c.activity} />
          <About icon={AlertTriangle} k="Injuries" v={c.injuries} />
        </div>

        {/* First-assessment — capturable for any client (not an onboarding gate) */}
        <AssessmentCard client={c} />

        {/* Lead activation — assign a coach + schedule to set the client up */}
        {!c.scheduleSet && (
          <div className="cp-card">
            <div className="cp-sec">
              <div className="cp-sec-t">
                <CalendarPlus size={16} className="t-blue" />
                Set up training
              </div>
            </div>
            <div className="cp-about-v">
              Assign a coach and training schedule to activate {c.name.split(' ')[0]}.
            </div>
            <button className="bigbtn cp-cta-btn" onClick={() => navigate(`/clients/${c.id}/schedule`)}>
              <CalendarPlus size={18} /> Schedule &amp; coach
            </button>
          </div>
        )}

        {/* Current training schedule */}
        {c.scheduleSet && <ScheduleCard client={c} />}

        {/* Current program + exercises */}
        {c.scheduleSet && <ProgramCard client={c} />}

        {/* Strength progress (only renders when there's logged data) */}
        {c.scheduleSet && <ProgressCard client={c} />}

        {/* Completed-session history */}
        {c.scheduleSet && <SessionsCard client={c} />}

        {/* Progress photos */}
        {c.scheduleSet && <MediaCard client={c} />}

        {/* Payment — head coach only (juniors never receive billing/payment data) */}
        {isMain && c.scheduleSet && <PaymentCard client={c} />}

        <div className="sp24" />
      </div>
    </div>
  );
}
