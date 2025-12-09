'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Users, Zap } from 'lucide-react';

export default function Home() {
  const [name, setName] = useState<string>('');
  const router = useRouter();

  const joinAsUser = () => {
    if (name.trim()) {
      localStorage.setItem('userName', name);
      router.push('/user');
    } else {
      alert('Please enter your name!');
    }
  };

  const joinAsAdmin = () => {
    const password = prompt('Enter admin password:');
    if (password === 'admin123') {
      router.push('/admin');
    } else {
      alert('Wrong password!');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block bg-linear-to-r from-purple-600 to-pink-600 rounded-full p-4 mb-4">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            QuizMaster Live
          </h1>
          <p className="text-gray-600">
            Real-time quiz competition with AI-powered questions
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-xl">
            <Zap className="w-6 h-6 text-purple-600" />
            <span className="text-sm text-gray-700">Live competition mode</span>
          </div>
          <div className="flex items-center gap-3 bg-pink-50 p-4 rounded-xl">
            <Users className="w-6 h-6 text-pink-600" />
            <span className="text-sm text-gray-700">Real-time leaderboard</span>
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && joinAsUser()}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition"
          />
          
          <button
            onClick={joinAsUser}
            className="w-full bg-linear-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition"
          >
            Join as Player
          </button>

          <button
            onClick={joinAsAdmin}
            className="w-full bg-gray-800 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition"
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}