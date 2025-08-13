import React from "react";
import VaultIcon from "../../public/vault-open.svg?react";
import NoteAddIcon from "../../public/note-add.svg?react";
import SettingsIcon from "../../public/settings.svg?react";

interface Props {
  onVaultClose: () => void | Promise<void>;
  onOpenOptions: () => void;
  onNewNote: () => void | Promise<void>;
}

const OptionsBar: React.FC<Props> = ({ onVaultClose, onOpenOptions, onNewNote }) => {
  return (
    <div id="optionsBar">
      <div className="top-icons">
        <VaultIcon className="icon" onClick={onVaultClose} />
        <NoteAddIcon className="icon" onClick={onNewNote} />
      </div>
      <SettingsIcon className="icon settings-icon" onClick={onOpenOptions} />
    </div>
  );
};

export default OptionsBar;