import {
  memo,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import EditorJS from "@editorjs/editorjs";
import { EDITOR_JS_TOOLS } from "./Tool";
import DragDrop from "editorjs-drag-drop";
import Undo from "editorjs-undo";
import MultiBlockSelectionPlugin from "editorjs-multiblock-selection-plugin";
import EmojiPicker from "./EmojiPicker";
import { useSettings } from './SettingsContext';

interface EditorProps {
  initialData: any;
  onChange: (data: any, headers: any[]) => void;
  editorBlock: string;
  onEmojiChange?: (emoji: string) => void;
  initialEmoji?: string;
  title?: string;
  onTitleChange: (newTitle: string) => void;
  editDate: string;
}

export interface EditorHandle {
  save: () => Promise<any>;
}

const Editor = forwardRef<EditorHandle, EditorProps>(
  (
    {
      initialData,
      onChange,
      editorBlock,
      onEmojiChange = () => { },
      initialEmoji,
      title,
      onTitleChange,
      editDate,
    },
    ref
  ) => {
    const editorInstance = useRef<EditorJS | null>(null);
    const titleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localTitle, setLocalTitle] = useState(title || "");
    const { fontSize } = useSettings();

    const classMap = {
      small: 'editor-font-small',
      medium: 'editor-font-medium',  // corregí doble guion aquí
      large: 'editor-font-large',
    };

    useEffect(() => {
      setLocalTitle(title || "");
    }, [title]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalTitle(val);
      if (titleTimeout.current) clearTimeout(titleTimeout.current);
      titleTimeout.current = setTimeout(() => {
        onTitleChange(val);
      }, 2000);
    };

    useEffect(() => {
      const initEditor = async () => {
        const holderEl = document.getElementById(editorBlock);
        if (!holderEl) {
          setTimeout(initEditor, 100);
          return;
        }

        const editor = new EditorJS({
          holder: editorBlock,
          data: initialData,
          tools: EDITOR_JS_TOOLS,
          onReady: () => {
            new DragDrop(editor, "2px solid #fff");
            new Undo({ editor });
            const selection = new MultiBlockSelectionPlugin({
              editor,
              version: EditorJS.version,
            });
            selection.listen();
          },
          onChange: async (api) => {
            const savedData = await api.saver.save();
            const headers = savedData.blocks
              .filter((block) => block.type === "header")
              .map((block) => ({
                text: block.data.text,
                level: block.data.level,
              }));
            onChange?.(savedData, headers);
          },
        });

        editorInstance.current = editor;
      };

      initEditor();

      return () => {
        if (editorInstance.current?.destroy) {
          editorInstance.current.destroy();
          editorInstance.current = null;
        }
      };
    }, []);

    useImperativeHandle(ref, () => ({
      save: async () => {
        if (editorInstance.current) {
          return await editorInstance.current.saver.save();
        }
        return null;
      },
    }));

    return (
      <div id="editor-container">
        <div id="title-container">
          <EmojiPicker
            onEmojiChange={onEmojiChange}
            initialEmoji={initialEmoji ?? "📝"}
          />
          <input
            type="text"
            placeholder="Insert note title..."
            id="title-container-title"
            value={localTitle}
            onChange={handleTitleChange}
          />
          <p id="title-container-dateedited">Last edited {editDate}</p>
        </div>
        <div id={editorBlock} className={`editor ${classMap[fontSize]}`} />
      </div>
    );
  }
);

export default memo(Editor);
