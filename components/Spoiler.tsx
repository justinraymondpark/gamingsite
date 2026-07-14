'use client';

import { type ReactNode, useState } from 'react';

type SpoilerProps = {
  children: ReactNode;
};

export default function Spoiler({ children }: SpoilerProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <button
      type="button"
      aria-label={revealed ? undefined : 'Reveal spoiler'}
      aria-pressed={revealed}
      title={revealed ? 'Hide spoiler' : 'Reveal spoiler'}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setRevealed((current) => !current);
      }}
      className={`inline rounded-sm px-1 py-0.5 align-baseline [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
        revealed
          ? 'bg-[var(--surface-light)] text-[var(--foreground)] select-text'
          : 'bg-[var(--foreground-muted)] text-transparent hover:bg-[var(--foreground)] select-none'
      }`}
    >
      {children}
    </button>
  );
}
