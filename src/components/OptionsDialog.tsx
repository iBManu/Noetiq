import React, { useEffect } from 'react';
import { useSettings } from './SettingsContext';

const OptionsDialog: React.FC = () => {
  const { fontSize, setFontSize, theme, setTheme } = useSettings();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div id="optionsdialog-container">
      <p className="dialog-input-label">Theme</p>
      <div className="swap-button-container">
        <button
          onClick={() => setTheme('light')}
          className={`swap-button swap-button-left ${theme === 'light' ? 'swap-button-selected' : ''}`}
        >
          Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`swap-button swap-button-right ${theme === 'dark' ? 'swap-button-selected' : ''}`}
        >
          Dark
        </button>
      </div>

      <p className="dialog-input-label">Editor font size</p>
      <div className="swap-button-container">
        <button
          onClick={() => setFontSize('small')}
          className={`swap-button swap-button-left ${fontSize === 'small' ? 'swap-button-selected' : ''}`}
        >
          Small
        </button>
        <button
          onClick={() => setFontSize('medium')}
          className={`swap-button swap-button-middle ${fontSize === 'medium' ? 'swap-button-selected' : ''}`}
        >
          Medium
        </button>
        <button
          onClick={() => setFontSize('large')}
          className={`swap-button swap-button-right ${fontSize === 'large' ? 'swap-button-selected' : ''}`}
        >
          Large
        </button>
      </div>
      
      <p className="dialog-input-label">About</p>
      <p className="dialog-about-text"><strong>Version: </strong>Beta 0.1</p>
      <p className="dialog-about-text"><strong>Developer: </strong>iBManu</p>
      <p className="dialog-about-text"><strong>License: </strong>GNU GPL (v3)</p>
    </div>
  );
};

export default OptionsDialog;