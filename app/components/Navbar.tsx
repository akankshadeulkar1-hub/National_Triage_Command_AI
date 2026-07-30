'use client';

import Link from 'next/link';
import { History, Activity, Radio, Siren } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dispatch' | 'history';
  onSelectTab: (tab: 'dispatch' | 'history') => void;
  historyCount: number;
}

export default function Navbar({ activeTab, onSelectTab, historyCount }: NavbarProps) {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl flex-shrink-0 z-40">
      <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 min-h-[3.5rem] py-2 md:py-0 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
        {/* Left: Secure Branding - National Triage Command AI */}
        <div className="flex items-center space-x-3 cursor-pointer w-full md:w-auto justify-between md:justify-start" onClick={() => onSelectTab('dispatch')}>
          <div className="flex items-center space-x-3">
            {/* Tactical Medical Radar Logo in Secure Emerald Theme */}
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-800 to-slate-950 border border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.4)] group overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:6px_6px] opacity-30"></div>
              
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-transform group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L21 7V12C21 17.5 17 21 12 22C7 21 3 17.5 3 12V7L12 2Z" fill="rgba(16,185,129,0.2)" stroke="#34d399" strokeWidth="1.5" />
                <path d="M12 7V17M7 12H17" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M5 12H8.5L10 9.5L12.5 15L14.5 11.5L16 13.5H19" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900"></span>
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)] uppercase flex items-center space-x-2">
                <span>National Triage Command AI</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 block -mt-0.5">
                Secure Emergency Field Matrix
              </span>
            </div>
          </div>

          {/* System Online status badge on mobile top right */}
          <div className="flex md:hidden items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-bold text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Online</span>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-auto justify-center">
          <button
            onClick={() => onSelectTab('dispatch')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 rounded-lg font-extrabold text-xs transition-all ${
              activeTab === 'dispatch'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span>Active Command</span>
          </button>

          <Link
            href="/command-center"
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 rounded-lg font-extrabold text-xs text-red-400 hover:text-white hover:bg-red-950/60 border border-transparent hover:border-red-800/80 transition-all"
          >
            <Siren className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 animate-pulse" />
            <span>Trauma Live Feed</span>
          </Link>

          <button
            onClick={() => onSelectTab('history')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 rounded-lg font-extrabold text-xs transition-all relative ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="hidden sm:inline">Case History</span>
            <span className="sm:hidden">History</span>
            {historyCount > 0 && (
              <span className="ml-1 bg-slate-800 text-slate-200 font-black text-[10px] px-1.5 py-0.2 rounded-full border border-slate-700">
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right: System Status Badge (Desktop) */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-400 tracking-wide">System Online</span>
          <Radio className="w-3.5 h-3.5 text-emerald-400 ml-1" />
        </div>
      </div>
    </header>
  );
}
