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
    <div className="flex flex-col justify-between h-full relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-t-2xl"></div>
      
      <div className="pt-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 glass-card rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex-shrink-0">
            <FiFileText className="text-indigo-500 dark:text-indigo-400 text-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 break-words leading-tight mb-2">{note.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              {new Date(note.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className={`glass-card px-3 py-1 rounded-full text-xs font-bold border ${
          note.status === 'approved' 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' 
            : 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
        }`}>
          {note.status === 'approved' ? '✅ Ready' : '⏳ Processing'}
        </span>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          📄 Note
        </div>
      </div>
    </div>
  );
};

export default NoteCard;