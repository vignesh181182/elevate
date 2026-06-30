import { useParams } from 'react-router-dom';
import ClientDrill from '../components/ClientDrill';
import ScheduleCard from '../components/ScheduleCard';

// Read-only "Current schedule" drill — the card's Edit link routes to the schedule flow.
export default function ClientScheduleView() {
  const { id } = useParams();
  return <ClientDrill id={id} label="Current schedule">{(client) => <ScheduleCard client={client} />}</ClientDrill>;
}
