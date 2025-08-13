import { createPortal } from "react-dom";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function ModalPortal({ children }: Props) {
  const modalRoot = document.getElementById("modal-root");

  if (!modalRoot) {
    return null;
  }

  return createPortal(children, modalRoot);
}
