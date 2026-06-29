import { Check, X, Ban } from 'lucide-react';
import type { Attendance } from '../domain/types';

const OPTS: { status: Attendance; label: string; icon: typeof Check; bg: string; fg: string }[] = [
  { status: 'present', label: 'Present', icon: Check, bg: 'bg-green', fg: 't-green' },
  { status: 'absent', label: 'Absent', icon: X, bg: 'bg-red', fg: 't-red' },
  { status: 'cancelled', label: 'Cancelled', icon: Ban, bg: 'bg-amber', fg: 't-amber' },
];

// Bottom-sheet attendance picker — mark a client present / absent / cancelled for
// today. Mirrors the prototype's three-option att modal.
export default function AttendanceSheet({
  name,
  current,
  onPick,
  onClose,
}: {
  name: string;
  current: Attendance | undefined;
  onPick: (status: Attendance) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{name.split(' ')[0]}&rsquo;s attendance</div>
        <div className="modal-opts">
          {OPTS.map(({ status, label, icon: Icon, bg, fg }) => (
            <button
              key={status}
              className={`modal-opt${current === status ? ' cur' : ''}`}
              onClick={() => onPick(status)}
            >
              <span className={`mo-ic ${bg} ${fg}`}>
                <Icon size={20} />
              </span>
              {label}
              <span className="mo-cur">Current</span>
            </button>
          ))}
        </div>
        <button className="modal-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
