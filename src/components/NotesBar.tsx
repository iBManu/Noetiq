import React from "react";
import Note from "./Note";
import MoreIcon from "../../public/more.svg?react";
import { NoteItem } from "./interfaces";

interface Props {
  noteList: NoteItem[];
  vaultName: string;
  setSelectedNote: (filename: string) => void;
  selectedNote: string;
  handleOpenNoteOptionsDialog: () => void;
}

const NotesBar: React.FC<Props> = ({ noteList, vaultName, setSelectedNote, selectedNote, handleOpenNoteOptionsDialog }) => {
  const fileCount = noteList.length;

  async function onNoteClick(note: NoteItem) {
      setSelectedNote(note.filename);
  }

  return (
    <div id="notesBar">
      <h3>{vaultName} <MoreIcon className="icon" /></h3>
      <p>{`${fileCount} ${fileCount === 1 ? "note" : "notes"}`}</p>
      <div id="noteSlider">
      {noteList.map((note, index) => (
        <Note key={index} icon={note.icon || "" } title={note.notetitle || ""} isSelected={note.filename == selectedNote} onClick={() => onNoteClick(note)} handleOpenNoteOptionsDialog={handleOpenNoteOptionsDialog}/>
      ))}
      </div>
    </div>
  );
};

export default NotesBar;
