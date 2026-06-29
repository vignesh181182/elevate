import type { ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  ClipboardList,
  ClipboardPen,
  Calendar,
  UserRound,
  Scale,
  Ruler,
  Target,
  TrendingUp,
  Dumbbell,
  Star,
} from 'lucide-react';
import { ASSESS_DIMS, hasAssessment, rateWord } from '../domain/assessment';
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

// First-assessment entry + read-only report on the client page — available for ANY
// client (the baseline can be captured or re-done anytime; not an onboarding gate).
export default function AssessmentCard({ client }: { client: Client }) {
  const navigate = useNavigate();
  const coachName = useCoachNameMap();
  const first = client.name.split(' ')[0];
  const open = () => navigate(`/clients/${client.id}/assessment`);

  // Pending — nothing captured yet.
  if (!hasAssessment(client)) {
    return (
      <div className="cp-card">
        <div className="cp-sec">
          <div className="cp-sec-t">
            <ClipboardCheck size={16} className="t-green" />
            Assessment
          </div>
          <span className="cp-tagm">Pending</span>
        </div>
        <div className="cp-about-v">Capture {first}&rsquo;s baseline measurements and movement quality.</div>
        <button className="bigbtn cp-cta-btn" onClick={open}>
          <ClipboardList size={18} /> Add assessment
        </button>
      </div>
    );
  }

  // Completed — the read-only report.
  const a = client.assessment!;
  const ratedDims = ASSESS_DIMS.filter((d) => a.ratings?.[d.k]);

  return (
    <div className="cp-card">
      <div className="cp-sec">
        <div className="cp-sec-t">
          <ClipboardCheck size={16} className="t-green" />
          Assessment report
        </div>
        <button className="cp-link" onClick={open}>
          Edit
        </button>
      </div>

      <KV icon={Calendar} k="Assessed on" v={fmtPayDate(a.date) || '—'} />
      <KV icon={UserRound} k="Coach" v={coachName[a.by] || '—'} />
      {a.weight != null && <KV icon={Scale} k="Weight" v={`${a.weight} kg`} />}
      {a.height != null && <KV icon={Ruler} k="Height" v={`${a.height} cm`} />}
      {a.waist != null && <KV icon={Ruler} k="Waist" v={`${a.waist} cm`} />}
      {a.primaryGoal && <KV icon={Target} k="Primary goal" v={a.primaryGoal} />}
      {a.fitnessLevel && <KV icon={TrendingUp} k="Fitness level" v={a.fitnessLevel} />}
      {a.bodyType && <KV icon={UserRound} k="Body type" v={a.bodyType} />}
      {a.focusAreas.length > 0 && <KV icon={Dumbbell} k="Focus areas" v={a.focusAreas.join(', ')} />}
      {ratedDims.map((d) => (
        <KV key={d.k} icon={Star} k={d.label} v={rateWord(a.ratings[d.k])} />
      ))}

      {a.notes && (
        <div className="cp-about-row">
          <div className="cp-about-k">
            <ClipboardPen size={15} /> Notes
          </div>
          <div className="cp-about-v">{a.notes}</div>
        </div>
      )}
    </div>
  );
}
