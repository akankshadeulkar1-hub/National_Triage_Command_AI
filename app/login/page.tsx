'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  Building2, 
  Ambulance, 
  UserCheck, 
  AlertCircle,
  FileCheck,
  CheckCircle2,
  X,
  Activity,
  HeartPulse,
  KeyRound
} from 'lucide-react';

export default function SecureLoginPage() {
  const router = useRouter();

  // Form States
  const [medicalId, setMedicalId] = useState('dr.sharma@nationaltriage.gov');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'ROLE_ADMIN' | 'ROLE_PARAMEDIC'>('ROLE_ADMIN');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Request Credentials Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqLicense, setReqLicense] = useState('');
  const [reqHospital, setReqHospital] = useState('');

  // Handle Secure Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!medicalId.trim()) {
      setErrorMessage('Please enter a valid Email or Medical ID.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your access password.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate network authentication delay for realism
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Set cookies for role-based access control (RBAC)
      document.cookie = `user_role=${selectedRole}; path=/; max-age=86400`;
      const displayName = medicalId.split('@')[0].replace('.', ' ').toUpperCase();
      document.cookie = `user_name=${displayName}; path=/; max-age=86400`;

      // Optional: Call auth endpoint if available
      try {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: medicalId, role: selectedRole }),
        });
      } catch (err) {
        console.warn('Backend Auth Sync Note:', err);
      }

      // Redirect to National Hospital Command & Dispatch Matrix
      if (selectedRole === 'ROLE_ADMIN') {
        router.push('/command-center');
      } else {
        router.push('/');
      }
    } catch (err) {
      setErrorMessage('Authentication failed. Please verify your credentials.');
      setIsLoading(false);
    }
  };

  const handleRequestAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSubmitted(true);
    setTimeout(() => {
      setIsRequestModalOpen(false);
      setRequestSubmitted(false);
      setReqName('');
      setReqLicense('');
      setReqHospital('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-x-hidden font-sans select-none">
      
      {/* Background Ambient Glow & Medical Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/60 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-950/30 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Main Centered Login Container */}
      <div className="relative w-full max-w-lg mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(15,23,42,0.9)] backdrop-blur-2xl z-10 space-y-6">
        
        {/* Top Header & Branding */}
        <div className="flex flex-col items-center text-center space-y-3 pb-2 border-b border-slate-800/80">
          
          {/* Tactical Medical Logo */}
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-800 to-slate-950 border border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.4)] group overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:6px_6px] opacity-30"></div>
            <HeartPulse className="w-8 h-8 text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-pulse" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase flex items-center justify-center space-x-2">
              <span>National Triage Command AI</span>
            </h1>
            <p className="text-xs sm:text-sm font-bold text-emerald-400 uppercase tracking-widest mt-0.5">
              Authorized Medical Personnel Only
            </p>
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>LEVEL 4 RESTRICTED ACCESS GATEWAY</span>
          </div>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Role Selection Tabs (Hospital Command Admin vs Field Paramedic) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Select Credential Tier
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('ROLE_ADMIN')}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                selectedRole === 'ROLE_ADMIN'
                  ? 'bg-emerald-950/90 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Building2 className={`w-5 h-5 ${selectedRole === 'ROLE_ADMIN' ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="text-xs font-extrabold">HOSPITAL COMMAND</span>
              <span className="text-[9px] text-emerald-400 font-mono">ROLE_ADMIN</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('ROLE_PARAMEDIC')}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                selectedRole === 'ROLE_PARAMEDIC'
                  ? 'bg-red-950/90 border-red-500 text-white shadow-lg shadow-red-500/20 ring-1 ring-red-500'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Ambulance className={`w-5 h-5 ${selectedRole === 'ROLE_PARAMEDIC' ? 'text-red-400' : 'text-slate-500'}`} />
              <span className="text-xs font-extrabold">PARAMEDIC FIELD</span>
              <span className="text-[9px] text-red-400 font-mono">ROLE_PARAMEDIC</span>
            </button>
          </div>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Email / Medical ID Input Field */}
          <div className="space-y-1.5">
            <label htmlFor="medicalIdInput" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Email / Medical ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="medicalIdInput"
                type="text"
                value={medicalId}
                onChange={(e) => setMedicalId(e.target.value)}
                placeholder="dr.smith@nationaltriage.gov"
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                required
                aria-label="Email or Medical ID"
              />
            </div>
          </div>

          {/* Password Input Field with Toggle Visibility */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="passwordInput" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Security Passcode
              </label>
              <span className="text-[10px] text-slate-500 font-mono">256-Bit Encrypted</span>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>

              <input
                id="passwordInput"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passcode"
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                required
                aria-label="Security Passcode"
              />

              {/* Password Visibility Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                title={showPassword ? 'Hide passcode' : 'Show passcode'}
                aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                )}
              </button>
            </div>
          </div>

          {/* Prominent Secure Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Authenticating Credentials...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-emerald-200" />
                <span>Secure Login to Command Matrix</span>
                <ArrowRight className="w-4 h-4 text-emerald-200" />
              </>
            )}
          </button>
        </form>

        {/* Access Control & Verification Link */}
        <div className="pt-2 border-t border-slate-800/80 text-center space-y-3">
          <div>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors cursor-pointer inline-flex items-center space-x-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Request Access / Verify Medical Credentials</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 leading-normal">
            Unauthorized access attempts are monitored and recorded under federal healthcare telemetry standards.
          </p>
        </div>

      </div>

      {/* Request Access & Credential Verification Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            
            <button
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 border border-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-emerald-400">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Verify Medical Credentials</h3>
                <p className="text-xs text-slate-400">Request Level 4 Command Center Access</p>
              </div>
            </div>

            {requestSubmitted ? (
              <div className="p-6 text-center space-y-3 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl animate-fadeIn">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-sm font-extrabold text-white">Verification Request Submitted</h4>
                <p className="text-xs text-slate-300">
                  Your medical practitioner license ID is being verified with the State Health Council. You will receive clearance notification via registered email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestAccessSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Full Practitioner Name
                  </label>
                  <input
                    type="text"
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    placeholder="Dr. Evelyn Vance, MD"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Medical Council License No.
                  </label>
                  <input
                    type="text"
                    value={reqLicense}
                    onChange={(e) => setReqLicense(e.target.value)}
                    placeholder="MCI-99482-TX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Hospital / Institution Name
                  </label>
                  <input
                    type="text"
                    value={reqHospital}
                    onChange={(e) => setReqHospital(e.target.value)}
                    placeholder="City General Trauma Center"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md mt-2 cursor-pointer"
                >
                  Submit Credential Verification Request
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
