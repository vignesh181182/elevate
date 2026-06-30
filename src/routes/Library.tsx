import { type CSSProperties, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Search, Dumbbell } from 'lucide-react';
import { useAddProgramExercises, useClientExercises, useLibrary } from '../hooks/useData';
import { useToast } from '../components/Toast';
import LibraryForm from '../components/LibraryForm';
import { LIB_GROUPS, muscleColor } from '../lib/muscleColors';
import { PROG_LABELS, type ProgLabel } from '../domain/program';
import type { LibraryExercise } from '../domain/types';

const keyOf = (e: LibraryExercise) => e.id ?? e.name;

export default function Library() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id: clientId } = useParams(); // present ⇒ picking exercises for a client's program
  const pick = !!clientId;
  const [params] = useSearchParams();
  const day = params.get('day') ?? undefined;
  const progRaw = params.get('prog');
  const prog = (PROG_LABELS as string[]).includes(progRaw ?? '') ? (progRaw as ProgLabel) : null;
  const slot = day && prog ? { day, prog } : undefined;

  const { data: library = [], isLoading } = useLibrary();
  const { data: clientExercises = [] } = useClientExercises(clientId);
  const add = useAddProgramExercises(clientId);

  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('All');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Catalog edit (standalone only): null = closed, { ex } = editing, { ex: null } = adding.
  const [form, setForm] = useState<{ ex: LibraryExercise | null } | null>(null);

  // Already-present check — scoped to the target slot when picking for one (the same
  // exercise may legitimately appear in another day/slot), else the whole program.
  const inProgram = useMemo(
    () =>
      new Set(
        clientExercises
          .filter((e) => (day && prog ? e.day === day && e.prog === prog : true))
          .map((e) => e.name.toLowerCase()),
      ),
    [clientExercises, day, prog],
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
    add.mutate(
      { items, slot },
      {
        onSuccess: () => {
          toast(`Added ${items.length} exercise${items.length === 1 ? '' : 's'}${slot ? ` to Program ${slot.prog}` : ''}`);
          navigate(-1); // return to wherever the library was opened (the program editor)
        },
        onError: () => toast('Could not add exercises'),
      },
    );
  }

  const goBack = () => navigate(-1);

  return (
    <div className="screen">
      <div className="fadein">
        <div className="bar solid">
          <button className="iconbtn" onClick={goBack} aria-label="Back">
            <ChevronLeft />
          </button>
          <div className="bar-title">{slot ? `Add to Program ${slot.prog}` : pick ? 'Add to program' : 'Exercise library'}</div>
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
                <div
                  className={`lib-row${pick ? (isSel ? ' pick' : '') : ' tap'}`}
                  key={k}
                  onClick={pick ? undefined : () => setForm({ ex: e })}
                >
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
            <button className="bigbtn ghost" onClick={() => setForm({ ex: null })}>
              + Add new exercise
            </button>
          )}
        </div>

        {form && <LibraryForm editing={form.ex} existing={library} onClose={() => setForm(null)} />}
      </div>
    </div>
  );
}
