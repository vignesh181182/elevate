import type { ComponentType } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserRound, User, Phone, Mail, Tag, Calendar } from 'lucide-react';
import ClientDrill from '../components/ClientDrill';
import { useCoachNameMap } from '../hooks/useData';
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

function BasicCard({ client }: { client: Client }) {
  const coachName = useCoachNameMap();
  const navigate = useNavigate();
  const coach = client.coachId ? coachName[client.coachId] ?? 'Not assigned' : 'Not assigned';
  return (
    <div className="cp-card">
      <div className="cp-sec">
        <div className="cp-sec-t">
          <UserRound size={16} className="t-blue" />
          Basic information
        </div>
        <button className="cp-link" onClick={() => navigate(`/clients/${client.id}/edit`)}>
          Edit
        </button>
      </div>
      <KV icon={User} k="Name" v={client.name} />
      <KV icon={Phone} k="Phone number" v={client.phone} />
      <KV icon={Mail} k="Email" v={client.email || 'Not provided'} />
      <KV icon={Tag} k="Category" v={client.category} />
      <KV icon={Calendar} k="Start date" v={client.start} />
      <KV icon={UserRound} k="Coach" v={coach} />
    </div>
  );
}

// "Basic information" drill — name, phone, email, category, start date, coach.
export default function ClientBasic() {
  const { id } = useParams();
  return <ClientDrill id={id} label="Basic information">{(client) => <BasicCard client={client} />}</ClientDrill>;
}
