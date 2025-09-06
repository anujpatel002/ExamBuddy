import { useState } from 'react';
import Button from '../ui/Button';

interface IQuestion { question: string; options: string[]; }
interface IQuiz { questions: IQuestion[]; }

interface QuizInterfaceProps {
  quiz: IQuiz;
  onSubmitAnswer: (questionIndex: number, answer: string) => void;
}

const QuizInterface = ({ quiz, onSubmitAnswer }: QuizInterfaceProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const question = quiz.questions[currentQuestionIndex];

  const handleNext = () => {
    if (selectedOption) {
      onSubmitAnswer(currentQuestionIndex, selectedOption);
      setSelectedOption(null);
      if (currentQuestionIndex < quiz.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Last question was answered, the parent component will handle the end state
      }
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Question {currentQuestionIndex + 1} of {quiz.questions.length}</h3>
      <p className="text-lg mb-6">{question.question}</p>
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelectedOption(option)}
            className={`w-full text-left p-3 rounded-md border-2 transition-colors ${
              selectedOption === option
                ? 'bg-indigo-100 border-indigo-500'
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={handleNext} disabled={!selectedOption}>
          {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </Button>
      </div>
    </div>
  );
};

export default QuizInterface;