'use client';

import { useEffect, useState } from 'react';

export type ThemeName = 'aurora' | 'arcade' | 'editorial';

export type ThemePrefs = {
  theme: ThemeName;
  backdrop: boolean;
  scanlines: boolean;
  glow: boolean;
  blur: boolean;
  serif: boolean;
  frames: boolean;
  motion: boolean;
};

const STORAGE_KEY = 'medialog-theme';

const DEFAULTS: ThemePrefs = {
  theme: 'aurora',
  backdrop: true,
  scanlines: true,
  glow: true,
  blur: true,
  serif: true,
  frames: true,
  motion: true,
};

const THEMES: { key: ThemeName; name: string; desc: string }[] = [
  { key: 'aurora', name: 'Aurora Glass', desc: 'Frosted panels over drifting nebula light' },
  { key: 'arcade', name: 'Neon Arcade', desc: 'CRT scanlines, pixel type, lime glow' },
  { key: 'editorial', name: 'Editorial', desc: 'Quiet serif magazine minimalism' },
];

type ToggleKey = Exclude<keyof ThemePrefs, 'theme'>;

const TOGGLES: { key: ToggleKey; label: string; themes: ThemeName[] | 'all' }[] = [
  { key: 'backdrop', label: 'Aurora backdrop', themes: ['aurora'] },
  { key: 'blur', label: 'Glass blur', themes: ['aurora'] },
  { key: 'backdrop', label: 'Grid backdrop', themes: ['arcade'] },
  { key: 'scanlines', label: 'CRT scanlines', themes: ['arcade'] },
  { key: 'glow', label: 'Glow effects', themes: ['aurora', 'arcade'] },
  { key: 'serif', label: 'Serif display type', themes: ['editorial'] },
  { key: 'frames', label: 'Card frames', themes: ['editorial'] },
  { key: 'motion', label: 'Animations', themes: 'all' },
];

function loadPrefs(): ThemePrefs {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const theme = THEMES.some(t => t.key === stored.theme) ? stored.theme : DEFAULTS.theme;
    return { ...DEFAULTS, ...stored, theme };
  } catch {
    return DEFAULTS;
  }
}

function applyPrefs(prefs: ThemePrefs) {
  const d = document.documentElement.dataset;
  d.theme = prefs.theme;
  d.fxBackdrop = prefs.backdrop ? 'on' : 'off';
  d.fxScanlines = prefs.scanlines ? 'on' : 'off';
  d.fxGlow = prefs.glow ? 'on' : 'off';
  d.fxBlur = prefs.blur ? 'on' : 'off';
  d.fxSerif = prefs.serif ? 'on' : 'off';
  d.fxFrames = prefs.frames ? 'on' : 'off';
  d.fxMotion = prefs.motion ? 'on' : 'off';
}

export default function ThemeLab() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<ThemePrefs>(DEFAULTS);

  useEffect(() => {
    const initial = loadPrefs();
    setPrefs(initial);
    applyPrefs(initial);

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setOpen(o => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const update = (patch: Partial<ThemePrefs>) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch };
      applyPrefs(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable — theme still applies for this session
      }
      return next;
    });
  };

  if (!open) return null;

  const visibleToggles = TOGGLES.filter(
    t => t.themes === 'all' || t.themes.includes(prefs.theme)
  );

  return (
    <div className="theme-lab">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">Theme Lab</h2>
          <p className="text-[0.65rem] text-[var(--foreground-muted)]">Ctrl+D to toggle · Esc to close</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-lg leading-none px-1"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="p-3 space-y-1.5">
        {THEMES.map(theme => (
          <button
            key={theme.key}
            onClick={() => update({ theme: theme.key })}
            className={`w-full text-left px-3 py-2.5 rounded-[var(--radius-sm)] border transition-colors ${
              prefs.theme === theme.key
                ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]'
                : 'border-[var(--border)] hover:border-[var(--accent-dim)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  prefs.theme === theme.key ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                }`}
              />
              <span className="text-sm font-semibold text-[var(--foreground)]">{theme.name}</span>
            </div>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5 ml-4">{theme.desc}</p>
          </button>
        ))}
      </div>

      <div className="px-4 pb-4 space-y-2">
        <p className="section-label">Effects</p>
        {visibleToggles.map(toggle => (
          <label
            key={`${toggle.key}-${toggle.label}`}
            className="flex items-center justify-between cursor-pointer group"
          >
            <span className="text-sm text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              {toggle.label}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[toggle.key]}
              onClick={() => update({ [toggle.key]: !prefs[toggle.key] })}
              className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                prefs[toggle.key] ? 'bg-[var(--accent)]' : 'bg-[var(--surface-light)]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--background)] transition-transform ${
                  prefs[toggle.key] ? 'translate-x-[1.1rem]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
        ))}

        <button
          onClick={() => update({ ...DEFAULTS })}
          className="btn-ghost w-full text-xs px-3 py-1.5 mt-2"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
