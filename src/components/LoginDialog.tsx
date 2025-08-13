import React, { useState } from "react";
import { usePassword } from "./PasswordContext";

interface Props {
    hint: string;
    onLoginSuccess: () => void;
}

const LoginDialog: React.FC<Props> = ({ hint, onLoginSuccess }) => {

    const [passwordInput, setPasswordInput] = useState("");
    const { setPassword } = usePassword();

    const handleUnlock = async () => {
        try {
            setPassword(passwordInput);
            onLoginSuccess();
        } catch (err) {
            alert("Failed to unlock vaults: " + err);
          }
    };

    return (
        <div id="loginview-container">
            <h1>Welcome to <strong>Noetiq</strong></h1>
            <p>Previous activity found, enter your password to start working</p>
            <div id="loginview-dialog">
                <p className="dialog-input-label">Password</p>
                <input className="dialog-input-text" type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder={hint} />
                <button className="dialog-button" onClick={handleUnlock} >Access Vaults</button>
            </div>
        </div>
    );
}

export default LoginDialog;