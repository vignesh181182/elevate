import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useClient } from '../hooks/useData';
import type { Client } from '../domain/types';

/** Drill-in back-bar: "‹ {first} · {label}" — back returns to the client hub. */
export function ClientDrillHead({ name, label }: { name: string; label: string }) {
  const navigate = useNavigate();
  const first = name.split(' ')[0];
  return (
    <div className="bar solid">
      <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Back">
        <ChevronLeft />
      </button>
      <div className="bar-title nm">
        {first} · {label}
      </div>
    </div>
  );
}

/**
 * Shared drill-in scaffold: fetches the client, renders the back-bar, and hands the
 * client to a render-prop body. Keeps each section drill screen a thin wrapper around
 * its already-built card component.
 */
export default function ClientDrill({
  id,
  label,
  children,
}: {
  id: string | undefined;
  label: string;
  children: (client: Client) => ReactNode;
}) {
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id);

  if (isLoading)
    return (
      <div className="screen center-screen">
        <div className="cl-loading">Loading…</div>
      </div>
    );
  if (!client)
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

  return (
    <div className="screen">
      <ClientDrillHead name={client.name} label={label} />
      <div className="fadein">
        <div className="sp10" />
        {children(client)}
        <div className="sp24" />
      </div>
    </div>
  );
}
