'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  PhoneCall, 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft, 
  Stethoscope, 
  Building2, 
  Ambulance, 
  CheckCircle2, 
  Sparkles,
  AlertTriangle,
  Siren,
  HeartPulse,
  X
} from 'lucide-react';

export type OnboardingState = 'splash' | 'disclaimer' | 'onboarding' | 'completed';

interface OnboardingFlowProps {
  onComplete: () => void;
  onStateChange?: (state: OnboardingState) => void;
  forceState?: OnboardingState;
}

export default function OnboardingFlow({ onComplete, onStateChange, forceState }: OnboardingFlowProps) {
  const [currentState, setCurrentState] = useState<OnboardingState>(forceState || 'splash');
  const [onboardingStep, setOnboardingStep] = useState<number>(1);

  // Notify parent component of state change if needed
  const changeState = (newState: OnboardingState) => {
    setCurrentState(newState);
    if (onStateChange) {
      onStateChange(newState);
    }
  };

  // State 1: 1.5-second automatic transition from Splash -> Emergency Disclaimer
  useEffect(() => {
    if (currentState === 'splash') {
      const timer = setTimeout(() => {
        changeState('disclaimer');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentState]);

  // Handle completion
  const handleFinish = () => {
    changeState('completed');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 text-white font-sans overflow-y-auto p-4 sm:p-6 select-none animate-fadeIn">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/50 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-red-950/30 via-transparent to-transparent pointer-events-none" />

      {/* Main Container - Mobile First Card */}
      <div className="relative w-full max-w-md mx-auto min-h-[580px] flex flex-col justify-between rounded-3xl bg-slate-900/90 border border-slate-800 shadow-[0_0_50px_rgba(15,23,42,0.9)] backdrop-blur-xl overflow-hidden transition-all duration-300">
        
        {/* Top Header Badge */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-sm">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-widest text-red-400 uppercase block">National Triage Command</span>
              <span className="text-[11px] font-medium text-slate-400">Emergency Assessment System</span>
            </div>
          </div>

          {/* If in onboarding state, show top quick-skip button for emergencies */}
          {currentState === 'onboarding' && (
            <button
              onClick={handleFinish}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-red-600/30 border border-slate-700 hover:border-red-500/50 rounded-full transition-all flex items-center space-x-1 shadow-sm active:scale-95"
            >
              <span>Start Triage Now</span>
              <ArrowRight className="w-3.5 h-3.5 text-red-400" />
            </button>
          )}
        </div>

        {/* Dynamic State Content Area */}
        <div className="flex-1 flex flex-col justify-center p-6 sm:p-8">

          {/* ========================================================================= */}
          {/* STATE 1: MINIMAL SPLASH SCREEN */}
          {/* ========================================================================= */}
          {currentState === 'splash' && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn py-8">
              
              {/* Medical Triage Logo with Pulse Ring */}
              <div className="relative">
                {/* Pulsing ring background */}
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping duration-1000 scale-150"></div>
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-900 to-slate-950 border border-blue-400/40 shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center">
                  <HeartPulse className="w-14 h-14 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-pulse" />
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                  National Triage System
                </h1>
                <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                  AI-Powered Medical Priority Assessment & Emergency Dispatch
                </p>
              </div>

              {/* Subtle Spinner & Loading Status */}
              <div className="flex flex-col items-center space-y-3 pt-4">
                <div className="w-7 h-7 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-xs font-semibold tracking-wider text-blue-400/90 uppercase animate-pulse">
                  Initializing Emergency Portal...
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STATE 2: EMERGENCY DISCLAIMER (CRUCIAL) */}
          {/* ========================================================================= */}
          {currentState === 'disclaimer' && (
            <div className="flex flex-col justify-between h-full space-y-6 animate-fadeIn py-2">
              
              {/* Warning Header */}
              <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-200 shadow-inner">
                <div className="p-2 bg-red-600 text-white rounded-xl shadow-lg flex-shrink-0 animate-bounce">
                  <Siren className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold tracking-wider text-red-400 uppercase">
                    Critical Emergency Notice
                  </h2>
                  <p className="text-xs font-semibold text-red-200/90">Please read carefully before proceeding</p>
                </div>
              </div>

              {/* Main Warning Box - Emergency Red & High Contrast White Text */}
              <div className="bg-gradient-to-b from-red-950/90 to-slate-900 border-2 border-red-600 rounded-2xl p-5 shadow-[0_0_30px_rgba(220,38,38,0.25)] space-y-4">
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-extrabold text-sm uppercase tracking-wide">Warning Disclaimer</span>
                </div>
                
                <p className="text-base sm:text-lg font-bold text-white leading-relaxed tracking-tight drop-shadow-sm">
                  "WARNING: This system is for assessment purposes only. If you are experiencing a life-threatening emergency, please close this app and call emergency services immediately."
                </p>
              </div>

              {/* Call Emergency Quick Action Link */}
              <a
                href="tel:911"
                className="w-full py-3 px-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-white transition-all flex items-center justify-center space-x-2 font-bold text-sm"
              >
                <PhoneCall className="w-4 h-4 text-red-400 animate-pulse" />
                <span>Call Emergency Services (911 / 112)</span>
              </a>

              {/* Primary Action Button: "I Understand - Continue" */}
              <button
                onClick={() => changeState('onboarding')}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-500 text-white font-extrabold text-base shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>I Understand - Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STATE 3: SKIPPABLE ONBOARDING (2-STEP) */}
          {/* ========================================================================= */}
          {currentState === 'onboarding' && (
            <div className="flex flex-col justify-between h-full space-y-6 animate-fadeIn py-2">
              
              {/* Step Indicators */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  Step {onboardingStep} of 2
                </span>
                <div className="flex space-x-1.5">
                  <div className={`w-8 h-2 rounded-full transition-all duration-300 ${onboardingStep === 1 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`} />
                  <div className={`w-8 h-2 rounded-full transition-all duration-300 ${onboardingStep === 2 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`} />
                </div>
              </div>

              {/* Step 1 Content: AI Voice & Symptom Triage */}
              {onboardingStep === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-lg mx-auto sm:mx-0">
                    <Stethoscope className="w-9 h-9" />
                  </div>
                  <div className="space-y-2 text-center sm:text-left">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      Instant Symptom Triage
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-normal">
                      Speak or type symptoms. Our AI engine computes vital priority levels (Critical, Urgent, Non-Urgent) in real-time with step-by-step first aid guidance.
                    </p>
                  </div>
                  
                  {/* Feature Checklist */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center space-x-3 text-xs sm:text-sm text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Hands-free voice recording</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs sm:text-sm text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Automatic priority category classification</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 Content: Hospital & Ambulance Dispatch */}
              {onboardingStep === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg mx-auto sm:mx-0">
                    <Ambulance className="w-9 h-9" />
                  </div>
                  <div className="space-y-2 text-center sm:text-left">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      Hospital & Ambulance Dispatch
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-normal">
                      Find nearby hospitals with live bed availability, view distance metrics, and dispatch/track emergency units directly to your location.
                    </p>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center space-x-3 text-xs sm:text-sm text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Real-time hospital bed capacity tracker</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs sm:text-sm text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Live GPS tracking for dispatched ambulances</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Onboarding Control Buttons */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center space-x-3">
                  {onboardingStep === 2 && (
                    <button
                      onClick={() => setOnboardingStep(1)}
                      className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Previous Step"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}

                  {onboardingStep === 1 ? (
                    <button
                      onClick={() => setOnboardingStep(2)}
                      className="flex-1 py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>Next Step</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleFinish}
                      className="flex-1 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>Start Triage Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Bottom prominent skip button for immediate triage start */}
                <button
                  onClick={handleFinish}
                  className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider text-center block cursor-pointer"
                >
                  Skip Explanation & Go Directly to Triage
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 text-center">
          <span className="text-[10px] text-slate-500 font-medium">
            National Triage Command AI • Secure Healthcare Assessment Platform
          </span>
        </div>

      </div>
    </div>
  );
}
