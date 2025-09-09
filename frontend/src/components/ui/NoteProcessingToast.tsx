import { FiLoader, FiCheckCircle } from 'react-icons/fi';

interface NoteProcessingToastProps {
  noteTitle: string;
  isComplete: boolean;
}

const NoteProcessingToast = ({ noteTitle, isComplete }: NoteProcessingToastProps) => {
  return (
    <div className="flex items-center gap-4">
      {isComplete ? (
        <FiCheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
      ) : (
        <FiLoader className="w-8 h-8 text-indigo-500 animate-spin flex-shrink-0" />
      )}
      <div>
        <p className="font-bold">
          {isComplete ? 'Processing Complete!' : 'Processing Note...'}
        </p>
        <p className="text-sm">
          {isComplete
            ? `Doubt Solver is now ready for "${noteTitle}".`
            : `Preparing "${noteTitle}" for the Doubt Solver.`}
        </p>
      </div>
    </div>
  );
};

export default NoteProcessingToast;