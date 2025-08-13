import React, { useState } from "react";
import EmojiPicker from "./EmojiPicker";
import { usePassword } from "./PasswordContext";
import { invoke } from '@tauri-apps/api/core';
import CustomDialog from "./CustomDialog";
import ConfirmVaultDeleteDialog from "./ConfirmVaultDeleteDialog";

interface VaultOptionsDialogProps {
    icon: string,
    name: string;
    description: string;
    id: string;
    refreshVaults: () => void;
    handleCloseDialog: () => void;
  }

  function updateVault(password: string, id: string, name: string, description: string, icon: string) {
    return invoke("update_vault", { password, id, name, description, icon });
  }

  function deleteVault(password: string, id: string) {
    return invoke("delete_vault", {password, folderId: id});
  }

  const VaultOptionsDialog: React.FC<VaultOptionsDialogProps> = ({ name, description, icon, id, refreshVaults, handleCloseDialog }) => {
    const [emoji, setEmoji] = useState(icon);
    const [newName, setNewName] = useState(name);
    const [newDescription, setNewDescription] = useState(description);
    const { password } = usePassword();
    const [isConfirmVaultDeleteDialogOpen, setIsConfirmVaultDeleteDialogOpen] = useState(false);
  
    const handleSave = async () => {
      try {
        await updateVault(password, id, newName, newDescription, emoji);
        refreshVaults();
        handleCloseDialog();
      } catch (error) {
        console.error("Error updating vault: ", error);
      }
    };

    const handleDelete = async () => {
        try {
            await deleteVault(password, id);
            refreshVaults();
            handleCloseDialog();
        } catch (error) {
            console.error("Error deleting vault: ", error);
        }
    }

    return (
      <div id="openvault-container">
        <div className="emojipicker-dialog">
          <EmojiPicker onEmojiChange={setEmoji} initialEmoji={emoji} />
        </div>
        <p className="dialog-input-label">Name</p>
        <input
          className="dialog-input-text"
          type="text"
          placeholder="Vault name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <p className="dialog-input-label">Description</p>
        <input
          className="dialog-input-text"
          type="text"
          placeholder="Description..."
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <div className="dialog-button-group-horizontal">
          <button className="dialog-button" onClick={handleSave}>
            Save changes
          </button>
          <button className="dialog-button-red" onClick={() => setIsConfirmVaultDeleteDialogOpen(true)}>Delete vault</button>
        </div>

      <CustomDialog isOpen={isConfirmVaultDeleteDialogOpen} onClose={() => setIsConfirmVaultDeleteDialogOpen(false)}>
        <ConfirmVaultDeleteDialog onConfirm={handleDelete}/>
      </CustomDialog>

      </div>
    );
  };
  

export default VaultOptionsDialog;