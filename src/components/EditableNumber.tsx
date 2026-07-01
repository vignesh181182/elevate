import { useState, type ReactNode } from 'react';

const round1 = (n: number) => Math.round(n * 10) / 10;
const fmtN = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

// A stepper value that turns into an input when tapped, so a coach can type an exact
// number instead of stepping. Commits on Enter/blur (Escape cancels); rejects non-numbers.
export default function EditableNumber({
  value,
  onCommit,
  className,
  inputClassName,
  suffix,
  min = 0,
}: {
  value: number;
  onCommit: (n: number) => void;
  className?: string;
  inputClassName?: string;
  suffix?: ReactNode;
  min?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [buf, setBuf] = useState('');

  const commit = () => {
    const n = parseFloat(buf);
    if (!Number.isNaN(n)) onCommit(Math.max(min, round1(n)));
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        className={inputClassName}
        value={buf}
        autoFocus
        inputMode="decimal"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setBuf(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          else if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }
  return (
    <span
      className={className}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        setBuf(fmtN(value));
        setEditing(true);
      }}
    >
      {fmtN(value)}
      {suffix}
    </span>
  );
}
