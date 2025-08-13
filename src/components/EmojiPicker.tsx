import { useState, useRef, useEffect } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface Props {
    onEmojiChange: (emoji: string) => void;
    initialEmoji: string;
}

const EmojiPicker: React.FC<Props> = ({ onEmojiChange, initialEmoji }) => {
  const [emoji, setEmoji] = useState(initialEmoji || "📝");
  const [showPicker, setShowPicker] = useState(false);
  const [theme, setTheme] = useState("light");

  const iconRef = useRef<HTMLDivElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialEmoji) {
      setEmoji(initialEmoji);
    }
  }, [initialEmoji]);

  useEffect(() => {
    onEmojiChange(emoji);
  }, [emoji]);

  useEffect(() => {
    const html = document.documentElement;

    const updateTheme = () => {
      setTheme(html.classList.contains("dark") ? "dark" : "light");
    };

    updateTheme(); // inicial
    const observer = new MutationObserver(updateTheme);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        iconRef.current &&
        !iconRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div /*id="title-container-icon"*/ style={{ position: "relative", display: "inline-block" }}>
      <div
        ref={iconRef}
        onClick={() => setShowPicker((prev) => !prev)}
        style={{ cursor: "pointer", fontSize: "1.5rem" }}
        id="title-container-icon"
      >
        {emoji}
      </div>

      {showPicker && (
        <div
          ref={pickerRef}
          style={{
            position: "absolute",
            top: "2.5rem",
            zIndex: 1000,
          }}
        >
          <Picker
            data={data}
            theme={theme}
            previewPosition="none"
            onEmojiSelect={(e: any) => {
              const selected = e.native;
              setEmoji(selected);
              setShowPicker(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
