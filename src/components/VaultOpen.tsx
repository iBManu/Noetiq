import { useEffect, useState, useRef } from "react";
import Editor, { EditorHandle } from "./Editor";
import NotesBar from "./NotesBar";
import NoteIndex from "./NoteIndex";
import OptionsBar from "./OptionsBar";
import { Header } from "./types";
import CustomDialog from "./CustomDialog";
import OptionsDialog from "./OptionsDialog";
import NoteOptionsDialog from "./NoteOptionsDialog";
import { invoke } from "@tauri-apps/api/core";
import { usePassword } from "./PasswordContext";
import { NoteItem } from "./interfaces";

interface Props {
  path: string;
  name: string;
  id: string;
  onVaultClose: () => void;
}

const VaultOpen: React.FC<Props> = ({ path, name, id, onVaultClose }) => {
  const [data, setData] = useState(null);
  const [headers, setHeaders] = useState<Header[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isNoteOptionsModalOpen, setIsNoteOptionsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string>("");
  const { password } = usePassword();
  const [loadedNote, setLoadedNote] = useState<string | null>(null);
  const [currentNoteEditData, setCurrentNoteEditData] = useState<string>("");

  const editorRef = useRef<EditorHandle | null>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const emojiList = [
    "😀", "😎", "🤓", "🥳", "🤯", "😇", "😈", "😴", "😭", "😅",
    "😬", "🤔", "😶‍🌫️", "😺", "😻", "🙃", "😮‍💨", "🤠",
    "🍕", "🍣", "🍎", "🥑", "🍩", "🍪", "🍉", "🍞", "🥐", "🍔", "🌮",
    "📦", "💡", "📚", "🖋️", "🔐", "💾", "🪄", "📅", "📎", "🧲", "🧠",
    "💻", "🖥️", "⌨️", "🖱️", "📱", "🧮", "📡", "🔋", "🔧", "🛠️",
    "🌱", "🌸", "🌈", "🌍", "🌕", "🔥", "❄️", "💧", "🌊", "🪐",
    "🐶", "🐱", "🐸", "🐢", "🦉", "🐝", "🐘", "🐙", "🦕", "🦄",
    "🎨", "🎸", "🎮", "🎲", "📸", "🎬", "🎧", "🪄", "🎯", "🪅",
    "🔮", "🚀", "🧘", "🧳", "🧼", "🏕️", "🔎", "🧩", "📝", "✉️"
  ];

  function getRandomEmoji() {
    return emojiList[Math.floor(Math.random() * emojiList.length)];
  }

  function openOptions() {
    setIsOptionsModalOpen(true);
  }

  function onEmojiChange(emoji: string) {
    invoke("update_note_icon", {
      password,
      vaultfolder: id,
      filename: selectedNote,
      newIcon: emoji,
    });
    loadNotes();
  }

  async function loadNotes() {
    try {
      const decryptedIndexJson = await invoke<string>("get_notes_index", {
        password,
        vaultfolder: id,
      });
      const updatedNotes = JSON.parse(decryptedIndexJson);
      setNotes(updatedNotes);
      return updatedNotes;
    } catch (err) {
      console.error("Error loading notes:", err);
      return [];
    }
  }

  const saveNote = async (dataOverride: any = null) => {
    if (!selectedNote || !editorRef.current) return;

    try {
      const savedData = dataOverride || (await editorRef.current.save());

      await invoke("save_note_data", {
        password,
        vaultfolder: id,
        filename: selectedNote,
        content: JSON.stringify(savedData),
      });
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const switchNote = async (newNote: string) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }

    await saveNote();
    setSelectedNote(newNote);
  };

  async function onNewNote() {
    try {
      await saveNote();

      const newEmoji = getRandomEmoji();
      await invoke("create_note", {
        password,
        vaultfolder: id,
        icon: newEmoji,
      });

      const updatedNotes = await loadNotes();

      if (updatedNotes.length > 0) {
        const lastNote = updatedNotes[updatedNotes.length - 1];
        await switchNote(lastNote.filename || lastNote);
      }
    } catch (err) {
      console.error("Error creating note:", err);
    }
  }

  const onTitleChange = (newTitle: string) => {
    if (!selectedNote) return;
    invoke("update_note_title", {
      password,
      vaultfolder: id,
      filename: selectedNote,
      newTitle,
    })
      .then(() => {
        loadNotes();
      })
      .catch((err) => console.error("Error updating note title:", err));
  };

  function getCurrentNoteItem(): NoteItem | undefined {
    return notes.find((note) => note.filename === selectedNote);
  }

  useEffect(() => {
    loadNotes();
  }, [id, password]);

  useEffect(() => {
    if (!selectedNote) {
      setData(null);
      setHeaders([]);
      setLoadedNote(null);
      return;
    }

    async function loadNoteData() {
      try {
        const encryptedData = await invoke<string>("get_note_data", {
          password,
          vaultfolder: id,
          filename: selectedNote,
        });
        const parsed = JSON.parse(encryptedData);
        setData(parsed);
        const date: string = await getNoteEditDate(id, selectedNote);
        setCurrentNoteEditData(date);
        setLoadedNote(selectedNote);
      } catch (err) {
        console.error("Error loading note:", err);
      }
    }

    loadNoteData();
  }, [selectedNote, id, password]);

  // autosave al escribir
  const handleEditorChange = (data: any) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(() => {
      saveNote(data);
    }, 2000);
  };

  const getNoteEditDate = async (
    vault: string,
    filename: string
  ): Promise<string> => {
    return await invoke<string>("get_note_edit_date", {
      vaultfolder: vault,
      filename: filename,
    });
  };

  const handleCloseNoteOptionsDialog = () => {
    setIsNoteOptionsModalOpen(false);
  };

  const handleOpenNoteOptionsDialog = () => {
    setIsNoteOptionsModalOpen(true);
  };

  return (
    <div className="App">
      <OptionsBar
        onVaultClose={async () => {
          await saveNote();
          onVaultClose();
        }}
        onOpenOptions={openOptions}
        onNewNote={onNewNote}
      />

      <NotesBar
        noteList={notes}
        vaultName={name}
        setSelectedNote={switchNote}
        selectedNote={selectedNote}
        handleOpenNoteOptionsDialog={handleOpenNoteOptionsDialog}
      />

      {selectedNote && loadedNote === selectedNote ? (
        <>
          <Editor
            ref={editorRef}
            initialData={data}
            editorBlock="editorjs-container"
            onEmojiChange={onEmojiChange}
            initialEmoji={getCurrentNoteItem()?.icon}
            title={getCurrentNoteItem()?.notetitle}
            onTitleChange={onTitleChange}
            onChange={handleEditorChange}
            editDate={currentNoteEditData}
          />
          <NoteIndex indexList={headers} />
        </>
      ) : selectedNote ? (
        <div id="note-editor-loading">
          <div id="loader"></div>
        </div>
      ) : (
        <div id="note-editor-notselected">
          <h2>Note editor</h2>
          <p onClick={onNewNote}>
            Click here to <strong>create a new note</strong>
          </p>
        </div>
      )}

      <CustomDialog
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
      >
        <OptionsDialog />
      </CustomDialog>

      <CustomDialog
        isOpen={isNoteOptionsModalOpen}
        onClose={() => setIsNoteOptionsModalOpen(false)}
      >
        <NoteOptionsDialog
          id={selectedNote}
          vaultFolder={path}
          refreshNotes={loadNotes}
          handleCloseDialog={handleCloseNoteOptionsDialog}
          setSelectedNote={setSelectedNote}
        />
      </CustomDialog>
    </div>
  );
};

export default VaultOpen;
