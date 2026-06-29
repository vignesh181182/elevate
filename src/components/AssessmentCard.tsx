import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, ClipboardList } from 'lucide-react';
import { hasAssessment } from '../domain/assessment';
import type { Client } from '../domain/types';

// First-assessment entry on the client page — available for ANY client (the baseline
// can be captured or re-done anytime; it is not an onboarding gate). The full
// read-only report renders here in a later slice.
export default function AssessmentCard({ client }: { client: Client }) {
  const navigate = useNavigate();
  const done = hasAssessment(client);
  const first = client.name.split(' ')[0];

  return (
    <div className="cp-card">
      <div className="cp-sec">
        <div className="cp-sec-t">
          <ClipboardCheck size={16} className="t-green" />
          Assessment
        </div>
        <span className="cp-tagm">{done ? 'Completed' : 'Pending'}</span>
      </div>
      <div className="cp-about-v">
        {done
          ? `Baseline captured. Update ${first}'s assessment anytime.`
          : `Capture ${first}'s baseline measurements and movement quality.`}
      </div>
      <button className="bigbtn cp-cta-btn" onClick={() => navigate(`/clients/${client.id}/assessment`)}>
        <ClipboardList size={18} /> {done ? 'Update assessment' : 'Add assessment'}
      </button>
    </div>
  );
}
