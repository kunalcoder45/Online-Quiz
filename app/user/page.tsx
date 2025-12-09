'use client';

import { useState, useEffect, useRef } from 'react';
import { Trophy, Loader } from 'lucide-react';
import QuizPlayer from '@/app/components/QuizPlayer';
import Leaderboard from '@/app/components/Leaderboard';

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

export default function UserPage() {
  const [userName, setUserName] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [score, setScore] = useState<number>(0);
  const [answered, setAnswered] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [waiting, setWaiting] = useState<boolean>(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (!name) {
      window.location.href = '/';
      return;
    }
    
    const initializeUser = () => {
      setUserName(name);

      const websocket = new WebSocket('ws://localhost:3001');
      
      websocket.onopen = () => {
        websocket.send(JSON.stringify({
          type: 'user_connect',
          name: name
        }));
        console.log('User connected to WebSocket');
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_question') {
          setCurrentQuestion(data);
          setAnswered(false);
          setWaiting(false);
        } else if (data.type === 'quiz_ended') {
          setShowResults(true);
          setWaiting(false);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = websocket;
    };

    initializeUser();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const submitAnswer = (answerIndex: number | null) => {
    if (answered || !currentQuestion) return;

    const isCorrect = answerIndex === currentQuestion.question.correct;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setAnswered(true);
    setWaiting(true);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'submit_answer',
        userName: userName,
        questionNumber: currentQuestion.questionNumber,
        answer: answerIndex,
        correct: isCorrect,
        score: isCorrect ? score + 1 : score
      }));
    }
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-600 via-pink-500 to-red-500 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
            <div className="text-center mb-8">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Quiz Completed!
              </h1>
              <p className="text-xl text-gray-600">
                Your Score: <span className="font-bold text-purple-600">{score}</span>
              </p>
            </div>
          </div>
          <Leaderboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-600 via-pink-500 to-red-500 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{userName}</h2>
              <p className="text-gray-600">Current Score: {score}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-4">
              <Trophy className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {waiting ? (
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {answered ? 'Waiting for next question...' : 'Waiting for quiz to start...'}
            </h3>
            <p className="text-gray-600">
              The admin will start the quiz soon
            </p>
          </div>
        ) : currentQuestion && (
          <QuizPlayer
            question={currentQuestion}
            onAnswer={submitAnswer}
            answered={answered}
          />
        )}
      </div>
    </div>
  );
}