'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Terminal, Award, BookOpen, Code2, Zap, PlayCircle, BarChart3 } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-12">
      {/* Hero section */}
      <section className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 sm:p-12 lg:p-16 flex flex-col gap-6 shadow-2xl shadow-indigo-600/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl translate-y-12 -translate-x-12" />
        
        <div className="relative z-10 max-w-3xl flex flex-col gap-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Competitive Programming
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Forge Your Coding Skills With <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Adaptive AI Intelligence</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-xl">
            Compile, run, and execute solutions inside isolated sandboxes. Get real-time test case verification, live leaderboards, and personalized learning paths.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 mt-4">
          <Link
            href="/problems"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all text-sm"
          >
            <PlayCircle className="w-5 h-5" />
            Explore Challenges
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-6 py-3 rounded-xl border border-zinc-700 hover:text-white transition-all text-sm"
          >
            <Award className="w-5 h-5" />
            Leaderboard
          </Link>
        </div>
      </section>

      {/* Stats and user welcome */}
      {user && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Current Rating</p>
              <h3 className="text-2xl font-black text-white mt-1">{user.rating}</h3>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Code2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Problems Attempted</p>
              <h3 className="text-2xl font-black text-white mt-1">Ready</h3>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Active Streak</p>
              <h3 className="text-2xl font-black text-white mt-1">1 Day</h3>
            </div>
          </div>
        </section>
      )}

      {/* Feature Grid */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-black text-white">Platform Core Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/15 text-indigo-400 flex items-center justify-center font-bold">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Isolated Sandbox Runtime</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Your submissions are run inside containerized Docker sandboxes supporting multiple languages, ensuring clean execution limits and secure validation.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/15 text-emerald-400 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Real-Time Submission Updates</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Socket.IO sockets feed compilation logs, active test cases count, and final verdicts straight to your workspace without needing manual page refreshes.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-600/15 text-amber-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Adaptive Learning Analytics</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Our LangGraph state framework evaluates solution attempts to recommend custom learning modules, mock interviews, and tailored challenge pathways.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
