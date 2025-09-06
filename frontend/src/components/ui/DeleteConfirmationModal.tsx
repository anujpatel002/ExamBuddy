'use client';
import Modal from './Modal';
import Button from './Button';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  itemName: string;
}

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isLoading, itemName }: DeleteConfirmationModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Delete ${itemName}`}>
      <p className="mb-6 text-gray-600 dark:text-gray-300">Are you sure you want to delete this {itemName}? This action cannot be undone.</p>
      <div className="flex justify-end gap-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} isLoading={isLoading} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">
          Delete
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;