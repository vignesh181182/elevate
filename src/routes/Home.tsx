import PageStub from '../components/PageStub';
import { useAuth } from '../auth/AuthProvider';

export default function Home() {
  const { coach } = useAuth();
  return (
    <PageStub
      title={coach ? `Welcome, ${coach.name.split(' ')[0]}` : 'Home'}
      note="Dashboard — built in milestone 3."
    />
  );
}
