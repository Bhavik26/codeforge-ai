'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Award, Trophy, Users, ShieldAlert, ChevronRight, Zap } from 'lucide-react';

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  rating: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(25);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const response = await api.get('/leaderboard/global', {
          params: { limit }
        });
        if (response.data?.success) {
          setUsers(response.data.data || []);
        } else {
          setErrorMsg('Failed to load leaderboard data.');
        }
      } catch (err: any) {
        console.error('Error fetching leaderboard:', err);
        setErrorMsg('Error contacting backend server. Make sure it is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [limit]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="flex items-center gap-1 text-amber-400 font-extrabold text-sm bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shadow-lg shadow-amber-500/5">
            <Trophy className="w-3.5 h-3.5" /> Gold #1
          </span>
        );
      case 2:
        return (
          <span className="flex items-center gap-1 text-zinc-300 font-extrabold text-sm bg-zinc-400/10 border border-zinc-400/20 px-2 py-0.5 rounded-full">
            <Trophy className="w-3.5 h-3.5" /> Silver #2
          </span>
        );
      case 3:
        return (
          <span className="flex items-center gap-1 text-amber-600 font-extrabold text-sm bg-amber-700/10 border border-amber-700/20 px-2 py-0.5 rounded-full">
            <Trophy className="w-3.5 h-3.5" /> Bronze #3
          </span>
        );
      default:
        return <span className="text-zinc-500 font-medium text-sm pl-2">#{rank}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <Award className="w-8 h-8 text-indigo-500" />
          Global Leaderboard
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Rankings of CodeForge AI developers sorted by skill rating and verified code submissions.
        </p>
      </div>

      {/* Stats Cards / Highlight banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-2xl p-6 flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Top Competitor</p>
            <p className="text-lg font-black text-white mt-0.5">
              {users.length > 0 ? users[0].username : 'No Users'}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-2xl p-6 flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Active Cohort</p>
            <p className="text-lg font-black text-white mt-0.5">
              {users.length} Ranked Developers
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-2xl p-6 flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Highest Rating</p>
            <p className="text-lg font-black text-white mt-0.5">
              {users.length > 0 ? `${users[0].rating} pts` : '0 pts'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and limits */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-bold text-zinc-200">Global Rankings</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Show limit:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 focus:outline-none focus:border-indigo-600 transition-all cursor-pointer"
          >
            <option value={10}>Top 10</option>
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
          </select>
        </div>
      </section>

      {/* Leaderboard Table */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-zinc-500 font-medium">Loading rankings...</p>
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3 px-4">
            <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-300">Leaderboard Unavailable</h3>
            <p className="text-sm text-zinc-500 max-w-sm">{errorMsg}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <Users className="w-12 h-12 text-zinc-600" />
            <h3 className="text-lg font-bold text-zinc-300">No users found</h3>
            <p className="text-sm text-zinc-500 max-w-xs">There are currently no authenticated developers in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider bg-zinc-950/40">
                  <th className="px-6 py-4 w-28">Rank</th>
                  <th className="px-6 py-4">Developer</th>
                  <th className="px-6 py-4 w-36">Rating</th>
                  <th className="px-6 py-4 w-48">Submissions (Acc/Total)</th>
                  <th className="px-6 py-4 w-36">Accuracy Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {users.map((item) => {
                  const accuracy = item.totalSubmissions > 0 
                    ? (item.acceptedSubmissions / item.totalSubmissions) * 100 
                    : 0;
                  
                  return (
                    <tr key={item.id} className="hover:bg-zinc-850/30 transition-colors group">
                      <td className="px-6 py-4">
                        {getRankBadge(item.rank)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors text-sm flex items-center gap-1.5">
                            {item.username}
                            {item.rank <= 3 && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            )}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {item.firstName} {item.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-indigo-400">
                          {item.rating} <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">pts</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-300">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-400">{item.acceptedSubmissions}</span>
                          <span className="text-zinc-600">/</span>
                          <span className="text-zinc-500">{item.totalSubmissions}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-sm">
                        <div className="flex flex-col gap-1 w-24">
                          <span className="font-semibold text-xs text-zinc-300">
                            {accuracy.toFixed(1)}%
                          </span>
                          <div className="w-full h-1.5 bg-zinc-850 rounded-full overflow-hidden border border-zinc-800">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${accuracy}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
