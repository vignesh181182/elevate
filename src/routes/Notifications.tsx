import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  CreditCard,
  CalendarClock,
  RotateCcw,
  ClipboardCheck,
  CalendarPlus,
} from 'lucide-react';
import { useClients, useBillings } from '../hooks/useData';
import { useIsMainCoach } from '../auth/AuthProvider';
import { buildNotifications, type NotificationKind } from '../domain/notifications';

const ICON: Record<NotificationKind, typeof Bell> = {
  overdue: CreditCard,
  expiring: CalendarClock,
  review: RotateCcw,
  assessment: ClipboardCheck,
  schedule: CalendarPlus,
};

// System → coach alert feed (read-only). Derived from real client + billing fields;
// billing alerts are head-coach-only. No coach-authored notifications.
export default function Notifications() {
  const navigate = useNavigate();
  const isMain = useIsMainCoach();
  const { data: clients = [], isLoading } = useClients();
  const { data: billings } = useBillings(clients.map((c) => c.id));

  const items = buildNotifications(clients, billings ?? {}, isMain);

  return (
    <div className="screen">
      <div className="bar solid">
        <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft />
        </button>
        <div className="bar-title">Notifications</div>
      </div>

      {isLoading ? (
        <div className="cl-loading pad-h">Loading…</div>
      ) : items.length === 0 ? (
        <div className="notif-empty">
          <div className="notif-empty-ic">
            <Bell />
          </div>
          <div className="notif-empty-t">You&rsquo;re all caught up</div>
          <div className="notif-empty-s">No pending reviews or alerts right now.</div>
        </div>
      ) : (
        items.map((n) => {
          const Icon = ICON[n.kind];
          return (
            <div
              key={n.id}
              className="notif-row"
              onClick={() => navigate(n.section ? `/clients/${n.clientId}/${n.section}` : `/clients/${n.clientId}`)}
            >
              <div className="notif-row-ic">
                <Icon />
              </div>
              <div className="notif-row-tx">
                <div className="notif-row-t">{n.title}</div>
                <div className="notif-row-s">{n.detail}</div>
              </div>
              <ChevronRight className="notif-row-chev" size={18} />
            </div>
          );
        })
      )}
      <div className="sp24" />
    </div>
  );
}
