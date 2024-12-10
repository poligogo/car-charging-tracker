import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'system') {
          // 移除手動設置的主題類
          document.documentElement.classList.remove('theme-light', 'theme-dark');
        } else {
          // 設置手動主題
          document.documentElement.classList.remove('theme-light', 'theme-dark');
          document.documentElement.classList.add(`theme-${theme}`);
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
