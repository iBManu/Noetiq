import { useState } from "react";
import { invoke } from '@tauri-apps/api/core';
import { usePassword } from "./PasswordContext";

const SetPasswordView = () => {

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [hint, setHint] = useState("");

    const { setPassword: setGlobalPassword } = usePassword();

    const handlePasswordSet = async () => {
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
          }

          try {
            await invoke("set_password", {
              password,
              hint
            });
      
            setGlobalPassword(password);

            alert("Password set successfully!");
          } catch (err) {
            console.error(err);
            alert("Failed to set password.");
          }
    };

    return (
        <div id="loginview-container">
            <h1> 🔐 Welcome to <strong>Noetiq</strong> 🔐 </h1>
            <p>No previous activity found, set a password to start working</p>
            <div id="loginview-dialog">
                <form action="" onSubmit={handlePasswordSet}>
                <p className="dialog-input-label">Password</p>
                <input className="dialog-input-text" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password..." required/>
                <p className="dialog-input-label">Confirm password</p>
                <input className="dialog-input-text" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password..." required/>
                <p className="dialog-input-label">Password hint</p>
                <input className="dialog-input-text" type="text" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Password hint..." />
                <button className="dialog-button" type="submit">Set password</button>
                </form>
            </div>
        </div>
    );

}

export default SetPasswordView;