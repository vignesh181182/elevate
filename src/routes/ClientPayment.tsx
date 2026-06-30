import { Navigate, useParams } from 'react-router-dom';
import ClientDrill from '../components/ClientDrill';
import PaymentCard from '../components/PaymentCard';
import { useIsMainCoach } from '../auth/AuthProvider';

// "Payment" drill — head coach only. Juniors never reach it from the hub (the card is
// hidden for them); a direct visit redirects back to the client.
export default function ClientPayment() {
  const { id } = useParams();
  const isMain = useIsMainCoach();
  if (!isMain) return <Navigate to={`/clients/${id}`} replace />;
  return <ClientDrill id={id} label="Payment">{(client) => <PaymentCard client={client} />}</ClientDrill>;
}
