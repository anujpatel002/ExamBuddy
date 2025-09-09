'use client';
import Modal from './Modal';
import Button from './Button';
import { FiCheckCircle } from 'react-icons/fi';

interface SuccessModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  title: string;
  message: string;
}

const SuccessModal = ({ isOpen, onConfirm, title, message }: SuccessModalProps) => {
  // Use a different onClose for the modal background to prevent accidental closing
  const handleOnClose = () => {};

  return (
    <Modal isOpen={isOpen} onClose={handleOnClose} title={title}>
      <div className="text-center">
        <FiCheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <p className="mt-4 mb-6 text-gray-600 dark:text-gray-300">{message}</p>
        <Button onClick={onConfirm} className="w-full">
          Logout and Continue
        </Button>
      </div>
    </Modal>
  );
};

export default SuccessModal;