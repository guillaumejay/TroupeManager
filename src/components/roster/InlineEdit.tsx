import { useState, useRef, useEffect } from 'react';

interface InlineEditProps {
  value: string;
  onCommit: (value: string) => void;
  disabled?: boolean;
  type?: 'text' | 'number';
  options?: string[];
  className?: string;
}

export function InlineEdit({ value, onCommit, disabled, type = 'text', options, className = '' }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [editing]);

  if (disabled) {
    return <span className={`${className} text-gray-500`}>{value || '—'}</span>;
  }

  if (!editing) {
    return (
      <span
        className={`${className} cursor-pointer hover:bg-gray-700/50 rounded px-1 -mx-1 transition-colors`}
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        {value || '—'}
      </span>
    );
  }

  const commit = () => {
    const trimmed = draft.trim();
    if (type === 'number') {
      const num = Number(trimmed);
      if (trimmed === '' || isNaN(num) || num < 0) {
        setDraft(value);
        setEditing(false);
        return;
      }
    }
    if (trimmed !== value) {
      onCommit(trimmed);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  };

  if (options) {
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          onCommit(e.target.value);
          setEditing(false);
        }}
        onBlur={() => setEditing(false)}
        onKeyDown={handleKeyDown}
        className="bg-gray-700 text-gray-100 text-sm rounded px-1 py-0.5 border border-gray-600 focus:outline-none focus:border-amber-500"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={type === 'number' ? 'number' : 'text'}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      min={type === 'number' ? 0 : undefined}
      className="bg-gray-700 text-gray-100 text-sm rounded px-1 py-0.5 w-full border border-gray-600 focus:outline-none focus:border-amber-500"
    />
  );
}
