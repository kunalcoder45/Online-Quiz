'use client';

import { useState, useEffect, ReactElement } from 'react'; // Added ReactElement here
import { Trophy, Medal, Award } from 'lucide-react';

interface Leader {
  name: string;
  score: number;
  time: number;
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL!);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'get_leaderboard' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'leaderboard_update') {
        setLeaders(data.leaders);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => ws.close();
  }, []);

  // FIX: Changed return type from 'JSX.Element' to 'ReactElement' (imported above)
  const getRankIcon = (index: number): ReactElement => {
    switch (index) {
      case 0:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 1:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 2:
        return <Award className="w-8 h-8 text-orange-600" />;
      default:
        return <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>;
    }
  };

  const getRankBg = (index: number): string => {
    switch (index) {
      case 0:
        return 'bg-linear-to-r from-yellow-400 to-yellow-600';
      case 1:
        return 'bg-linear-to-r from-gray-300 to-gray-500';
      case 2:
        return 'bg-linear-to-r from-orange-400 to-orange-600';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-3">
        <Trophy className="w-8 h-8 text-yellow-500" />
        Leaderboard
      </h2>

      <div className="space-y-3">
        {leaders.map((leader, index) => (
          <div
            key={index}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-md ${
              index < 3 ? getRankBg(index) + ' text-white' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center w-12">
              {getRankIcon(index)}
            </div>

            <div className="flex-1">
              <p className={`font-bold text-lg ${index >= 3 ? 'text-gray-800' : ''}`}>
                {leader.name}
              </p>
              <p className={`text-sm ${index >= 3 ? 'text-gray-500' : 'text-white/80'}`}>
                Time: {leader.time}s
              </p>
            </div>

            <div className="text-right">
              <p className={`text-2xl font-bold ${index >= 3 ? 'text-purple-600' : ''}`}>
                {leader.score}
              </p>
              <p className={`text-xs ${index >= 3 ? 'text-gray-500' : 'text-white/80'}`}>
                points
              </p>
            </div>
          </div>
        ))}
      </div>

      {leaders.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p>No scores yet. Complete the quiz to see results!</p>
        </div>
      )}
    </div>
  );
}