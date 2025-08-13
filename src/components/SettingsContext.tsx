import React, { createContext, useState, useContext, useEffect } from 'react';

type FontSize = 'small' | 'medium' | 'large';
type Theme = 'light' | 'dark';

interface SettingsContextType {
  fontSize: FontSize;
  setFontSize: React.Dispatch<React.SetStateAction<FontSize>>;
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const storedFontSize = localStorage.getItem('fontSize') as FontSize | null;
    const storedTheme = localStorage.getItem('theme') as Theme | null;

    if (storedFontSize) setFontSize(storedFontSize);
    if (storedTheme) setTheme(storedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('theme', theme);

    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
  }, [theme]);

  return (
    <SettingsContext.Provider value={{ fontSize, setFontSize, theme, setTheme }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
