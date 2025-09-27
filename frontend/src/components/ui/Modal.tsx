'use client';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="modal glass-card rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-inherit z-10 pb-2">
          <h3 className="text-xl font-semibold theme-text-primary">{title}</h3>
          <button onClick={onClose} className="theme-text-muted hover:theme-text-primary text-2xl">&times;</button>
        </div>
        <div className="max-h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;