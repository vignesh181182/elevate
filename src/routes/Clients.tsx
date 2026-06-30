import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Search, X, User, CreditCard, CircleDot, ChevronDown, Filter, Plus } from 'lucide-react';
import { useClients, useCoaches, useCoachNameMap, useBillings, usePatchClient } from '../hooks/useData';
import { useIsMainCoach } from '../auth/AuthProvider';
import { useToast } from '../components/Toast';
import { paymentStatusFromBilling } from '../domain/payments';
import { CLIENT_FILTERS, isFilterKey } from '../domain/filters';
import ClientCard from '../components/ClientCard';
import ClientMenuSheet from '../components/ClientMenuSheet';
import type { Client } from '../domain/types';

type PayFilter = 'All' | 'Paid' | 'DueSoon' | 'Overdue';

export default function Clients() {
  const navigate = useNavigate();
  const toast = useToast();
  const isMain = useIsMainCoach();
  const { data: clients = [], isLoading } = useClients();
  const { data: coaches = [] } = useCoaches();
  const coachName = useCoachNameMap();
  const ids = useMemo(() => clients.map((c) => c.id), [clients]);
  const { data: billings = {} } = useBillings(ids);

  // ⋮ menu (edit / coach / status) for a list card — reuses the ClientDetail sheet.
  const [menuFor, setMenuFor] = useState<Client | null>(null);
  const patch = usePatchClient(menuFor?.id);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [coachId, setCoachId] = useState('All');
  const [status, setStatus] = useState<'All' | 'Active' | 'Paused'>('All');
  const [pay, setPay] = useState<PayFilter>('All');

  // Deep-link filter from a Home stat (e.g. /clients?filter=Payment%20overdue).
  const [params, setParams] = useSearchParams();
  const deepKey = params.get('filter');
  const activeFilter = isFilterKey(deepKey) ? deepKey : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients
      .filter((c) => {
        if (activeFilter && !CLIENT_FILTERS[activeFilter].pred(c, billings[c.id])) return false;
        if (q && !c.name.toLowerCase().includes(q)) return false;
        if (coachId !== 'All' && c.coachId !== coachId) return false;
        if (status !== 'All' && c.status !== status) return false;
        if (isMain && pay !== 'All') {
          if (!c.scheduleSet) return false;
          if (paymentStatusFromBilling(billings[c.id] ?? null) !== pay) return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // A–Z, matching the prototype list order
  }, [clients, query, coachId, status, pay, isMain, billings, activeFilter]);

  return (
    <div className="fadein">
      <div className="bar clients-head">
        {searchOpen ? (
          <div className="cl-searchwrap open">
            <span className="cl-search-ic">
              <Search size={18} />
            </span>
            <input
              className="search cl-search"
              placeholder="Search clients…"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              className="cl-search-x"
              onClick={() => {
                setSearchOpen(false);
                setQuery('');
              }}
              aria-label="Close search"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="ch-icon">
              <Users size={20} />
            </div>
            <div className="ch-title-wrap">
              <div className="bar-title">Clients</div>
              <div className="ch-sub">Manage and track all your clients in one place.</div>
            </div>
            <button className="cl-search-btn ch-search" onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search size={18} />
            </button>
          </>
        )}
      </div>

      <div className="cl-filter-bar">
        <div className="cl-select-wrap">
          <User size={15} className="cl-select-ic" />
          <select className="cl-select" value={coachId} onChange={(e) => setCoachId(e.target.value)}>
            <option value="All">Coaches</option>
            {coaches.map((co) => (
              <option key={co.id} value={co.id}>
                {co.name}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className="cl-select-caret" />
        </div>

        {isMain && (
          <div className="cl-select-wrap">
            <CreditCard size={15} className="cl-select-ic" />
            <select className="cl-select" value={pay} onChange={(e) => setPay(e.target.value as PayFilter)}>
              <option value="All">Payment</option>
              <option value="Paid">Paid</option>
              <option value="DueSoon">Due soon</option>
              <option value="Overdue">Overdue</option>
            </select>
            <ChevronDown size={15} className="cl-select-caret" />
          </div>
        )}

        <div className="cl-select-wrap">
          <CircleDot size={15} className="cl-select-ic" />
          <select
            className="cl-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'All' | 'Active' | 'Paused')}
          >
            <option value="All">All status</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
          </select>
          <ChevronDown size={15} className="cl-select-caret" />
        </div>
      </div>

      {activeFilter && (
        <div className="cl-fbanner">
          <span className="cl-fbanner-t">
            <Filter size={14} />
            {CLIENT_FILTERS[activeFilter].label} · {filtered.length} {filtered.length === 1 ? 'client' : 'clients'}
          </span>
          <button className="cl-fbanner-x" onClick={() => setParams({})}>
            Clear ✕
          </button>
        </div>
      )}

      <div className="cl-cards" id="clientList">
        {isLoading ? (
          <div className="center-screen">
            <div className="cl-loading">Loading clients…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="em">🔍</div>
            <p>No clients match.</p>
          </div>
        ) : (
          filtered.map((c) => (
            <ClientCard
              key={c.id}
              c={c}
              coachName={c.coachId ? coachName[c.coachId] ?? '' : ''}
              billing={billings[c.id]}
              isMain={isMain}
              onMenu={() => setMenuFor(c)}
            />
          ))
        )}
      </div>
      <div className="sp80" />

      <button className="fab" onClick={() => navigate('/clients/new')} aria-label="Add client">
        <Plus size={26} />
      </button>

      {menuFor && (
        <ClientMenuSheet
          client={menuFor}
          coaches={coaches}
          onEdit={() => {
            const id = menuFor.id;
            setMenuFor(null);
            navigate(`/clients/${id}/edit`);
          }}
          onPatch={(p) =>
            patch.mutate(p, {
              onSuccess: () => toast('Client updated'),
              onError: () => toast('Could not update client'),
            })
          }
          onClose={() => setMenuFor(null)}
        />
      )}
    </div>
  );
}
