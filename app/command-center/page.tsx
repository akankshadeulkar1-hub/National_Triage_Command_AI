'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { 
  Siren, 
  Clock, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Flame, 
  Heart, 
  Stethoscope, 
  Truck, 
  ArrowLeft,
  RefreshCw,
  Hospital as HospitalIcon,
  Radio,
  FileText,
  Wifi,
  Eye,
  LifeBuoy,
  CheckCircle2,
  BedDouble
} from 'lucide-react';

type IncomingPatient = {
  id: string;
  hospitalId: string;
  hospitalName: string;
  priority: string;
  category: string;
  summary: string;
  etaMinutes: number;
  status: string;
  timestamp: number;
  mechanismOfInjury?: string;
  first_aid_steps?: string[];
  bedAssigned?: string;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function CommandCenterPage() {
  const [patients, setPatients] = useState<IncomingPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Sample Seed Dispatches for immediate interactive view
  const seedDispatches: IncomingPatient[] = [
    {
      id: 'dispatch-demo-1',
      hospitalId: 'mock-place-id-1',
      hospitalName: 'City General Emergency Hospital & Trauma Center',
      priority: 'RED',
      category: 'Trauma / Resuscitation',
      summary: 'Severe polytrauma with active airway obstruction following high-speed vehicle impact.',
      mechanismOfInjury: 'Frontal vehicular crash with high kinetic impact energy',
      first_aid_steps: [
        'Maintain open airway and check respiration continuously.',
        'Apply firm direct pressure to active bleeding sites with clean cloth.',
        'Keep patient warm, flat, and still to treat for impending shock.'
      ],
      etaMinutes: 4.2,
      status: 'IN_TRANSIT',
      timestamp: Date.now() - 120000,
    },
    {
      id: 'dispatch-demo-2',
      hospitalId: 'mock-place-id-2',
      hospitalName: 'St. Jude Regional Medical & Orthopedics Center',
      priority: 'YELLOW',
      category: 'Orthopedics',
      summary: 'Closed compound fracture of right tibia & fibula, hemodynamically stable.',
      mechanismOfInjury: 'Fall from 10ft elevated scaffolding platform',
      first_aid_steps: [
        'Immobilize limb using rigid splint without forcing alignment.',
        'Apply cold pack wrapped in cloth to control localized swelling.',
        'Do not allow patient to bear weight on injured limb.'
      ],
      etaMinutes: 8.5,
      status: 'IN_TRANSIT',
      timestamp: Date.now() - 300000,
    },
  ];

  // Initial Fetch of Current Active Dispatches (Backend -> localStorage -> Default Seed)
  useEffect(() => {
    const fetchInitialDispatches = async () => {
      let loaded: IncomingPatient[] = [];
      try {
        const res = await fetch(`${BACKEND_URL}/api/dispatch/incoming/all`, {
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
            'User-Agent': 'NationalTriageApp/1.0',
          },
        });
        if (res.ok) {
          loaded = await res.json();
        }
      } catch (err) {
        console.warn('Backend server unreachable, using local storage dispatches:', err);
      }

      if (!loaded || loaded.length === 0) {
        try {
          const stored = localStorage.getItem('national_triage_dispatches');
          if (stored) {
            loaded = JSON.parse(stored);
          }
        } catch (e) {
          console.warn('Failed to parse local dispatches:', e);
        }
      }

      if (!loaded || loaded.length === 0) {
        loaded = seedDispatches;
        try {
          localStorage.setItem('national_triage_dispatches', JSON.stringify(seedDispatches));
        } catch (e) {}
      }

      setPatients(loaded);
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    };

    fetchInitialDispatches();
  }, []);

  const handleSimulateDispatch = () => {
    const scenarios = [
      {
        hospitalName: 'City General Emergency Hospital & Trauma Center',
        priority: 'RED',
        category: 'Trauma / Resuscitation',
        summary: 'Severe polytrauma with active airway obstruction following high-speed impact.',
        mechanismOfInjury: 'High speed vehicle rollover with trapped passenger',
        first_aid_steps: [
          'Maintain open airway and check breathing continuously.',
          'Apply firm direct pressure to active bleeding sites with clean cloth.',
          'Keep patient warm, flat, and still to prevent clinical shock.'
        ],
        etaMinutes: 3.5,
      },
      {
        hospitalName: 'St. Jude Regional Medical Center',
        priority: 'YELLOW',
        category: 'Orthopedics',
        summary: 'Closed compound fracture of right tibia & fibula, stable hemodynamics.',
        mechanismOfInjury: 'Scaffolding collapse at construction zone',
        first_aid_steps: [
          'Immobilize limb using rigid splint without forcing alignment.',
          'Apply cold pack wrapped in towel to control swelling.',
          'Do not allow patient to bear weight on injured leg.'
        ],
        etaMinutes: 6.8,
      },
      {
        hospitalName: 'Metro Health Medical Center',
        priority: 'RED',
        category: 'Cardiac Care',
        summary: 'Acute myocardial infarction with STEMI presentation and severe diaphoresis.',
        mechanismOfInjury: 'Sudden onset sub-sternal chest pressure radiating to left jaw',
        first_aid_steps: [
          'Keep patient calm and seated in a semi-upright position.',
          'Loosen restrictive clothing around chest and throat.',
          'Prepare AED unit if pulse degrades.'
        ],
        etaMinutes: 2.9,
      },
    ];

    const item = scenarios[Math.floor(Math.random() * scenarios.length)];
    const newDispatch: IncomingPatient = {
      id: `dispatch-${Date.now()}`,
      hospitalId: `hosp-${Date.now()}`,
      hospitalName: item.hospitalName,
      priority: item.priority,
      category: item.category,
      summary: item.summary,
      mechanismOfInjury: item.mechanismOfInjury,
      first_aid_steps: item.first_aid_steps,
      etaMinutes: item.etaMinutes,
      status: 'IN_TRANSIT',
      timestamp: Date.now(),
    };

    setPatients((prev) => {
      const updated = [newDispatch, ...prev.filter((p) => p.id !== newDispatch.id)];
      try {
        localStorage.setItem('national_triage_dispatches', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setLastUpdated(new Date().toLocaleTimeString());
  };

  // One-Click Bed Reservation Handler (REST API + WebSocket broadcast)
  const handleAssignBed = async (patientId: string) => {
    const bedNumber = `BED-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`;

    // Optimistic local UI update
    setPatients((prev) => {
      const updated = prev.map((p) =>
        p.id === patientId ? { ...p, bedAssigned: bedNumber, status: 'ACCEPTED' } : p
      );
      try {
        localStorage.setItem('national_triage_dispatches', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      // Read current role and token from cookies
      const roleMatch = document.cookie.match(/(?:^|; )user_role=([^;]*)/);
      const tokenMatch = document.cookie.match(/(?:^|; )user_token=([^;]*)/);
      const activeRole = roleMatch ? roleMatch[1] : 'ROLE_ADMIN';
      const activeToken = tokenMatch ? tokenMatch[1] : '';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
        'X-User-Role': activeRole,
      };

      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      let res: Response;
      try {
        res = await fetch(`${BACKEND_URL}/api/dispatch/${patientId}/assign-bed`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ id: patientId, bedAssigned: bedNumber, status: 'ACCEPTED' }),
        });
      } catch (err) {
        res = await fetch(`/api/dispatch/${patientId}/assign-bed`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ id: patientId, bedAssigned: bedNumber, status: 'ACCEPTED' }),
        });
      }

      if (res.ok) {
        const updatedRecord: IncomingPatient = await res.json();
        setPatients((prev) => {
          const updated = prev.map((p) =>
            p.id === patientId ? { ...p, ...updatedRecord } : p
          );
          try {
            localStorage.setItem('national_triage_dispatches', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    } catch (err) {
      console.warn('Bed reservation API warning:', err);
    }
  };

  // WebSockets Real-Time STOMP Connection setup
  useEffect(() => {
    let stompClient: Client | null = null;

    try {
      stompClient = new Client({
        webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws-dispatch`),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          setIsConnected(true);
          setLastUpdated(new Date().toLocaleTimeString());

          // Subscribe to general emergencies topic
          stompClient?.subscribe('/topic/emergencies', (message) => {
            if (message.body) {
              const incomingRecord: IncomingPatient = JSON.parse(message.body);
              setPatients((prev) => {
                const exists = prev.some((p) => p.id === incomingRecord.id);
                let nextList: IncomingPatient[];
                if (exists) {
                  nextList = prev.map((p) => (p.id === incomingRecord.id ? { ...p, ...incomingRecord } : p));
                } else {
                  nextList = [incomingRecord, ...prev];
                }
                try {
                  localStorage.setItem('national_triage_dispatches', JSON.stringify(nextList));
                } catch (e) {}
                return nextList;
              });
              setLastUpdated(new Date().toLocaleTimeString());
            }
          });
        },
        onDisconnect: () => {
          setIsConnected(false);
        },
        onStompError: (frame) => {
          console.warn('STOMP protocol error:', frame.headers['message']);
          setIsConnected(false);
        },
      });

      stompClient.activate();
    } catch (e) {
      console.warn('WebSocket connection error:', e);
    }

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, []);

  // ETA Countdown Local Timer Update
  useEffect(() => {
    const timer = setInterval(() => {
      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          if (p.etaMinutes <= 0.1) return { ...p, etaMinutes: 0 };
          return { ...p, etaMinutes: +(p.etaMinutes - 0.05).toFixed(2) };
        })
      );
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const getPriorityStyle = (priority: string) => {
    const p = priority?.toUpperCase() || '';
    if (p === 'RED' || p === 'CRITICAL') {
      return {
        badge: 'bg-red-600 text-white font-black animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)] border border-red-400',
        border: 'border-red-500/80 ring-1 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        cardBg: 'bg-red-950/40',
        text: 'text-red-400',
        icon: Siren,
      };
    }
    if (p === 'YELLOW' || p === 'HIGH' || p === 'MEDIUM') {
      return {
        badge: 'bg-amber-500 text-slate-950 font-black border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
        border: 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
        cardBg: 'bg-amber-950/40',
        text: 'text-amber-400',
        icon: Activity,
      };
    }
    if (p === 'GREEN' || p === 'LOW') {
      return {
        badge: 'bg-emerald-600 text-white font-bold border border-emerald-400',
        border: 'border-emerald-500/80',
        cardBg: 'bg-emerald-950/30',
        text: 'text-emerald-400',
        icon: CheckCircle,
      };
    }
    if (p === 'BLACK' || p === 'DECEASED') {
      return {
        badge: 'bg-zinc-900 border border-red-500 text-red-400 font-black',
        border: 'border-zinc-700 ring-1 ring-red-900/60',
        cardBg: 'bg-zinc-950',
        text: 'text-zinc-400',
        icon: AlertTriangle,
      };
    }

    return {
      badge: 'bg-slate-700 text-white font-bold',
      border: 'border-slate-800',
      cardBg: 'bg-slate-900',
      text: 'text-slate-300',
      icon: Activity,
    };
  };

  const getCategoryIcon = (category: string) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('burn') || cat.includes('fire') || cat.includes('smoke')) return Flame;
    if (cat.includes('cardiac') || cat.includes('heart')) return Heart;
    if (cat.includes('ortho') || cat.includes('fracture') || cat.includes('bone')) return Activity;
    return Stethoscope;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* High-Tech Technical Header */}
      <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 py-3 md:py-0 min-h-[4rem] flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <Link
              href="/"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-bold border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Main Command</span>
            </Link>

            <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] flex-shrink-0">
                <Siren className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex flex-wrap items-center gap-2">
                  <span>Trauma Center Live Feed</span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 tracking-widest flex items-center space-x-1">
                    <Wifi className="w-3 h-3 animate-pulse" />
                    <span>WEBSOCKET REAL-TIME</span>
                  </span>
                </h1>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400">
                  Real-Time Inbound Ambulance AI Triage Stream
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            {/* Real-Time WebSockets Status */}
            <div className="flex items-center space-x-2 text-[11px] sm:text-xs font-semibold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-emerald-400'}`}></span>
              <span className="font-extrabold">
                {isConnected ? 'STOMP / SockJS Connected' : 'Local / Offline Sync (Active)'}
              </span>
              {lastUpdated && <span className="text-slate-500 hidden sm:inline ml-1">({lastUpdated})</span>}
            </div>

            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-emerald-400">
              <Radio className="w-3.5 h-3.5 animate-ping text-emerald-400" />
              <span>SPRING BOOT SYNC</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Command Center Dashboard */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Dashboard Status Bar */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400">
              <HospitalIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Inbound Emergency Response Grid</h2>
              <p className="text-xs text-slate-400 font-medium">
                Pushed instantly over Spring Boot WebSockets (/topic/emergencies) & Local Sync
              </p>
            </div>
          </div>

          {/* Metric Badges Summary & Demo Trigger */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <button
              onClick={handleSimulateDispatch}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-extrabold transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center space-x-2"
            >
              <Siren className="w-4 h-4 animate-pulse" />
              <span>+ Dispatch Demo Ambulance</span>
            </button>

            <div className="bg-red-950/80 border border-red-800 text-red-300 px-3.5 py-2 rounded-xl flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span>
                {patients.filter((p) => p.priority === 'CRITICAL' || p.priority === 'RED').length} Critical Inbound
              </span>
            </div>
            <div className="bg-amber-950/80 border border-amber-800 text-amber-300 px-3.5 py-2 rounded-xl flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>
                {patients.filter((p) => p.priority === 'HIGH' || p.priority === 'MEDIUM' || p.priority === 'YELLOW').length} Delayed/Urgent
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-xl">
              <span>Total Active: {patients.length}</span>
            </div>
          </div>
        </div>

        {/* Live Incoming Patients Grid */}
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-4 bg-slate-900/40 border border-slate-800 rounded-3xl">
            <RefreshCw className="w-10 h-10 text-red-500 animate-spin" />
            <p className="text-sm font-bold text-slate-300">Synchronizing Live Inbound Emergency Stream...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
            <Truck className="w-12 h-12 text-slate-700 stroke-[1.5]" />
            <h3 className="text-lg font-bold text-slate-300">No Inbound Ambulances Currently En Route</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              When an emergency ambulance is dispatched from the main command matrix, live AI triage telemetry will stream here in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => {
              const priorityStyle = getPriorityStyle(patient.priority);
              const CategoryIcon = getCategoryIcon(patient.category);
              const isArrived = patient.etaMinutes <= 0;

              return (
                <div
                  key={patient.id}
                  className={`rounded-3xl p-6 border transition-all duration-300 space-y-4 shadow-xl relative overflow-hidden ${priorityStyle.cardBg} ${priorityStyle.border}`}
                >
                  {/* Card Header: Dispatch ID & Urgency Badge */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black tracking-widest text-slate-300 uppercase">
                        {patient.id}
                      </span>
                    </div>

                    {/* Blinking Urgency Badge */}
                    <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full ${priorityStyle.badge}`}>
                      {patient.priority}
                    </span>
                  </div>

                  {/* Hospital Destination */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination Hospital</span>
                    <p className="text-sm font-black text-white truncate">{patient.hospitalName}</p>
                  </div>

                  {/* Category */}
                  <div className="flex items-center space-x-2">
                    <CategoryIcon className={`w-4 h-4 ${priorityStyle.text}`} />
                    <span className="text-xs font-extrabold text-slate-200">{patient.category}</span>
                  </div>

                  {/* AI Summary generated by Gemini */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Gemini AI Clinical Summary</span>
                      <FileText className="w-3 h-3 text-slate-500" />
                    </div>
                    <p className="text-xs text-slate-100 bg-black/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed font-medium">
                      {patient.summary}
                    </p>
                  </div>

                  {/* Mechanism of Injury (Vision Analysis) if available */}
                  {patient.mechanismOfInjury && (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Mechanism of Injury (Vision Analysis)</span>
                      </div>
                      <p className="text-xs text-slate-100 bg-black/70 p-3 rounded-xl border border-slate-800/80 leading-relaxed font-medium">
                        {patient.mechanismOfInjury}
                      </p>
                    </div>
                  )}

                  {/* Immediate First Aid Protocols */}
                  {patient.first_aid_steps && patient.first_aid_steps.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        <LifeBuoy className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span>Immediate First Aid Protocols</span>
                      </div>
                      <div className="bg-black/70 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                        {patient.first_aid_steps.map((step, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-xs text-slate-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span className="font-medium leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* One-Click Bed Reservation Action / Status Badge */}
                  <div className="pt-2 border-t border-slate-800/80">
                    {patient.status === 'ACCEPTED' || patient.bedAssigned ? (
                      <div className="bg-emerald-950/80 border border-emerald-500/80 p-3 rounded-2xl flex items-center justify-between shadow-lg text-emerald-300">
                        <div className="flex items-center space-x-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider block text-emerald-400">BED RESERVED</span>
                            <span className="text-sm font-black text-white">{patient.bedAssigned || 'BED-04'}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                          ACCEPTED
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAssignBed(patient.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-3 px-4 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 cursor-pointer"
                      >
                        <BedDouble className="w-4 h-4 text-white" />
                        <span>ACCEPT & ASSIGN BED</span>
                      </button>
                    )}
                  </div>

                  {/* Simulated Countdown ETA Timer */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Estimated Arrival</span>
                    </div>

                    <div className={`px-4 py-1.5 rounded-xl border font-black text-sm ${
                      isArrived
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-black/60 border-slate-700 text-yellow-300'
                    }`}>
                      {isArrived ? 'ARRIVED AT ER' : `${patient.etaMinutes.toFixed(1)} mins`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
