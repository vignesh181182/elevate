import { useParams } from 'react-router-dom';
import ClientDrill from '../components/ClientDrill';
import AssessmentCard from '../components/AssessmentCard';

// "Assessment report" drill — read-only report (or pending CTA); Edit routes to capture.
export default function ClientAssessmentView() {
  const { id } = useParams();
  return (
    <ClientDrill id={id} label="Assessment report">{(client) => <AssessmentCard client={client} />}</ClientDrill>
  );
}
