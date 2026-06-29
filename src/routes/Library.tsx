import { type CSSProperties, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Dumbbell } from 'lucide-react';
import { useLibrary } from '../hooks/useData';
import { useToast } from '../components/Toast';
import { LIB_GROUPS, muscleColor } from '../lib/muscleColors';

export default function Library() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: library = [], isLoading } = useLibrary();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('All');

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

  return (
    <div className="screen">
      <div className="fadein">
        <div className="bar solid">
          <button className="iconbtn" onClick={() => navigate(-1)} aria-label="Back">
            <ChevronLeft />
          </button>
          <div className="bar-title">Exercise library</div>
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
              return (
                <div className="lib-row" key={e.id ?? e.name}>
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
                  <span className="lib-target">{e.target}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="bottom-cta sticky-cta">
          <button className="bigbtn ghost" onClick={() => toast('Add new exercise — coming soon')}>
            + Add new exercise
          </button>
        </div>
      </div>
    </div>
  );
}
