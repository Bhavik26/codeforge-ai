'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { Search, SlidersHorizontal, BookOpen, CheckCircle2, Circle, HelpCircle } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  successRate: number;
  totalSubmissions: number;
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Available tags to filter by (computed from typical topics)
  const allTags = ['array', 'string', 'math', 'hash-table', 'dynamic-programming', 'recursion', 'two-pointers'];

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        skip: 0,
        take: 50,
      };

      if (search) params.search = search;
      if (difficulty !== 'ALL') params.difficulty = difficulty;
      if (selectedTag !== 'ALL') params.tags = selectedTag;

      const response = await api.get('/problems/search', { params });
      if (response.data?.success) {
        setProblems(response.data.data || []);
        setTotal(response.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  }, [search, difficulty, selectedTag]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProblems();
    }, 300); // Debounce search input

    return () => clearTimeout(timer);
  }, [fetchProblems]);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'HARD':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Challenges</h1>
        <p className="text-sm text-zinc-400 mt-1">Practice coding, level up your logic, and prepare for technical interviews.</p>
      </div>

      {/* Filter bar */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Difficulty filter */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1">
            {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  difficulty === level
                    ? 'bg-zinc-800 text-indigo-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Tag filter */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 focus:outline-none focus:border-indigo-600 transition-all cursor-pointer"
          >
            <option value="ALL">All Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Problems table */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-zinc-500 font-medium">Loading problems...</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <BookOpen className="w-12 h-12 text-zinc-600" />
            <h3 className="text-lg font-bold text-zinc-300">No challenges found</h3>
            <p className="text-sm text-zinc-500 max-w-xs">Try adjusting your filters or search query to find problems.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider bg-zinc-950/40">
                  <th className="px-6 py-4 w-12">Status</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4 w-32">Difficulty</th>
                  <th className="px-6 py-4 w-40">Success Rate</th>
                  <th className="px-6 py-4 w-32 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {problems.map((problem) => (
                  <tr key={problem.id} className="hover:bg-zinc-850/30 transition-colors group">
                    <td className="px-6 py-4">
                      <Circle className="w-5 h-5 text-zinc-700" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/problems/${problem.id}`}
                          className="font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors text-sm"
                        >
                          {problem.title}
                        </Link>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {problem.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-zinc-950 text-zinc-500 border border-zinc-850 px-2 py-0.5 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {problem.successRate ? `${problem.successRate.toFixed(1)}%` : '0%'}
                      <span className="text-[10px] text-zinc-600 block">{problem.totalSubmissions} submissions</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/problems/${problem.id}`}
                        className="inline-flex items-center justify-center bg-zinc-800 group-hover:bg-indigo-600 text-zinc-300 group-hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                      >
                        Solve
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
