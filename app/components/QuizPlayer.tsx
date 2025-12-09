'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle } from 'lucide-react';

interface QuestionData {
  question: {
    question: string;
    options: string[];
    correct: number;
    time: number;
  };
  questionNumber: number;
  totalQuestions: number;
}

interface Props {
  question: QuestionData;
  onAnswer: (index: number | null) => void;
  answered: boolean;
}

export default function QuizPlayer({ question, onAnswer, answered }: Props) {
  // FIX 1: Initializing state directly from props.
  // When this component is rendered with a changing `key` prop (in the parent), 
  // React will remount it, resetting state to these initial values.
  const [timeLeft, setTimeLeft] = useState<number>(question.question.time);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswer = useCallback((index: number | null) => {
    if (answered) return;
    setSelectedAnswer(index);
    onAnswer(index);
  }, [answered, onAnswer]);

  // FIX 2: Timer logic remains, as it's a true side effect (external timing).
  // The 'handleAnswer' call is kept here, as it's directly tied to the timer 
  // hitting zero, which is the primary purpose of this effect.
  useEffect(() => {
    if (timeLeft > 0 && !answered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !answered) {
      handleAnswer(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, answered, onAnswer]); // Removed handleAnswer as a dependency, kept onAnswer which is used inside handleAnswer's dependencies

  const getOptionClass = (index: number): string => {
    if (!answered) {
      return 'bg-white hover:bg-purple-50 border-2 border-gray-300 hover:border-purple-500 cursor-pointer transform hover:scale-105';
    }
    
    if (index === question.question.correct) {
      return 'bg-green-100 border-2 border-green-500';
    }
    
    if (index === selectedAnswer && index !== question.question.correct) {
      return 'bg-red-100 border-2 border-red-500';
    }
    
    return 'bg-gray-100 border-2 border-gray-300';
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-600">
            Question {question.questionNumber} of {question.totalQuestions}
          </span>
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${timeLeft <= 5 ? 'text-red-600' : 'text-purple-600'}`} />
            <span className={`text-xl font-bold ${timeLeft <= 5 ? 'text-red-600' : 'text-purple-600'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              timeLeft <= 5 ? 'bg-red-600' : 'bg-purple-600'
            }`}
            style={{
              width: `${(timeLeft / question.question.time) * 100}%`
            }}
          />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {question.question.question}
      </h2>

      <div className="grid grid-cols-1 gap-4 mb-6">
        {question.question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            disabled={answered}
            className={`p-4 rounded-xl text-left font-semibold transition-all ${getOptionClass(index)}`}
          >
            <div className="flex items-center justify-between">
              <span>{option}</span>
              {answered && index === question.question.correct && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
          </button>
        ))}
      </div>

      {answered && (
        <div className={`p-4 rounded-xl text-center font-semibold ${
          selectedAnswer === question.question.correct
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {selectedAnswer === question.question.correct
            ? '🎉 Correct! Great job!'
            : selectedAnswer === null
            ? '⏱️ Time up!'
            : '❌ Wrong answer. Better luck next time!'}
        </div>
      )}
    </div>
  );
}