'use client';
import { useState } from 'react';
import { FiX, FiDownload, FiFileText, FiSettings } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { generateQuickExam } from '@/utils/examGenerator';
import toast from 'react-hot-toast';

interface ExamGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: any;
  noteTitle: string;
}

const ExamGeneratorModal = ({ isOpen, onClose, questions, noteTitle }: ExamGeneratorModalProps) => {
  const [format, setFormat] = useState<'pdf' | 'word'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState({
    oneMarker: questions?.oneMarker?.slice(0, 5) || [],
    threeMarker: questions?.threeMarker?.slice(0, 3) || [],
    fourMarker: questions?.fourMarker?.slice(0, 2) || [],
    fiveMarker: questions?.fiveMarker?.slice(0, 2) || []
  });

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateQuickExam(selectedQuestions, noteTitle, format);
      toast.success(`Exam paper generated successfully as ${format.toUpperCase()}!`);
      onClose();
    } catch (error) {
      console.error('Error generating exam:', error);
      toast.error('Failed to generate exam paper. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateQuestionCount = (type: string, count: number) => {
    const availableQuestions = questions?.[type] || [];
    const maxCount = Math.min(count, availableQuestions.length);
    setSelectedQuestions(prev => ({
      ...prev,
      [type]: availableQuestions.slice(0, maxCount)
    }));
  };

  const getTotalMarks = () => {
    return (
      selectedQuestions.oneMarker.length * 1 +
      selectedQuestions.threeMarker.length * 3 +
      selectedQuestions.fourMarker.length * 4 +
      selectedQuestions.fiveMarker.length * 5
    );
  };

  const getTotalQuestions = () => {
    return (
      selectedQuestions.oneMarker.length +
      selectedQuestions.threeMarker.length +
      selectedQuestions.fourMarker.length +
      selectedQuestions.fiveMarker.length
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <FiFileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generate Exam Paper</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create a professional exam paper with question snapshots</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Export Format
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormat('pdf')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  format === 'pdf'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📄</div>
                  <div className="font-medium">PDF</div>
                  <div className="text-xs text-gray-500">Professional format</div>
                </div>
              </button>
              <button
                onClick={() => setFormat('word')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  format === 'word'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-medium">Word</div>
                  <div className="text-xs text-gray-500">Editable format</div>
                </div>
              </button>
            </div>
          </div>

          {/* Question Selection */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FiSettings className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Question Selection
              </label>
            </div>
            
            <div className="space-y-4">
              {[
                { key: 'oneMarker', label: '1 Mark Questions', marks: 1, color: 'green' },
                { key: 'threeMarker', label: '3 Mark Questions', marks: 3, color: 'yellow' },
                { key: 'fourMarker', label: '4 Mark Questions', marks: 4, color: 'orange' },
                { key: 'fiveMarker', label: '5 Mark Questions', marks: 5, color: 'red' }
              ].map(({ key, label, marks, color }) => {
                const available = questions?.[key]?.length || 0;
                const selected = selectedQuestions[key as keyof typeof selectedQuestions].length;
                
                if (available === 0) return null;
                
                return (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-${color}-500`}></div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{label}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {available} available • {selected * marks} marks
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max={available}
                        value={selected}
                        onChange={(e) => updateQuestionCount(key, parseInt(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm font-medium w-8 text-center">{selected}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Exam Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total Questions:</span>
                <span className="ml-2 font-medium">{getTotalQuestions()}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total Marks:</span>
                <span className="ml-2 font-medium">{getTotalMarks()}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Subject:</span>
                <span className="ml-2 font-medium">{noteTitle}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                <span className="ml-2 font-medium">3 Hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            isLoading={isGenerating}
            disabled={getTotalQuestions() === 0}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            <FiDownload className="w-4 h-4 mr-2" />
            Generate {format.toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExamGeneratorModal;