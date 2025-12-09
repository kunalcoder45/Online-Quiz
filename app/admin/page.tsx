'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, Users, BarChart3 } from 'lucide-react';
import AdminQuestionCreator from '@/app/components/AdminQuestionCreator';
import Leaderboard from '@/app/components/Leaderboard';

interface Question {
  question: string;
  options: string[];
  correct: number;
  time: number;
}

interface User {
  name: string;
  connected: boolean;
}

interface AnswerData {
  userName: string;
  correct: boolean;
}

export default function AdminPanel() {
  const [view, setView] = useState<'create' | 'live' | 'results'>('create');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [responses, setResponses] = useState<AnswerData[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3001');
    
    websocket.onopen = () => {
      websocket.send(JSON.stringify({ type: 'admin_connect' }));
      console.log('Admin connected to WebSocket');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'user_connected') {
        setConnectedUsers(data.users);
      } else if (data.type === 'answer_submitted') {
        setResponses(prev => [...prev, data]);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = websocket;

    return () => {
      websocket.close();
    };
  }, []);

  const startQuiz = () => {
    if (questions.length === 0) {
      alert('Please add questions first!');
      return;
    }
    setQuizActive(true);
    setCurrentQuestionIndex(0);
    setView('live');
    broadcastQuestion(0);
  };

  const broadcastQuestion = (index: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'new_question',
        question: questions[index],
        questionNumber: index + 1,
        totalQuestions: questions.length
      }));
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setResponses([]);
      broadcastQuestion(nextIndex);
    } else {
      endQuiz();
    }
  };

  const endQuiz = () => {
    setQuizActive(false);
    setView('results');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'quiz_ended' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{connectedUsers.length} users online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setView('create')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                view === 'create'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Create Questions
            </button>
            <button
              onClick={() => setView('live')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                view === 'live'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Play className="w-4 h-4 inline mr-2" />
              Live Quiz
            </button>
            <button
              onClick={() => setView('results')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                view === 'results'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Results
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {view === 'create' && (
          <AdminQuestionCreator
            questions={questions}
            setQuestions={setQuestions}
            onStartQuiz={startQuiz}
          />
        )}

        {view === 'live' && (
          <div className="space-y-6">
            {!quizActive ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Ready to start the quiz?
                </h2>
                <p className="text-gray-600 mb-6">
                  {questions.length} questions prepared
                </p>
                <button
                  onClick={startQuiz}
                  className="bg-linear-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition"
                >
                  <Play className="w-5 h-5 inline mr-2" />
                  Start Quiz
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-700">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {responses.length} / {connectedUsers.length} answered
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {questions[currentQuestionIndex]?.question}
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {questions[currentQuestionIndex]?.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border-2 ${
                          i === questions[currentQuestionIndex].correct
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300'
                        }`}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={nextQuestion}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'End Quiz'}
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'results' && <Leaderboard />}
      </div>
    </div>
  );
}