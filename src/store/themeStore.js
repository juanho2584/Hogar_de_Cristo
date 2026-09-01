/**
 * @fileoverview Theme Store — Manejo de temas (Oscuro, Alto Contraste, Claro).
 */

import { create } from 'zustand';

const THEME_KEY = 'hdd_theme';

/**
 * @typedef {'dark'|'high-contrast'|'light'} ThemeMode
 */

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'high-contrast' || saved === 'light') {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'dark';
};

const applyThemeToDOM = (theme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }
};

export const useThemeStore = create((set) => {
  const initialTheme = getInitialTheme();
  applyThemeToDOM(initialTheme);

  return {
    theme: initialTheme,

    /**
     * Establece el tema directamente
     * @param {ThemeMode} newTheme
     */
    setTheme: (newTheme) => {
      try {
        localStorage.setItem(THEME_KEY, newTheme);
      } catch (e) {
        console.error('Error saving theme', e);
      }
      applyThemeToDOM(newTheme);
      set({ theme: newTheme });
    },

    /**
     * Alterna rápidamente entre Oscuro y Alto Contraste
     */
    toggleHighContrast: () => {
      set((state) => {
        const nextTheme = state.theme === 'high-contrast' ? 'dark' : 'high-contrast';
        try {
          localStorage.setItem(THEME_KEY, nextTheme);
        } catch (e) {
          console.error('Error saving theme', e);
        }
        applyThemeToDOM(nextTheme);
        return { theme: nextTheme };
      });
    },
  };
});

export default useThemeStore;
