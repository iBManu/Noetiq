import React from "react";

interface ConfirmVaultDeleteDialogProps {
  onConfirm: () => void;
}

const ConfirmVaultDeleteDialog: React.FC<ConfirmVaultDeleteDialogProps> = ({ onConfirm }) => {

  return (
    <div id="openvault-container">
      <p className="dialog-input-label">Confirm delete vault</p>
      <button className="dialog-button-red" onClick={onConfirm}>Confirm</button>
    </div>
  );
};


export default ConfirmVaultDeleteDialog;