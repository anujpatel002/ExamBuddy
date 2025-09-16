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
    <div className="glass-card p-8 rounded-3xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
      
      <div className="relative z-10">
        <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">Question {currentQuestionIndex + 1} of {quiz.questions.length}</h3>
        <p className="text-lg mb-8 theme-text-primary leading-relaxed">{question.question}</p>
        <div className="space-y-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedOption(option)}
              className={`quiz-option w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 theme-text-primary ${
                selectedOption === option
                  ? 'glass-card quiz-selected shadow-lg'
                  : 'glass-card theme-border'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleNext} 
            disabled={!selectedOption}
            className="modern-button bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white hover:scale-105 transition-all duration-300 px-6 py-3 rounded-2xl"
          >
            {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;