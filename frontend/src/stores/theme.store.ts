import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const apply = (t: Theme) => {
  const root = document.documentElement;
  if (t === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (t) => {
        apply(t);
        set({ theme: t });
      },
      toggle: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        apply(next);
        set({ theme: next });
      },
    }),
    {
      name: 'hrco-theme',
      onRehydrateStorage: () => (state) => {
        if (state) apply(state.theme);
      },
    },
  ),
);

// Aplicación temprana antes del primer render (evita flash)
export function bootstrapTheme() {
  try {
    const raw = localStorage.getItem('hrco-theme');
    const parsed = raw ? JSON.parse(raw) : null;
    const t: Theme = parsed?.state?.theme === 'dark' ? 'dark' : 'light';
    apply(t);
  } catch {
    apply('light');
  }
}
