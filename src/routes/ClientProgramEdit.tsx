import { useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  useClient,
  useClientExercises,
  useRemoveProgram,
  useRemoveProgramExercise,
  useReorderProgramExercises,
  useSaveWeekLoads,
  useSetProgramSets,
} from '../hooks/useData';
import { useToast } from '../components/Toast';
import EditableNumber from '../components/EditableNumber';
import { MAX_SETS, MIN_SETS, ROUNDS } from '../domain/session';
import { nextWeight, prevWeight } from '../domain/weights';
import { currentProgramWeek, isRepBased, weekLoad } from '../domain/client';
import { dayProgLabels, exForDayProg, hasDayProgPlan, nextProgLabel, PROG_LABELS, type ProgLabel } from '../domain/program';
import type { Client, ProgramExercise } from '../domain/types';

const round1 = (n: number) => Math.round(n * 10) / 10;

// Dedicated, header-less program EDIT page (reached from the read-only Program view).
// Scoped to one training day + week — no day/week pickers. Weight/reps are drafts
// committed on Save (Cancel/✕ discards them); structural edits (add/remove/reorder/
// sets) persist immediately because adding routes out to the library and back.
export default function ClientProgramEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { data: client, isLoading } = useClient(id);
  const { data: exercises = [] } = useClientExercises(id);

  if (isLoading || !client) {
    return (
      <div className="screen">
        <div className="cl-loading">Loading…</div>
      </div>
    );
  }
  const list = exercises.filter((e) => !e.future && e.name !== 'Tap to add exercise');
  const day = sp.get('day') ?? '';
  const week = Number(sp.get('week')) || currentProgramWeek(client);
  return <EditView key={client.id} client={client} list={list} day={day} week={week} navigate={navigate} />;
}

function EditView({
  client,
  list,
  day,
  week,
  navigate,
}: {
  client: Client;
  list: ProgramExercise[];
  day: string;
  week: number;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const toast = useToast();
  const save = useSaveWeekLoads(client.id);
  const remove = useRemoveProgramExercise(client.id);
  const setSets = useSetProgramSets(client.id);
  const reorder = useReorderProgramExercises(client.id);
  const removeProgram = useRemoveProgram(client.id);
  // Use the program-first builder whenever we have a day context: either the client already
  // has a per-day plan, or it's a fresh client (empty list) building one from scratch — the
  // latter is the "Add program" entry from an empty session. Only genuinely legacy flat plans
  // (exercises with no day/prog tags) fall back to the plain list editor below.
  const building = !!day && list.length === 0;
  const perDay = !!day && (hasDayProgPlan(list) || list.length === 0);

  // Programs shown for this day: those with exercises, plus any empty ones the coach
  // just added (transient — they persist once an exercise is tagged into them).
  const [added, setAdded] = useState<ProgLabel[]>([]);
  const present = perDay ? dayProgLabels(list, day) : [];
  const labels = PROG_LABELS.filter((p) => present.includes(p) || added.includes(p));
  const editLabels: ProgLabel[] = labels.length ? labels : ['A'];

  function removeProgramSlot(prog: ProgLabel) {
    setAdded((a) => a.filter((l) => l !== prog));
    const exIds = exForDayProg(list, day, prog).map((e) => e.id).filter((x): x is string => !!x);
    if (exIds.length) {
      removeProgram.mutate(exIds, {
        onSuccess: () => toast(`Program ${prog} removed`),
        onError: () => toast('Could not remove program'),
      });
    }
  }

  // Unsaved weight/reps for THIS week, keyed by exId. Defaults from the stored load.
  const [drafts, setDrafts] = useState<Record<string, { w: number; r: number }>>({});
  const valueFor = (ex: ProgramExercise) => drafts[ex.id as string] ?? weekLoad(ex, week);

  function adjust(ex: ProgramExercise, k: 'w' | 'r', delta: number) {
    if (!ex.id) return;
    const cur = valueFor(ex);
    const next = { ...cur, [k]: Math.max(0, round1(cur[k] + delta)) };
    setDrafts((prev) => ({ ...prev, [ex.id as string]: next }));
  }

  // Set an exact weight (snap step or manual entry), leaving reps untouched.
  function setWeight(ex: ProgramExercise, w: number) {
    if (!ex.id) return;
    setDrafts((prev) => ({ ...prev, [ex.id as string]: { ...valueFor(ex), w } }));
  }

  function onRemove(ex: ProgramExercise) {
    if (!ex.id) return;
    remove.mutate(ex.id, {
      onSuccess: () => toast(`${ex.name} removed`),
      onError: () => toast('Could not remove exercise'),
    });
  }

  // Splice a reordered slot back into the full exercise order (other days untouched).
  function reorderSlot(orderedIds: string[]) {
    const idSet = new Set(orderedIds);
    let k = 0;
    const fullIds = list
      .map((e) => (idSet.has(e.id as string) ? orderedIds[k++] : (e.id as string)))
      .filter((x): x is string => !!x);
    reorder.mutate(fullIds, { onError: () => toast('Could not save order') });
  }

  // Return to wherever editing was opened from (read-only Program or Today's Session),
  // matching the app's path-aware back convention.
  const close = () => navigate(-1);

  function onSave() {
    const loads = Object.entries(drafts).map(([exId, v]) => ({ exId, w: v.w, r: v.r }));
    if (!loads.length) return close();
    save.mutate(
      { week, loads },
      {
        onSuccess: () => {
          toast(`Week ${week} loads saved`);
          close();
        },
        onError: () => toast('Could not save loads'),
      },
    );
  }

  const card = (ex: ProgramExercise, drag?: CardDrag) => (
    <ExerciseCard
      key={ex.id ?? ex.name}
      ex={ex}
      v={valueFor(ex)}
      onAdjust={adjust}
      onSetWeight={setWeight}
      onRemove={onRemove}
      drag={drag}
      builder={perDay}
    />
  );

  return (
    <div className="screen">
      <div className="bar solid">
        <div className="bar-titles">
          <div className="bar-title">
            {building ? 'Create program' : perDay ? `Modify ${day} program` : 'Modify program'}
          </div>
          <div className="bar-sub">
            {client.name}
            {day ? ` · ${day}` : ''} · Week {week}
          </div>
        </div>
        <button className="iconbtn" onClick={close} aria-label="Close without saving">
          <X />
        </button>
      </div>

      {perDay ? (
        <>
          {editLabels.map((prog) => (
            <Slot
              key={prog}
              prog={prog}
              exercises={exForDayProg(list, day, prog)}
              renderCard={card}
              sets={client.program?.sets?.[prog] ?? ROUNDS}
              onSets={(delta) => {
                const cur = client.program?.sets?.[prog] ?? ROUNDS;
                const n = Math.max(MIN_SETS, Math.min(MAX_SETS, cur + delta));
                if (n !== cur) setSets.mutate({ label: prog, n });
              }}
              onReorder={reorderSlot}
              onAdd={() => navigate(`/clients/${client.id}/library?day=${day}&prog=${prog}`)}
              onRemoveProgram={editLabels.length > 1 ? () => removeProgramSlot(prog) : undefined}
            />
          ))}
          {nextProgLabel(editLabels) && (
            <button className="pb-addprog" onClick={() => setAdded((a) => [...a, nextProgLabel(editLabels)!])}>
              ＋ Add another program
            </button>
          )}
        </>
      ) : list.length === 0 ? (
        <div className="empty">
          <div className="em">🏋️</div>
          <p>No exercises yet. Add some from the library first.</p>
          <button className="ex-add-btn" onClick={() => navigate(`/clients/${client.id}/library`)}>
            ＋ Add from exercise library
          </button>
        </div>
      ) : (
        <>
          {list.map((ex) => card(ex))}
          <button className="ex-add-btn" onClick={() => navigate(`/clients/${client.id}/library`)}>
            ＋ Add from exercise library
          </button>
        </>
      )}

      <div className="pb-actions">
        <button
          className={`pb-create${save.isPending ? ' dim' : ''}`}
          disabled={save.isPending}
          onClick={onSave}
        >
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
        <button className="pb-cancel" onClick={close}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function Slot({
  prog,
  exercises,
  renderCard,
  sets,
  onSets,
  onAdd,
  onReorder,
  onRemoveProgram,
}: {
  prog: ProgLabel;
  exercises: ProgramExercise[];
  renderCard: (ex: ProgramExercise, drag?: CardDrag) => React.ReactNode;
  sets: number;
  onSets: (delta: number) => void;
  onAdd: () => void;
  onReorder: (orderedIds: string[]) => void;
  onRemoveProgram?: () => void;
}) {
  // Inline drag-to-reorder within this program (ported from the prototype's wireExDrag):
  // the grip starts a pointer drag, the card follows the finger and neighbours shift past
  // midpoints (transforms set imperatively — transient gesture state, not rendered markup).
  const rowEls = useRef<(HTMLDivElement | null)[]>([]);
  const drag = useRef({ active: false, from: -1, cur: -1, startY: 0, slotH: 0 });
  const canDrag = exercises.length >= 2;

  function begin(idx: number, e: React.PointerEvent) {
    e.preventDefault();
    const rows = rowEls.current;
    if (rows.length < 2) return;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* setPointerCapture can throw on detached elements — safe to ignore */
    }
    const slotH = rows[1]!.getBoundingClientRect().top - rows[0]!.getBoundingClientRect().top;
    drag.current = { active: true, from: idx, cur: idx, startY: e.clientY, slotH };
    rows[idx]?.classList.add('ex-dragging');
    document.body.classList.add('ex-drag-on');
  }

  function move(e: React.PointerEvent) {
    const d = drag.current;
    if (!d.active) return;
    const rows = rowEls.current;
    const el = rows[d.from];
    if (!el) return;
    const dy = Math.max(-d.from * d.slotH, Math.min((rows.length - 1 - d.from) * d.slotH, e.clientY - d.startY));
    el.style.transform = `translateY(${dy}px)`;
    const ni = Math.max(0, Math.min(rows.length - 1, d.from + Math.round(dy / d.slotH)));
    if (ni !== d.cur) {
      d.cur = ni;
      rows.forEach((r, k) => {
        if (!r || k === d.from) return;
        let s = 0;
        if (d.from < ni && k > d.from && k <= ni) s = -d.slotH;
        else if (d.from > ni && k >= ni && k < d.from) s = d.slotH;
        r.style.transform = s ? `translateY(${s}px)` : '';
      });
    }
  }

  function end(e: React.PointerEvent) {
    const d = drag.current;
    if (!d.active) return;
    drag.current = { active: false, from: -1, cur: -1, startY: 0, slotH: 0 };
    rowEls.current.forEach((r) => {
      if (r) {
        r.style.transform = '';
        r.classList.remove('ex-dragging');
      }
    });
    document.body.classList.remove('ex-drag-on');
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (d.cur !== d.from && d.cur >= 0) {
      const ids = exercises.map((x) => x.id).filter((x): x is string => !!x);
      const [moved] = ids.splice(d.from, 1);
      ids.splice(d.cur, 0, moved);
      onReorder(ids);
    }
  }

  const dragFor = (i: number): CardDrag | undefined =>
    canDrag
      ? {
          cardRef: (el) => void (rowEls.current[i] = el),
          grip: { onPointerDown: (e) => begin(i, e), onPointerMove: move, onPointerUp: end, onPointerCancel: end },
        }
      : undefined;

  return (
    <div className={`pgrp pgrp-${prog.toLowerCase()}`}>
      <div className="pgrp-bhead">
        <div className="pgrp-bid">
          <div className="pgrp-brow">
            <span className="pgrp-dot" />
            <span className="pgrp-name">Program {prog}</span>
          </div>
          <span className="pgrp-bcount">
            {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="pgrp-sets">
          <span className="pb-sets-lbl">No. of Sets</span>
          <div className="pb-stepper">
            <button className="pb-step" onClick={() => onSets(-1)} aria-label="Fewer sets">
              −
            </button>
            <span className="pb-stepval">{sets}</span>
            <button className="pb-step" onClick={() => onSets(1)} aria-label="More sets">
              +
            </button>
          </div>
        </div>
      </div>
      {exercises.length ? (
        exercises.map((ex, i) => renderCard(ex, dragFor(i)))
      ) : (
        <div className="slot-empty">No exercises in Program {prog} yet — add some below.</div>
      )}
      <button className="slot-add" onClick={onAdd}>
        ＋ Add exercise to Program {prog}
      </button>
      {onRemoveProgram && (
        <button className="pb-remove" onClick={onRemoveProgram}>
          Remove Program {prog}
        </button>
      )}
    </div>
  );
}

// Optional drag affordance threaded in by a draggable Slot: a ref to the card root
// (for measuring/animating) plus the grip's pointer handlers.
export interface CardDrag {
  cardRef: (el: HTMLDivElement | null) => void;
  grip: React.DOMAttributes<HTMLButtonElement>;
}

function ExerciseCard({
  ex,
  v,
  onAdjust,
  onSetWeight,
  onRemove,
  drag,
  builder,
}: {
  ex: ProgramExercise;
  v: { w: number; r: number };
  onAdjust: (ex: ProgramExercise, k: 'w' | 'r', delta: number) => void;
  onSetWeight: (ex: ProgramExercise, w: number) => void;
  onRemove: (ex: ProgramExercise) => void;
  drag?: CardDrag;
  // Per-day A/B builder card — name only (no target line), matching the prototype.
  builder?: boolean;
}) {
  const rep = isRepBased(ex);
  return (
    <div className="ex-card" ref={drag?.cardRef}>
      <div className="ex-top">
        <div className="ex-top-main">
          {drag && (
            <button className="ex-drag" aria-label={`Drag to reorder ${ex.name}`} {...drag.grip}>
              ⠿
            </button>
          )}
          <div>
            <div className="ex-name">{ex.name}</div>
            {!builder && <div className="ex-target">Target {ex.target}</div>}
          </div>
        </div>
        <button className="ex-remove" onClick={() => onRemove(ex)} aria-label="Remove">
          ✕
        </button>
      </div>
      <div className="stepper-row">
        <div className="stepper">
          <div className="lbl">{rep ? 'Level/time' : 'Weight'}</div>
          <div className="ctl">
            <button
              className="stp-btn"
              onClick={() => (rep ? onAdjust(ex, 'w', -2.5) : onSetWeight(ex, prevWeight(v.w)))}
              aria-label="Decrease weight"
            >
              −
            </button>
            <EditableNumber
              value={v.w}
              onCommit={(w) => onSetWeight(ex, w)}
              className="stp-val"
              inputClassName="stp-val stp-input"
              suffix={rep ? null : <small> kg</small>}
            />
            <button
              className="stp-btn"
              onClick={() => (rep ? onAdjust(ex, 'w', 2.5) : onSetWeight(ex, nextWeight(v.w)))}
              aria-label="Increase weight"
            >
              +
            </button>
          </div>
        </div>
        <div className="stepper">
          <div className="lbl">Reps</div>
          <div className="ctl">
            <button className="stp-btn" onClick={() => onAdjust(ex, 'r', -1)} aria-label="Decrease reps">
              −
            </button>
            <div className="stp-val">{v.r}</div>
            <button className="stp-btn" onClick={() => onAdjust(ex, 'r', 1)} aria-label="Increase reps">
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
