import { ReactNode } from "react";
import ModalPortal from "./ModalPortal";

interface CustomDialogProps {
  isOpen: boolean;
  children: ReactNode;
}

export default function CustomDialogNoClose({ isOpen, children }: CustomDialogProps) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="custom-dialog-backdrop">
        <div className="custom-dialog-modal">
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}
