import { FiFileText } from 'react-icons/fi';

interface Note {
  _id: string;
  title: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// This component no longer has a <Link> wrapper.
// It just displays the note's details.
const NoteCard = ({ note }: { note: Note }) => {
  return (
    <div className="flex flex-col justify-between h-full">
      <div>
          <div className="flex items-center mb-2">
              <FiFileText className="text-indigo-500 mr-3 text-2xl flex-shrink-0" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 break-words">{note.title}</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
              Created on: {new Date(note.createdAt).toLocaleDateString()}
          </p>
      </div>
      <span className={`mt-4 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full self-start ${
          note.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
      }`}>
          {note.status}
      </span>
    </div>
  );
};

export default NoteCard;