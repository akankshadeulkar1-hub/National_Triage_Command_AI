'use client';

import { X, Trash2, Clock, MapPin, Activity, AlertTriangle, CheckCircle, Flame, Heart, Stethoscope, ChevronRight } from 'lucide-react';

export type HistoryItem = {
  id: string;
  timestamp: string;
  priority: string;
  category: string;
  summary: string;
  confidence_score?: number;
  transcript?: string;
  dispatchedHospital?: string | null;
  mechanismOfInjury?: string;
};

interface CaseHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: HistoryItem[];
  onSelectRecord: (record: HistoryItem) => void;
  onClearHistory: () => void;
}

export default function CaseHistoryDrawer({
  isOpen,
  onClose,
  historyItems,
  onSelectRecord,
  onClearHistory,
}: CaseHistoryDrawerProps) {
  if (!isOpen) return null;

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return {
          cardBg: 'bg-red-950/30 hover:bg-red-950/50 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.25)]',
          badge: 'bg-red-600 text-white',
          text: 'text-red-400',
        };
      case 'HIGH':
        return {
          cardBg: 'bg-amber-950/30 hover:bg-amber-950/50 border-amber-500/80',
          badge: 'bg-amber-600 text-white',
          text: 'text-amber-400',
        };
      case 'MEDIUM':
        return {
          cardBg: 'bg-yellow-950/30 hover:bg-yellow-950/50 border-yellow-500/80',
          badge: 'bg-yellow-600 text-slate-950 font-black',
          text: 'text-yellow-400',
        };
      case 'LOW':
        return {
          cardBg: 'bg-emerald-950/30 hover:bg-emerald-950/50 border-emerald-500/80',
          badge: 'bg-emerald-600 text-white',
          text: 'text-emerald-400',
        };
      default:
        return {
          cardBg: 'bg-slate-900 hover:bg-slate-800 border-slate-800',
          badge: 'bg-slate-700 text-white',
          text: 'text-slate-300',
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('burn') || cat.includes('fire') || cat.includes('smoke')) return Flame;
    if (cat.includes('cardiac') || cat.includes('heart')) return Heart;
    if (cat.includes('ortho') || cat.includes('fracture') || cat.includes('bone')) return Activity;
    return Stethoscope;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex justify-end transition-opacity duration-300">
      <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-slideLeft">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white uppercase tracking-wide">Triage Case History Matrix</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-bold">
              {historyItems.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
          {historyItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-8 space-y-3">
              <Clock className="w-12 h-12 text-slate-700 stroke-[1.5]" />
              <p className="font-bold text-slate-400 text-sm">No Triage Case History Records</p>
              <p className="text-xs text-slate-600 max-w-xs">
                When you record or submit paramedic emergency vitals, clinical evaluations will be automatically saved here.
              </p>
            </div>
          ) : (
            historyItems.map((item) => {
              const style = getPriorityStyle(item.priority);
              const CategoryIcon = getCategoryIcon(item.category);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectRecord(item);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 space-y-2 relative group ${style.cardBg}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${style.badge}`}>
                      {item.priority}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{item.timestamp}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CategoryIcon className={`w-4 h-4 ${style.text}`} />
                      <h4 className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                        {item.category}
                      </h4>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-slate-800/80">
                    {item.summary}
                  </p>

                  {item.dispatchedHospital && (
                    <div className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 pt-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>Dispatched: {item.dispatchedHospital}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {historyItems.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/90">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all triage case history?')) {
                  onClearHistory();
                }
              }}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Case History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
