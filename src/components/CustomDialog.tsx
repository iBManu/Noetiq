import { ReactNode } from "react";
import ModalPortal from "./ModalPortal";

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function CustomDialog({ isOpen, onClose, children }: CustomDialogProps) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="custom-dialog-backdrop">
        <div className="custom-dialog-modal">
          <button
            onClick={onClose}
            className="custom-dialog-close"
            aria-label="Close"
          >
            ✕
          </button>
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}
