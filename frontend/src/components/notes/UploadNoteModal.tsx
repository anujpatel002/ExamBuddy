import { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import api from '@/lib/api';

// 1. We must define that the component expects a `subjectId` prop.
interface UploadNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteUploaded: () => void;
  subjectId: string; // <-- This line is crucial
}

// 2. We must accept `subjectId` from the props.
const UploadNoteModal = ({ isOpen, onClose, onNoteUploaded, subjectId }: UploadNoteModalProps) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) {
      toast.error('Please provide both a title and a file.');
      return;
    }
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('document', file);
    // 3. Now `subjectId` is defined and can be used here.
    formData.append('subjectId', subjectId);
    
    try {
      await api.post('/notes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Note uploaded successfully!');
      onNoteUploaded();
      setTitle('');
      setFile(null);
    } catch (error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    toast.error(axiosError.response?.data?.message || 'Upload failed.');
}
finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload New Note">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          type="text" 
          placeholder="Note Title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          required 
        />
        <Input 
          type="file" 
          accept=".pdf,.docx,.txt" 
          onChange={handleFileChange} 
          required 
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Upload</Button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadNoteModal;