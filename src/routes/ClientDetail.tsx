import type { CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  User,
  UserRound,
  ClipboardList,
  ClipboardCheck,
  CalendarCheck,
  CalendarClock,
  PlayCircle,
  Wallet,
  TrendingUp,
  Image as ImageIcon,
} from 'lucide-react';
import { useState } from 'react';
import {
  useClient,
  useClientExercises,
  useClientMedia,
  useCoaches,
  useCoachNameMap,
  usePatchClient,
  useBilling,
  usePayments,
} from '../hooks/useData';
import { useIsMainCoach } from '../auth/AuthProvider';
import ClientMenuSheet from '../components/ClientMenuSheet';
import PendingOnboarding from '../components/PendingOnboarding';
import Sparkline from '../components/charts/Sparkline';
import { useToast } from '../components/Toast';
import { catStyle } from '../lib/categories';
import { muscleColor } from '../lib/muscleColors';
import { initials, fmtShortDate } from '../lib/format';
import { clientStage, programDisplayName, currentProgramWeek } from '../domain/client';
import { paymentStatus, daysOverdue, totalPurchased } from '../domain/payments';
import { progressSummary, muscleGroupProgress, hasProgressData } from '../domain/progress';
import type { Client } from '../domain/types';

const arrow = (v: number) => (v > 0 ? '↑' : v < 0 ? '↓' : '');

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: c, isLoading } = useClient(id);
  const { data: coaches = [] } = useCoaches();
  const coachName = useCoachNameMap();
  const isMain = useIsMainCoach();
  const patch = usePatchClient(id);
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

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
          <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Back">
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
  const active = c.status === 'Active';
  const coach = c.coachId ? coachName[c.coachId] ?? 'Not assigned' : 'Not assigned';
  const go = (sub: string) => navigate(`/clients/${c.id}/${sub}`);

  const top = (
    <div className="cp-top">
      <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Back">
        <ChevronLeft />
      </button>
      <div className="cp-top-r">
        {c.assessmentDone && (
          <button className="iconbtn" onClick={() => setMenuOpen(true)} aria-label="More options">
            <MoreHorizontal />
          </button>
        )}
      </div>
    </div>
  );

  const menu = menuOpen && (
    <ClientMenuSheet
      client={c}
      coaches={coaches}
      onEdit={() => {
        setMenuOpen(false);
        go('edit');
      }}
      onPatch={(p) =>
        patch.mutate(p, {
          onSuccess: () => toast('Client updated'),
          onError: () => toast('Could not update client'),
        })
      }
      onClose={() => setMenuOpen(false)}
    />
  );

  const prof = (
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
            {c.sessions} Sessions
          </span>
          <span>
            <UserRound size={14} />
            {coach}
          </span>
        </div>
      </div>
    </div>
  );

  // ---- Lead (not yet set up): pending overview with the assessment + set-up actions ----
  if (!c.scheduleSet) {
    const catTagStyle = { '--c-bg': cat.b, '--c-fg': cat.c } as CSSProperties;
    const statusTagStyle = {
      '--c-bg': active ? 'var(--green-bg)' : 'var(--bg)',
      '--c-fg': active ? 'var(--green)' : 'var(--muted)',
    } as CSSProperties;
    const stage = clientStage(c);
    const stageStyle = { '--c-bg': 'var(--blue-bg)', '--c-fg': 'var(--blue)' } as CSSProperties;
    return (
      <div className="screen">
        <div className="fadein cprofile">
          {menu}
          {top}
          {prof}
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
          <PendingOnboarding client={c} />
          <div className="sp24" />
        </div>
      </div>
    );
  }

  // ---- Set-up client: the single-scroll hub (cp-prof + cards + drill rows) ----
  const wk = currentProgramWeek(c);
  const weeks = c.program?.weeks ?? 6;

  return (
    <div className="screen">
      <div className="fadein cprofile">
        {menu}
        {top}
        {prof}

        {/* Payment + session balance — head coach only (juniors never read billing) */}
        {isMain && <HubBilling client={c} onOpen={go} />}

        {/* Program row is always visible; the billing rows live in HubBilling above */}
        <div className="cp-card cp-group">
          <div className="cp-row tap" onClick={() => go('program')}>
            <span className="cp-row-ic tint-purple">
              <ClipboardList size={21} />
            </span>
            <div className="cp-row-m">
              <div className="cp-row-t">Current active program</div>
              <div className="cp-row-s">
                {programDisplayName(c.program)} · Week {wk} of {weeks}
              </div>
            </div>
            <ChevronRight className="cp-chev" />
          </div>
        </div>

        {/* Basic / assessment / schedule drill rows */}
        <div className="cp-card cp-group">
          <div className="cp-row tap" onClick={() => go('basic')}>
            <span className="cp-row-ic tint-blue">
              <UserRound size={21} />
            </span>
            <div className="cp-row-m">
              <div className="cp-row-t">Basic information</div>
              <div className="cp-row-s">Phone, email &amp; category</div>
            </div>
            <ChevronRight className="cp-chev" />
          </div>
          <div className="cp-row tap" onClick={() => go('assessment-view')}>
            <span className="cp-row-ic tint-green">
              <ClipboardCheck size={21} />
            </span>
            <div className="cp-row-m">
              <div className="cp-row-t">Assessment report</div>
              <div className="cp-row-s">
                {c.assessment
                  ? 'Measurements, goals & ratings'
                  : c.assessmentDone
                    ? 'Goals & health summary'
                    : 'Assessment pending'}
              </div>
            </div>
            <ChevronRight className="cp-chev" />
          </div>
          <div className="cp-row tap" onClick={() => go('schedule-view')}>
            <span className="cp-row-ic tint-amber">
              <CalendarClock size={21} />
            </span>
            <div className="cp-row-m">
              <div className="cp-row-t">Current schedule</div>
              <div className="cp-row-s">
                {c.days && c.days !== '—' ? c.days : 'Not set'}
                {c.time && c.time !== '—' ? ` · ${c.time}` : ''}
              </div>
            </div>
            <ChevronRight className="cp-chev" />
          </div>
        </div>

        <HubPhotos client={c} onOpen={go} />
        <HubStrength client={c} onOpen={go} />

        <div className="sp24" />
      </div>
    </div>
  );
}

/** Payment-status card + session-balance rows — rendered only for the head coach. */
function HubBilling({ client, onOpen }: { client: Client; onOpen: (sub: string) => void }) {
  const { data: billing } = useBilling(client.id);
  const { data: payments = [] } = usePayments(client.id);

  const status = paymentStatus(billing ?? null, payments);
  const payInfo: Record<string, [string, string]> = {
    Paid: ['Up to date', 'cp-g'],
    DueSoon: ['Due soon', 'cp-a'],
    Overdue: [`Overdue · ${daysOverdue(billing ?? null, payments)}d`, 'cp-r'],
    New: ['No payments', 'cp-m'],
  };
  const [payLabel, payCls] = payInfo[status] ?? ['—', 'cp-m'];
  const lastSess = billing?.lastSessionDate ? fmtShortDate(billing.lastSessionDate) : '—';

  const tot = totalPurchased(payments, billing?.packageSize ?? 0);
  const rem = billing?.sessionsRemaining ?? 0;
  const used = Math.max(0, tot - rem);
  const pct = tot ? Math.round((used / tot) * 100) : 0;
  const barStyle = { '--pct': `${pct}%` } as CSSProperties;

  return (
    <>
      <div className="cp-card cp-pay" onClick={() => onOpen('payment')}>
        <span className="cp-pay-ic">
          <Wallet />
        </span>
        <div className="cp-pay-tx">
          <div className="cp-pay-t">Payment status</div>
          <div className="cp-pay-s">
            <b className={payCls}>{payLabel}</b> · Last session {lastSess}
          </div>
        </div>
        <button
          className="cp-outline"
          onClick={(e) => {
            e.stopPropagation();
            onOpen('payment');
          }}
        >
          View details
        </button>
      </div>

      <div className="cp-card cp-group">
        <div className="cp-row">
          <span className="cp-row-ic tint-red">
            <CalendarCheck size={21} />
          </span>
          <div className="cp-row-m">
            <div className="cp-row-t">Sessions used</div>
            <div className="cp-row-s">
              {used} of {tot} purchased
            </div>
          </div>
          <div className="cp-prog">
            <div className="cp-bar">
              <i style={barStyle} />
            </div>
            <span className="cp-pct">{pct}%</span>
          </div>
        </div>
        <div className="cp-row tap" onClick={() => onOpen('sessions')}>
          <span className="cp-row-ic tint-green">
            <PlayCircle size={21} />
          </span>
          <div className="cp-row-m">
            <div className="cp-row-t">Active sessions</div>
            <div className="cp-row-s">
              {rem} session{rem !== 1 ? 's' : ''} remaining
            </div>
          </div>
          <ChevronRight className="cp-chev" />
        </div>
      </div>
    </>
  );
}

/** Progress-photos strip — real media only, with an add affordance. */
function HubPhotos({ client, onOpen }: { client: Client; onOpen: (sub: string) => void }) {
  const { data: photos = [] } = useClientMedia(client.id);
  return (
    <div className="cp-card">
      <div className="cp-sec">
        <div className="cp-sec-t">
          <ImageIcon size={16} className="t-pink" />
          Progress photos
        </div>
        <button className="cp-link" onClick={() => onOpen('media')}>
          View all
        </button>
      </div>
      <div className="cp-photos">
        {photos.slice(0, 6).map((ph) => (
          <div key={ph.id} className="cp-photo">
            <img className="cp-photo-img" src={ph.data} alt={ph.caption || 'Progress photo'} />
            <div className="cp-photo-cap">{ph.caption || (ph.createdAt ? fmtShortDate(ph.createdAt) : '')}</div>
          </div>
        ))}
        <button className="cp-photo-add" onClick={() => onOpen('media')}>
          <ImageIcon size={20} />
          <span>Add new</span>
        </button>
      </div>
    </div>
  );
}

/** Inline strength summary — tiles + per-muscle gain grid; omitted when no logs exist. */
function HubStrength({ client, onOpen }: { client: Client; onOpen: (sub: string) => void }) {
  const { data: exercises = [] } = useClientExercises(client.id);
  if (!hasProgressData(exercises)) return null;

  const s = progressSummary(exercises, client.programStartDate, client.sessions);
  const groups = muscleGroupProgress(exercises);
  const gain = s.avgGain == null ? '—' : arrow(s.avgGain) + Math.abs(s.avgGain) + '%';
  const vol = s.volChange == null ? '—' : arrow(s.volChange) + Math.abs(s.volChange) + '%';

  return (
    <>
      <div className="cp-secrow">
        <div className="cp-sec-t">
          <TrendingUp size={16} className="t-accent" />
          Strength progress
        </div>
        <button className="cp-link" onClick={() => onOpen('progress')}>
          View all <ChevronRight size={14} />
        </button>
      </div>
      <div className="cp-card">
        <div className="pg-tiles">
          <div className="pg-tile">
            <div className="pg-tile-l">Est. 1RM gain</div>
            <div className={`pg-tile-v ${s.avgGain && s.avgGain > 0 ? 'pos' : ''}`}>{gain}</div>
          </div>
          <div className="pg-tile">
            <div className="pg-tile-l">Total volume</div>
            <div className={`pg-tile-v ${s.volChange && s.volChange > 0 ? 'pos' : ''}`}>{vol}</div>
          </div>
          <div className="pg-tile">
            <div className="pg-tile-l">New PRs</div>
            <div className={`pg-tile-v ${s.prCount > 0 ? 'pos' : ''}`}>{s.prCount}</div>
          </div>
          <div className="pg-tile">
            <div className="pg-tile-l">Sessions</div>
            <div className="pg-tile-v">{s.sessions}</div>
          </div>
        </div>
        {groups.length > 0 && (
          <div className="pg-mg-grid cp-hist-h">
            {groups.map((g) => {
              const col = muscleColor(g.group);
              const tagStyle = { '--c-fg': col.c, '--c-bg': col.b } as CSSProperties;
              return (
                <div className="pg-mg" key={g.group}>
                  <div className="pg-mg-top">
                    <span className="pg-mg-tag tint-cat" style={tagStyle}>
                      {g.group}
                    </span>
                    <span className={`pg-mg-gain ${g.gainPct != null && g.gainPct > 0 ? 'pos' : 'flat'}`}>
                      {g.gainPct == null ? '—' : `${arrow(g.gainPct)}${Math.abs(g.gainPct)}%`}
                    </span>
                  </div>
                  <div className="pg-mg-spark">
                    <Sparkline vals={g.sparkline} stroke={col.c} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
