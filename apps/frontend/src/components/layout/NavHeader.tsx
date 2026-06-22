'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Code2, Award, User, LogOut, ShieldAlert, Cpu } from 'lucide-react';

export default function NavHeader() {
  const pathname = usePathname();
  const { user, login, logout, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
    setErrorMsg('');
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setAuthLoading(true);
    setErrorMsg('');
    const demoEmail = 'developer@codeforge.ai';
    const demoPassword = 'password123';
    try {
      // First try to login
      await login(demoEmail, demoPassword);
    } catch (err) {
      // If login fails, try to register the demo account first
      try {
        await api.post('/auth/register', {
          email: demoEmail,
          username: 'codeforge_dev',
          password: demoPassword,
          firstName: 'Demo',
          lastName: 'Developer',
        });
        // Login again after registering
        await login(demoEmail, demoPassword);
      } catch (regErr: any) {
        setErrorMsg('Failed to initialize demo session');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Cpu },
    { name: 'Problems', path: '/problems', icon: Code2 },
    { name: 'Leaderboard', path: '/leaderboard', icon: Award },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-white font-extrabold text-xl tracking-tight group">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white group-hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30">
              <Code2 className="w-6 h-6" />
            </span>
            <span>CodeForge<span className="text-indigo-400">.AI</span></span>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-2 px-3 h-10 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-indigo-400'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Auth status or login forms */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          ) : user ? (
            <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <div className="flex flex-col text-right">
                <span className="text-xs text-zinc-400">Authenticated</span>
                <span className="text-sm font-bold text-white">{user.username}</span>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-black text-indigo-300">{user.rating}</span>
              </div>
              <button
                onClick={logout}
                className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <form onSubmit={handleLogin} className="hidden lg:flex items-center gap-2">
                <input
                  type="email"
                  placeholder="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-xs px-2.5 py-1.5 rounded-lg text-zinc-200 focus:outline-none focus:border-zinc-700 w-40"
                  required
                />
                <input
                  type="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-xs px-2.5 py-1.5 rounded-lg text-zinc-200 focus:outline-none focus:border-zinc-700 w-32"
                  required
                />
                <button
                  type="submit"
                  disabled={authLoading}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all disabled:opacity-50"
                >
                  Sign In
                </button>
              </form>
              <button
                onClick={handleDemoLogin}
                disabled={authLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-extrabold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <User className="w-3.5 h-3.5" />
                Demo Session
              </button>
            </div>
          )}
        </div>
      </div>
      {errorMsg && (
        <div className="bg-rose-950/60 border-t border-b border-rose-900 text-rose-300 text-xs px-4 py-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </header>
  );
}
