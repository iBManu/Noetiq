import { useState } from "react";
import { usePassword } from "./PasswordContext";
import { invoke } from "@tauri-apps/api/core";

interface LoginViewProps {
    hint: string,
    onLoginSuccess: () => void,
  }

  const LoginView = ({ hint, onLoginSuccess }: LoginViewProps ) => {

    const [passwordInput, setPasswordInput] = useState("");
    const { setPassword } = usePassword();

    const handleUnlock = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        try {
            await invoke<string>("get_vaults", { password: passwordInput });
            setPassword(passwordInput);
            onLoginSuccess();
        } catch (err) {
            alert("Failed to unlock vaults: " + err);
        }
    };

    return (
        <div id="loginview-container">
            <h1>🔐 Welcome to <strong>Noetiq</strong> 🔐</h1>
            <p>Previous activity found, enter your password to start working</p>
            <form id="loginview-dialog" onSubmit={handleUnlock}>
                <p className="dialog-input-label">Password</p>
                <input
                    className="dialog-input-text"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={hint}
                />
                <button className="dialog-button" type="submit">Access Vaults</button>
            </form>
        </div>
    );
}


export default LoginView;