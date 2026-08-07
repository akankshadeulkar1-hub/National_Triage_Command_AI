'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock, UserCheck } from 'lucide-react';

export default function UnauthorizedPage() {
  const handleSwitchToAdmin = () => {
    document.cookie = 'user_role=ROLE_ADMIN; path=/; max-age=86400';
    window.location.href = '/command-center';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/90 border border-red-900/60 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="w-16 h-16 bg-red-950/80 border border-red-500/50 rounded-2xl flex items-center justify-center mx-auto text-red-400 shadow-lg shadow-red-500/20">
          <ShieldAlert className="w-9 h-9 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black tracking-widest text-red-400 uppercase bg-red-950/80 px-3 py-1 rounded-full border border-red-800/80">
            HTTP 403 FORBIDDEN
          </span>
          <h1 className="text-2xl font-black text-white pt-1">Access Restricted</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your current account is authenticated under the <strong className="text-red-400 font-bold">PARAMEDIC MOBILE (ROLE_PARAMEDIC)</strong> role.
            Access to the Trauma Command Center is restricted exclusively to authorized <strong className="text-emerald-400 font-bold">HOSPITAL STAFF (ROLE_ADMIN)</strong>.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <button
            onClick={handleSwitchToAdmin}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-3.5 px-5 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-white" />
            <span>SWITCH TO ADMIN (ROLE_ADMIN) & ENTER</span>
          </button>

          <Link
            href="/"
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black py-3.5 px-5 rounded-2xl flex items-center justify-center space-x-2 transition-all border border-slate-700 block text-center"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>RETURN TO PARAMEDIC FIELD DISPATCH</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
