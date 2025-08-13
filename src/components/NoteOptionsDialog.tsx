import React from "react";
import { usePassword } from "./PasswordContext";
import { invoke } from '@tauri-apps/api/core';

interface NoteOptionsDialogProps {
  id: string;
  vaultFolder: string;
  refreshNotes: () => void;
  handleCloseDialog: () => void;
  setSelectedNote: React.Dispatch<React.SetStateAction<string>>
}

function deleteNote(password: string, id: string, vaultFolder: string) {
  return invoke("delete_note", { password, noteId: id, vaultFolder: vaultFolder });
}

const NoteOptionsDialog: React.FC<NoteOptionsDialogProps> = ({ id, vaultFolder, refreshNotes, handleCloseDialog, setSelectedNote }) => {
  const { password } = usePassword();

  const handleDelete = async () => {
    try {
      await deleteNote(password, id, vaultFolder);
      refreshNotes();
      handleCloseDialog();
      setSelectedNote("");
    } catch (error) {
      console.error("Error deleting note: ", error);
    }
  }



  return (
    <div id="openvault-container">
      <p className="dialog-input-label">Delete note</p>
      <button className="dialog-button-red" onClick={handleDelete}>Delete note</button>
    </div>
  );
};


export default NoteOptionsDialog;