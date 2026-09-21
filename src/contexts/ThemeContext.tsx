import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'deep-space' | 'aurora' | 'emerald' | 'crimson';

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isAurora: boolean;
  isDeepSpace: boolean;
  isEmerald: boolean;
  isCrimson: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'trackademics-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'aurora' || saved === 'deep-space' || saved === 'emerald' || saved === 'crimson') {
      return saved as Theme;
    }
    const legacy = localStorage.getItem('theme');
    if (legacy === 'aurora') return 'aurora';
    if (legacy === 'emerald') return 'emerald';
    if (legacy === 'crimson') return 'crimson';
    return 'deep-space';
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Apply or clean theme classes
    root.classList.remove('theme-aurora', 'theme-deep-space', 'theme-emerald', 'theme-crimson');
    body.classList.remove('theme-aurora', 'theme-deep-space', 'theme-emerald', 'theme-crimson');

    if (currentTheme === 'aurora') {
      root.classList.add('theme-aurora');
      body.classList.add('theme-aurora');
    } else if (currentTheme === 'emerald') {
      root.classList.add('theme-emerald');
      body.classList.add('theme-emerald');
    } else if (currentTheme === 'crimson') {
      root.classList.add('theme-crimson');
      body.classList.add('theme-crimson');
    } else {
      root.classList.add('theme-deep-space');
      body.classList.add('theme-deep-space');
    }

    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  const setTheme = (theme: Theme) => {
    setCurrentThemeState(theme);
  };

  const toggleTheme = () => {
    setCurrentThemeState(prev => {
      if (prev === 'deep-space') return 'aurora';
      if (prev === 'aurora') return 'emerald';
      if (prev === 'emerald') return 'crimson';
      return 'deep-space';
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        toggleTheme,
        isAurora: currentTheme === 'aurora',
        isDeepSpace: currentTheme === 'deep-space',
        isEmerald: currentTheme === 'emerald',
        isCrimson: currentTheme === 'crimson',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
