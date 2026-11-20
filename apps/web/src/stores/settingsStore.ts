import { create } from "zustand";

export type AppTheme = "light" | "dark" | "system";

export interface SettingsState {
  theme: AppTheme;
  fontFamily: string;
  fontSize: number;
  wordWrap: boolean;
  spellCheck: boolean;
  autoCorrect: boolean;
  setTheme: (theme: AppTheme) => void;
  setFontFamily: (fontFamily: string) => void;
  setFontSize: (fontSize: number) => void;
  setWordWrap: (wordWrap: boolean) => void;
  setSpellCheck: (spellCheck: boolean) => void;
  setAutoCorrect: (autoCorrect: boolean) => void;
}

const STORAGE_KEY = "notepad_settings_v1";

function getSystemTheme(): "light" | "dark" {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export function applyThemeToDom(theme: AppTheme) {
  if (typeof document === "undefined") return;
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.setAttribute("data-theme", resolved);
}

function loadInitialSettings(): {
  theme: AppTheme;
  fontFamily: string;
  fontSize: number;
  wordWrap: boolean;
  spellCheck: boolean;
  autoCorrect: boolean;
} {
  const defaults = {
    theme: "system" as AppTheme,
    fontFamily: "Consolas",
    fontSize: 14,
    wordWrap: false,
    spellCheck: false,
    autoCorrect: false,
  };

  if (typeof window === "undefined" || !window.localStorage) {
    return defaults;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

const initial = loadInitialSettings();
applyThemeToDom(initial.theme);

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...initial,

  setTheme: (theme: AppTheme) => {
    applyThemeToDom(theme);
    set({ theme });
    try {
      const state = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          theme,
          fontFamily: state.fontFamily,
          fontSize: state.fontSize,
          wordWrap: state.wordWrap,
          spellCheck: state.spellCheck,
          autoCorrect: state.autoCorrect,
        })
      );
    } catch {
      // LocalStorage access may fail in private mode
    }
  },

  setFontFamily: (fontFamily: string) => {
    set({ fontFamily });
    try {
      const state = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, fontFamily }));
    } catch {}
  },

  setFontSize: (fontSize: number) => {
    set({ fontSize });
    try {
      const state = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, fontSize }));
    } catch {}
  },

  setWordWrap: (wordWrap: boolean) => {
    set({ wordWrap });
    try {
      const state = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, wordWrap }));
    } catch {}
  },

  setSpellCheck: (spellCheck: boolean) => {
    set({ spellCheck });
    try {
      const state = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, spellCheck }));
    } catch {}
  },

  setAutoCorrect: (autoCorrect: boolean) => {
    set({ autoCorrect });
    try {
      const state = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, autoCorrect }));
    } catch {}
  },
}));
