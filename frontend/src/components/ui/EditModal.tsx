'use client';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
  isLoading: boolean;
  itemType: string;
  initialName: string;
}

const EditModal = ({ isOpen, onClose, onSave, isLoading, itemType, initialName }: EditModalProps) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    // Update the name in the modal if the selected item changes
    setName(initialName);
  }, [initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${itemType} Name`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="flex justify-end gap-4 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditModal;