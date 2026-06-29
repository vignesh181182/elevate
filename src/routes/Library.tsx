import { type CSSProperties, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Search, Dumbbell } from 'lucide-react';
import { useAddProgramExercises, useClientExercises, useLibrary } from '../hooks/useData';
import { useToast } from '../components/Toast';
import { LIB_GROUPS, muscleColor } from '../lib/muscleColors';
import type { LibraryExercise } from '../domain/types';

const keyOf = (e: LibraryExercise) => e.id ?? e.name;

export default function Library() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id: clientId } = useParams(); // present ⇒ picking exercises for a client's program
  const pick = !!clientId;

  const { data: library = [], isLoading } = useLibrary();
  const { data: clientExercises = [] } = useClientExercises(clientId);
  const add = useAddProgramExercises(clientId);

  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('All');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Exercises already in this client's program — shown as "In program", not re-addable.
  const inProgram = useMemo(
    () => new Set(clientExercises.map((e) => e.name.toLowerCase())),
    [clientExercises],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return library
      .filter((e) => {
        if (group !== 'All' && e.group !== group) return false;
        if (q && !(e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [library, query, group]);

  const isFiltered = query.trim() !== '' || group !== 'All';
  const countText = isFiltered ? `${filtered.length} of ${library.length} exercises` : `${library.length} exercises`;

  function toggle(e: LibraryExercise) {
    const k = keyOf(e);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function commit() {
    const items = library
      .filter((e) => selected.has(keyOf(e)))
      .map((e) => ({ name: e.name, group: e.group, target: e.target }));
    if (!items.length) return;
    add.mutate(items, {
      onSuccess: () => {
        toast(`Added ${items.length} exercise${items.length === 1 ? '' : 's'}`);
        navigate(`/clients/${clientId}`);
      },
      onError: () => toast('Could not add exercises'),
    });
  }

  const goBack = () => (pick ? navigate(`/clients/${clientId}`) : navigate(-1));

  return (
    <div className="screen">
      <div className="fadein">
        <div className="bar solid">
          <button className="iconbtn" onClick={goBack} aria-label="Back">
            <ChevronLeft />
          </button>
          <div className="bar-title">{pick ? 'Add to program' : 'Exercise library'}</div>
        </div>

        <div className="searchwrap">
          <div className="search-field">
            <input
              className="search"
              placeholder="Search exercises…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="search-ic">
              <Search size={18} />
            </span>
          </div>
        </div>

        <div className="filters">
          {LIB_GROUPS.map((g) => (
            <button key={g} className={`fchip${group === g ? ' on' : ''}`} onClick={() => setGroup(g)}>
              {g}
            </button>
          ))}
        </div>

        <div className="lib-count">{isLoading ? 'Loading…' : countText}</div>

        <div>
          {filtered.length === 0 && !isLoading ? (
            <div className="lib-empty">No exercises match your search.</div>
          ) : (
            filtered.map((e) => {
              const mc = muscleColor(e.group);
              const tagStyle = { '--c-bg': mc.b, '--c-fg': mc.c } as CSSProperties;
              const k = keyOf(e);
              const already = pick && inProgram.has(e.name.toLowerCase());
              const isSel = selected.has(k);
              return (
                <div className={`lib-row${pick && isSel ? ' pick' : ''}`} key={k}>
                  <div className="lib-ic">
                    <Dumbbell size={18} />
                  </div>
                  <div className="lib-main">
                    <div className="lib-name-row">
                      <span className="lib-name">{e.name}</span>
                      <span className="lib-mg tint-cat" style={tagStyle}>
                        {e.group}
                      </span>
                    </div>
                    <div className="lib-cat">{e.category}</div>
                  </div>
                  {pick ? (
                    already ? (
                      <button className="lib-add inprog" disabled>
                        In program
                      </button>
                    ) : (
                      <button className={`lib-add${isSel ? ' added' : ''}`} onClick={() => toggle(e)}>
                        {isSel ? '✓ Added' : '+ Add'}
                      </button>
                    )
                  ) : (
                    <span className="lib-target">{e.target}</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="bottom-cta sticky-cta">
          {pick ? (
            <button
              className={`bigbtn${!selected.size || add.isPending ? ' dim' : ''}`}
              disabled={!selected.size || add.isPending}
              onClick={commit}
            >
              {add.isPending ? 'Adding…' : `Add ${selected.size || ''} to program`.trim()}
            </button>
          ) : (
            <button className="bigbtn ghost" onClick={() => toast('Add new exercise — coming soon')}>
              + Add new exercise
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
