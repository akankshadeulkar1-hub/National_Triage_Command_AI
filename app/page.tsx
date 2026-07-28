'use client';

import { useState } from 'react';
import { Mic, AlertTriangle, CheckCircle, Activity, Skull, Loader2 } from 'lucide-react';

type TriageResult = {
  triageColor: string;
  summary: string;
  requiredSpecialty: string;
  urgencyScore: number;
};

export default function ParamedicApp() {
  const [loading, setLoading] = useState(false);
  const [triageData, setTriageData] = useState<TriageResult | null>(null);
  const [vitalsText, setVitalsText] = useState('');

  const handleAIAnalysis = async () => {
    if (!vitalsText.trim()) return;

    setLoading(true);
    setTriageData(null);

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vitalsText })
      });

      const result = await response.json();

      if (result.success) {
        setTriageData(result.data as TriageResult);
      } else {
        alert(`AI API Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to connect to AI', error);
    } finally {
      setLoading(false);
    }
  };

  const getThemeByColor = (color: string) => {
    switch (color) {
      case 'RED':
        return { bg: 'bg-red-950', border: 'border-red-500', text: 'text-red-500', lightText: 'text-red-200', btn: 'bg-red-600 hover:bg-red-700', icon: AlertTriangle };
      case 'YELLOW':
        return { bg: 'bg-yellow-950', border: 'border-yellow-500', text: 'text-yellow-500', lightText: 'text-yellow-200', btn: 'bg-yellow-600 hover:bg-yellow-700', icon: Activity };
      case 'GREEN':
        return { bg: 'bg-green-950', border: 'border-green-500', text: 'text-green-500', lightText: 'text-green-200', btn: 'bg-green-600 hover:bg-green-700', icon: CheckCircle };
      case 'BLACK':
        return { bg: 'bg-zinc-950', border: 'border-zinc-500', text: 'text-zinc-500', lightText: 'text-zinc-300', btn: 'bg-zinc-700 hover:bg-zinc-800', icon: Skull };
      default:
        return { bg: 'bg-zinc-900', border: 'border-zinc-500', text: 'text-white', lightText: 'text-zinc-300', btn: 'bg-blue-600 hover:bg-blue-700', icon: AlertTriangle };
    }
  };

  const theme = triageData ? getThemeByColor(triageData.triageColor) : null;
  const Icon = theme?.icon ?? AlertTriangle;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="flex flex-col items-center justify-center py-8 border-b border-zinc-800">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          TriageCommand <span className="text-blue-500">AI</span>
        </h1>
        <div className="flex items-center space-x-2 text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span>Paramedic Unit: Alpha-1</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center mt-10 space-y-8 px-4">
        <div className="w-full max-w-2xl">
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Patient Vitals & Condition (Type or Speak)
          </label>
          <textarea
            value={vitalsText}
            onChange={(e) => setVitalsText(e.target.value)}
            className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
            placeholder="Describe the patient's condition here..."
          />
        </div>

        <button
          onClick={handleAIAnalysis}
          disabled={loading}
          className={`relative flex items-center justify-center w-full max-w-2xl py-4 rounded-xl font-bold text-lg transition-all duration-300 ${loading ? 'bg-blue-900 text-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 mr-2 animate-spin" /> AI is Analyzing...
            </>
          ) : (
            <>
              <Mic className="w-6 h-6 mr-2" /> Analyze with Gemini AI
            </>
          )}
        </button>

        {triageData && theme && (
          <div className={`w-full max-w-2xl border rounded-xl p-6 shadow-lg transform transition-all ${theme.bg} ${theme.border}`}>
            <div className="flex items-center space-x-3 mb-2">
              <Icon className="w-8 h-8" />
              <h3 className={`text-3xl font-black tracking-wider ${theme.text}`}>
                {triageData.triageColor} TAG
              </h3>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">AI Medical Summary</p>
                <p className={`text-lg ${theme.lightText}`}>{triageData.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-black/30 p-3 rounded-lg">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Required Specialty</p>
                  <p className="font-semibold">{triageData.requiredSpecialty}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Urgency Score</p>
                  <p className="font-semibold">{triageData.urgencyScore} / 10</p>
                </div>
              </div>
            </div>

            <button className={`mt-6 w-full font-bold py-4 rounded-lg text-lg transition-colors ${theme.btn}`}>
              Route to Nearest {triageData.requiredSpecialty}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}