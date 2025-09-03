import React, { useState } from "react";
import { usePassword } from "./PasswordContext";
import { invoke } from "@tauri-apps/api/core";

interface Props {
  onCloseDialog: () => void;
}

const ChangePasswordDialog: React.FC<Props> = ({onCloseDialog}) => {
  const { password, setPassword } = usePassword();

  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hint, setHint] = useState("");

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentPasswordInput !== password) {
      alert("Current password is incorrect");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match");
      return;
    }

    if(currentPasswordInput === newPassword) {
        alert("New password cannot be the same as current password");
        return;
    }

    invoke("reencrypt_data", {
      oldPassword: password,
      newPassword: newPassword,
      newHint: hint
    });

    setPassword(newPassword);
    alert("Password changed successfully!");

    setCurrentPasswordInput("");
    setNewPassword("");
    setConfirmPassword("");
    setHint("");

    onCloseDialog();
  };

  return (
    <div id="newvault-form-container">
      <form onSubmit={handlePasswordChange}>
        <p className="dialog-input-label">Current password</p>
        <input
          className="dialog-input-text"
          type="password"
          placeholder="Current password..."
          required
          value={currentPasswordInput}
          onChange={(e) => setCurrentPasswordInput(e.target.value)}
        />

        <p className="dialog-input-label">New password</p>
        <input
          className="dialog-input-text"
          type="password"
          placeholder="New password..."
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <p className="dialog-input-label">Confirm new password</p>
        <input
          className="dialog-input-text"
          type="password"
          placeholder="Confirm new password..."
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <p className="dialog-input-label">New password hint</p>
        <input
          className="dialog-input-text"
          type="text"
          placeholder="New password hint..."
          value={hint}
          onChange={(e) => setHint(e.target.value)}
        />

        <button className="dialog-button" type="submit">
          Change password
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordDialog;
