import React, { useState } from "react";
import EmojiPicker from "./EmojiPicker";
import { invoke } from "@tauri-apps/api/core";
import { usePassword } from "./PasswordContext";

interface Props {
    refreshVaults: () => void;
    handleCloseDialog: () => void;
}

const NewVaultDialog: React.FC<Props> = ({ refreshVaults, handleCloseDialog }) => {
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

    const [icon, setIcon] = useState(emojiList[Math.floor(Math.random() * emojiList.length)]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const {password} = usePassword();

    const handleNewVault = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Name is required");
            return;
        }
        try {
            await invoke('create_vault', {
                password,
                newVault: {
                    icon,
                    name,
                    description,
                }
            });
            refreshVaults();
            handleCloseDialog();
            setName("");
            setDescription("");
            setIcon(emojiList[Math.floor(Math.random() * emojiList.length)]);
        } catch (error) {
            alert("Error creando vault: " + String(error));
        }
    };

    return (
        <div id="newvault-form-container">
            <form action="" onSubmit={handleNewVault}>
                <div>
                    <EmojiPicker onEmojiChange={setIcon} initialEmoji={icon} />
                </div>
                <p className="dialog-input-label">Name</p>
                <input className="dialog-input-text" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vault name..." required />
                <p className="dialog-input-label">Description</p>
                <input className="dialog-input-text" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Vault description..." />
                <div>
                <button className="dialog-button" type="submit" onClick={handleNewVault} >Create vault</button>
                </div>
            </form>
        </div>
    )
}

export default NewVaultDialog;