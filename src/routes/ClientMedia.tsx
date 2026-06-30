import { useParams } from 'react-router-dom';
import ClientDrill from '../components/ClientDrill';
import MediaCard from '../components/MediaCard';

// "Progress photos" drill — upload/delete compressed photos.
export default function ClientMedia() {
  const { id } = useParams();
  return <ClientDrill id={id} label="Progress photos">{(client) => <MediaCard client={client} />}</ClientDrill>;
}
