import React from "react"
import MoreIcon from "../../public/more.svg?react"
import { invoke } from '@tauri-apps/api/core';

interface Props {
  icon: string,
  name: string,
  description: string,
  folder_id: string,
  onClick: () => void,
  vaultOptions: () => void,
}

const VaultItem: React.FC<Props> = ({ icon, name, description, folder_id, onClick, vaultOptions }) => {
  
  const [notesNumber, setNotesNumber] = React.useState<number | null>(null);

  React.useEffect(() => {
    invoke<number>("get_vault_notes_number", { foldername: folder_id })
      .then(setNotesNumber)
      .catch(() => setNotesNumber(0));
  }, [folder_id]);

  return (
    <div className="vault-item" onClick={onClick}>
      <MoreIcon className="vault-item-moreicon icon" onClick={(e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
        e.stopPropagation();
        vaultOptions();
      }} />
      <p className="vault-item-name">
        <span>{icon}</span> {name}
      </p>
      <p className="vault-item-notesnumber">{notesNumber} {notesNumber === 1 ? "note" : "notes"}</p>
      <p className="vault-item-description">{description}</p>
    </div>
  );
};
export default VaultItem;