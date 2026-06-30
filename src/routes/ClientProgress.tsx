import { useParams } from 'react-router-dom';
import ClientDrill from '../components/ClientDrill';
import ProgressCard from '../components/ProgressCard';

// "Strength progress" drill — full tiles, muscle grid, exercise progression, PRs, measures.
export default function ClientProgress() {
  const { id } = useParams();
  return <ClientDrill id={id} label="Progress">{(client) => <ProgressCard client={client} />}</ClientDrill>;
}
