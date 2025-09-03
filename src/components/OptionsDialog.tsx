import React, { useEffect, useState } from 'react';
import { useSettings } from './SettingsContext';
import CustomDialog from './CustomDialog';
import ChangePasswordDialog from './ChangePasswordDialog';
/*import { join, configDir } from '@tauri-apps/api/path';
import { openPath } from '@tauri-apps/plugin-opener';*/

const OptionsDialog: React.FC = () => {
  const { fontSize, setFontSize, theme, setTheme } = useSettings();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  /*const openVaultsFolder = async () => {
    try {
      const baseDir = await configDir();
      const vaultsFolder = await join(baseDir, 'noetiq-vaults');

      await openPath(vaultsFolder);
    } catch (error) {
      console.error('Error opening vaults folder:', error);
    }
  };*/


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

      {/*<p className="dialog-input-label">Theme flavour</p>
      <div id="flavour-list">
        <div className="flavour" id="flavour-blue">
          <div className="flavour-bg" id="flavour-bg-blue"></div>
        </div>
        <div className="flavour" id="flavour-yellow">
          <div className="flavour-bg" id="flavour-bg-yellow"></div>
        </div>
        <div className="flavour" id="flavour-purple">
          <div className="flavour-bg" id="flavour-bg-purple"></div>
        </div>
        <div className="flavour" id="flavour-red">
          <div className="flavour-bg" id="flavour-bg-red"></div>
        </div>
        <div className="flavour" id="flavour-green">
          <div className="flavour-bg" id="flavour-bg-green"></div>
        </div>
        <div className="flavour" id="flavour-pink">
          <div className="flavour-bg" id="flavour-bg-pink"></div>
        </div>
        <div className="flavour" id="flavour-orange">
          <div className="flavour-bg" id="flavour-bg-orange"></div>
        </div>
        <div className="flavour" id="flavour-gray">
          <div className="flavour-bg" id="flavour-bg-gray"></div>
        </div>
      </div>*/}

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

      {/*<p className="dialog-input-label">Data</p>

      <button className="dialog-button-neutral" onClick={() => openVaultsFolder()}>
        Open vaults folder
      </button>*/}

      <p className="dialog-input-label">Security</p>

      <button className="dialog-button-neutral" onClick={() => setIsChangePasswordModalOpen(true)}>
        Change password
      </button>

      <p className="dialog-input-label">About</p>
      <p className="dialog-about-text"><strong>Version: </strong>Beta 0.2.0</p>
      <p className="dialog-about-text"><strong>Developer: </strong>iBManu</p>
      <p className="dialog-about-text"><strong>License: </strong>GNU GPL (v3)</p>

      <CustomDialog isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} >
        <ChangePasswordDialog onCloseDialog={() => setIsChangePasswordModalOpen(false)} />
      </CustomDialog>

    </div>
  );
};

export default OptionsDialog;
