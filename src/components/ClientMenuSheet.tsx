import { useState } from 'react';
import { Pencil, Users, Repeat, Play, Pause, UserRound, UserX, ChevronLeft } from 'lucide-react';
import type { Client, ClientStatus, Coach } from '../domain/types';

type View = 'main' | 'coach' | 'status';

// Client action sheet (the hub ⋮ menu): edit info, change coach, change status.
// Coach/status are quick single-field patches; edit routes to the full form.
export default function ClientMenuSheet({
  client,
  coaches,
  onEdit,
  onPatch,
  onClose,
}: {
  client: Client;
  coaches: Coach[];
  onEdit: () => void;
  onPatch: (patch: { status?: ClientStatus; coachId?: string | null }) => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<View>('main');
  const first = client.name.split(' ')[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        {view === 'main' && (
          <>
            <div className="modal-title">{client.name}</div>
            <div className="modal-opts">
              <button className="modal-opt" onClick={onEdit}>
                <span className="mo-ic tint-blue">
                  <Pencil size={19} />
                </span>
                Edit info
              </button>
              <button className="modal-opt" onClick={() => setView('coach')}>
                <span className="mo-ic tint-green">
                  <Users size={19} />
                </span>
                Change coach
              </button>
              <button className="modal-opt" onClick={() => setView('status')}>
                <span className="mo-ic tint-amber">
                  <Repeat size={19} />
                </span>
                Change status
              </button>
            </div>
            <button className="modal-cancel" onClick={onClose}>
              Cancel
            </button>
          </>
        )}

        {view === 'status' && (
          <>
            <div className="modal-subhead">
              <button className="modal-back" onClick={() => setView('main')} aria-label="Back">
                <ChevronLeft size={18} />
              </button>
              <span className="modal-subhead-t">{first}&rsquo;s status</span>
            </div>
            <div className="modal-opts">
              {(
                [
                  { st: 'Active', icon: Play, cls: 'tint-green' },
                  { st: 'Paused', icon: Pause, cls: 'tint-amber' },
                ] as { st: ClientStatus; icon: typeof Play; cls: string }[]
              ).map(({ st, icon: Icon, cls }) => (
                <button
                  key={st}
                  className={`modal-opt${client.status === st ? ' cur' : ''}`}
                  onClick={() => {
                    if (client.status !== st) onPatch({ status: st });
                    onClose();
                  }}
                >
                  <span className={`mo-ic ${cls}`}>
                    <Icon size={19} />
                  </span>
                  {st}
                  <span className="mo-cur">Current</span>
                </button>
              ))}
            </div>
            <button className="modal-cancel" onClick={onClose}>
              Cancel
            </button>
          </>
        )}

        {view === 'coach' && (
          <>
            <div className="modal-subhead">
              <button className="modal-back" onClick={() => setView('main')} aria-label="Back">
                <ChevronLeft size={18} />
              </button>
              <span className="modal-subhead-t">Assign coach</span>
            </div>
            <div className="modal-opts">
              <button
                className={`modal-opt${client.coachId == null ? ' cur' : ''}`}
                onClick={() => {
                  if (client.coachId != null) onPatch({ coachId: null });
                  onClose();
                }}
              >
                <span className="mo-ic tint-muted">
                  <UserX size={19} />
                </span>
                Not assigned
                <span className="mo-cur">Current</span>
              </button>
              {coaches.map((co) => (
                <button
                  key={co.id}
                  className={`modal-opt${client.coachId === co.id ? ' cur' : ''}`}
                  onClick={() => {
                    if (client.coachId !== co.id) onPatch({ coachId: co.id });
                    onClose();
                  }}
                >
                  <span className="mo-ic tint-green">
                    <UserRound size={19} />
                  </span>
                  {co.name}
                  <span className="mo-cur">Current</span>
                </button>
              ))}
            </div>
            <button className="modal-cancel" onClick={onClose}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
