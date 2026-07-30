'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Mic, 
  Square, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Flame, 
  Heart, 
  Stethoscope, 
  Loader2, 
  UploadCloud, 
  FileText, 
  MapPin, 
  Navigation, 
  BedDouble, 
  Truck, 
  Award,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  Siren,
  X,
  History,
  Shield,
  Radio,
  Hospital as HospitalIcon,
  Camera,
  Eye
} from 'lucide-react';

import Navbar from './components/Navbar';
import CaseHistoryDrawer, { HistoryItem } from './components/CaseHistoryDrawer';

// Dynamic import of Leaflet Map Component with SSR disabled
const AmbulanceTrackerMap = dynamic(() => import('./components/AmbulanceTrackerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-300 p-6 space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      <span className="text-sm font-bold text-slate-200">Initializing Emergency GPS Leaflet Radar...</span>
    </div>
  ),
});

type TriageResponse = {
  priority: string;
  category: string;
  summary: string;
  confidence_score?: number;
  transcript?: string;
  mechanismOfInjury?: string;
};

type Hospital = {
  place_id: string;
  name: string;
  address: string;
  distance_km: number;
  availableBeds: number;
  availableAmbulances: number;
  lat: number;
  lng: number;
  isMostBeds?: boolean;
  specialty?: string;
};

type ActiveDispatchData = {
  hospitalName: string;
  hospitalLocation: { lat: number; lng: number };
} | null;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://fast-coats-do.loca.lt';

export default function ParamedicTriageApp() {
  const [navTab, setNavTab] = useState<'dispatch' | 'history'>('dispatch');
  const [inputTab, setInputTab] = useState<'mic' | 'text'>('mic');
  const [vitalsText, setVitalsText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHospitals, setFetchingHospitals] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [triageData, setTriageData] = useState<TriageResponse | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Accordion UI state for expanded hospital card
  const [expandedHospitalId, setExpandedHospitalId] = useState<string | null>(null);

  // Case History State
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // User Geolocation Coordinates
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 37.7749, lng: -122.4194 });

  // Modal state for active ambulance dispatch tracking
  const [activeDispatch, setActiveDispatch] = useState<ActiveDispatchData>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptAccumulatorRef = useRef<string>('');

  // Scene Image Upload State
  const [sceneImage, setSceneImage] = useState<File | null>(null);
  const [sceneImagePreview, setSceneImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSceneImage(file);
      setSceneImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSceneImage(null);
    setSceneImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load History from localStorage on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('national_triage_command_history') || localStorage.getItem('rakshak_triage_history');
      if (saved) {
        setHistoryItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
    }
  }, []);

  // Save new Triage evaluation into history and localStorage
  const saveToHistory = (result: TriageResponse, dispatchedHospital?: string | null) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      priority: result.priority,
      category: result.category,
      summary: result.summary,
      confidence_score: result.confidence_score,
      transcript: result.transcript,
      dispatchedHospital: dispatchedHospital || null,
      mechanismOfInjury: result.mechanismOfInjury,
    };

    setHistoryItems((prev) => {
      const filtered = prev.filter((item) => item.summary !== newItem.summary);
      const updated = [newItem, ...filtered].slice(0, 50);
      try {
        localStorage.setItem('national_triage_command_history', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save history to localStorage', e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistoryItems([]);
    try {
      localStorage.removeItem('national_triage_command_history');
      localStorage.removeItem('rakshak_triage_history');
    } catch (e) {
      console.warn('Failed to clear history from localStorage', e);
    }
  };

  // Re-open a past record from Case History
  const handleSelectHistoryRecord = (record: HistoryItem) => {
    setTriageData({
      priority: record.priority,
      category: record.category,
      summary: record.summary,
      confidence_score: record.confidence_score,
      transcript: record.transcript,
    });
    setHospitals(null);
    setExpandedHospitalId(null);
    setErrorMsg(null);
    setNavTab('dispatch');
  };

  // 1. Voice Recording with Browser Speech Recognition + MediaRecorder
  const startRecording = async () => {
    setErrorMsg(null);
    setTriageData(null);
    setHospitals(null);
    setExpandedHospitalId(null);
    setActiveDispatch(null);
    setLiveTranscript('');
    audioChunksRef.current = [];
    transcriptAccumulatorRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        uploadAudioAndTriage(blob, transcriptAccumulatorRef.current);
      };

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          transcriptAccumulatorRef.current = currentTranscript.trim();
          setLiveTranscript(currentTranscript.trim());
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition warning:', err);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setErrorMsg('Microphone access denied or not supported by browser.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Recognition stop note:', e);
      }
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  // Upload Audio Payload & Spoken Transcript to Java Backend
  const uploadAudioAndTriage = async (blobToSend?: Blob, transcriptText?: string) => {
    const targetBlob = blobToSend || audioBlob;
    if (!targetBlob) return;

    setLoading(true);
    setErrorMsg(null);
    setHospitals(null);
    setExpandedHospitalId(null);

    try {
      const formData = new FormData();
      formData.append('audioFile', targetBlob, 'recording.webm');
      if (transcriptText) {
        formData.append('transcript', transcriptText);
      }
      if (sceneImage) {
        formData.append('imageFile', sceneImage);
      }

      const response = await fetch(`${BACKEND_URL}/api/triage`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result: TriageResponse = await response.json();
      setTriageData(result);
      saveToHistory(result);
    } catch (err: any) {
      console.error('Failed to analyze audio:', err);
      setErrorMsg(`Failed to connect to backend server at ${BACKEND_URL}/api/triage (${err.message}).`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Text Description Handler
  const handleTextTriage = async () => {
    if (!vitalsText.trim() && !sceneImage) {
      setErrorMsg('Please enter patient vitals or upload a scene photo before analyzing.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setTriageData(null);
    setHospitals(null);
    setExpandedHospitalId(null);

    try {
      let response: Response;
      if (sceneImage) {
        const formData = new FormData();
        formData.append('vitalsText', vitalsText);
        formData.append('imageFile', sceneImage);

        response = await fetch(`${BACKEND_URL}/api/triage`, {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch(`${BACKEND_URL}/api/triage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vitalsText }),
        });
      }

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result: TriageResponse = await response.json();
      setTriageData(result);
      saveToHistory(result);
    } catch (err: any) {
      console.error('Failed to analyze text:', err);
      setErrorMsg(`Failed to connect to backend server at ${BACKEND_URL}/api/triage (${err.message}).`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Find Nearest Care (Google Maps Places API Hospital Search)
  const handleFindNearestCare = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setFetchingHospitals(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        const specialty = triageData?.category || 'Emergency Care';

        try {
          const res = await fetch(
            `${BACKEND_URL}/api/hospitals?lat=${latitude}&lng=${longitude}&specialty=${encodeURIComponent(specialty)}`,
            { headers: { 'Bypass-Tunnel-Reminder': 'true' } }
          );
          if (!res.ok) {
            throw new Error(`Hospital search failed with status ${res.status}`);
          }
          const data: Hospital[] = await res.json();
          setHospitals(data);
          if (data && data.length > 0) {
            setExpandedHospitalId(data[0].place_id);
          }
        } catch (err: any) {
          console.error('Hospital search error:', err);
          setErrorMsg(`Failed to fetch nearby hospitals: ${err.message}`);
        } finally {
          setFetchingHospitals(false);
        }
      },
      (geoErr) => {
        console.warn('Geolocation error, using fallback location:', geoErr.message);
        fetchHospitalsWithCoordinates(37.7749, -122.4194);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const fetchHospitalsWithCoordinates = async (lat: number, lng: number) => {
    setUserCoords({ lat, lng });
    const specialty = triageData?.category || 'Emergency Care';
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/hospitals?lat=${lat}&lng=${lng}&specialty=${encodeURIComponent(specialty)}`,
        { headers: { 'Bypass-Tunnel-Reminder': 'true' } }
      );
      if (res.ok) {
        const data: Hospital[] = await res.json();
        setHospitals(data);
        if (data && data.length > 0) {
          setExpandedHospitalId(data[0].place_id);
        }
      }
    } catch (err) {
      console.error('Fallback hospital fetch error:', err);
    } finally {
      setFetchingHospitals(false);
    }
  };

  const toggleHospitalExpand = (placeId: string) => {
    setExpandedHospitalId((prev) => (prev === placeId ? null : placeId));
  };

  const handleCallAmbulance = async (hospital: Hospital, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDispatch({
      hospitalName: hospital.name,
      hospitalLocation: { lat: hospital.lat, lng: hospital.lng },
    });

    if (triageData) {
      saveToHistory(triageData, hospital.name);

      // Persist live dispatch to Spring Boot backend /api/dispatch
      try {
        await fetch(`${BACKEND_URL}/api/dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hospitalId: hospital.place_id,
            hospitalName: hospital.name,
            priority: triageData.priority,
            category: triageData.category,
            summary: triageData.summary,
            mechanismOfInjury: triageData.mechanismOfInjury,
            etaMinutes: 5.0,
            status: 'IN_TRANSIT',
          }),
        });
      } catch (err) {
        console.warn('Failed to persist dispatch to Spring Boot backend:', err);
      }
    }
  };

  // Category & Priority Theme Helper
  const getThemeByPriority = (priority?: string, category?: string) => {
    const cat = category?.toLowerCase() || '';
    const isFire = cat.includes('burn') || cat.includes('smoke') || cat.includes('fire');
    const isCardiac = cat.includes('cardiac');
    const isOrtho = cat.includes('ortho') || cat.includes('fracture') || cat.includes('bone');

    let categoryIcon = Stethoscope;
    if (isFire) categoryIcon = Flame;
    else if (isCardiac) categoryIcon = Heart;
    else if (isOrtho) categoryIcon = Activity;

    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-950/90',
          border: 'border-red-500 ring-1 ring-red-500/50',
          glow: 'shadow-[0_0_25px_rgba(239,68,68,0.5)]',
          text: 'text-red-400',
          badge: 'bg-red-600 text-white font-black shadow-md',
          icon: isFire ? Flame : AlertTriangle,
          categoryIcon,
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-950/90',
          border: 'border-amber-500',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
          text: 'text-amber-400',
          badge: 'bg-amber-600 text-white font-extrabold',
          icon: isFire ? Flame : Activity,
          categoryIcon,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-950/70',
          border: 'border-yellow-600',
          glow: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]',
          text: 'text-yellow-400',
          badge: 'bg-yellow-600 text-slate-950 font-black',
          icon: Activity,
          categoryIcon,
        };
      case 'LOW':
        return {
          bg: 'bg-emerald-950/80',
          border: 'border-emerald-500',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
          text: 'text-emerald-400',
          badge: 'bg-emerald-600 text-white font-extrabold',
          icon: CheckCircle,
          categoryIcon,
        };
      default:
        return {
          bg: 'bg-slate-900',
          border: 'border-slate-700',
          glow: 'shadow-lg',
          text: 'text-slate-300',
          badge: 'bg-slate-700 text-white',
          icon: AlertTriangle,
          categoryIcon,
        };
    }
  };

  const theme = triageData ? getThemeByPriority(triageData.priority, triageData.category) : null;
  const CategoryIcon = theme?.categoryIcon ?? Stethoscope;

  return (
    <div className="min-h-screen lg:h-screen w-full bg-slate-950 text-white flex flex-col font-sans overflow-x-hidden select-none">
      {/* Top Command Navbar */}
      <Navbar
        activeTab={navTab}
        onSelectTab={(tab) => {
          setNavTab(tab);
          if (tab === 'history') setIsDrawerOpen(true);
        }}
        historyCount={historyItems.length}
      />

      {/* Case History Slide-Over Drawer */}
      <CaseHistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        historyItems={historyItems}
        onSelectRecord={handleSelectHistoryRecord}
        onClearHistory={handleClearHistory}
      />

      {/* Real-time GPS Ambulance Dispatch Modal */}
      {activeDispatch && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <Siren className="w-6 h-6 sm:w-7 sm:h-7 text-red-500 animate-pulse flex-shrink-0" />
                <div>
                  <h3 className="text-base sm:text-xl font-black text-white">Emergency Response GPS Radar Dispatch</h3>
                  <p className="text-xs text-slate-300 font-medium">Live position tracking between hospital & patient location</p>
                </div>
              </div>
              <button
                onClick={() => setActiveDispatch(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AmbulanceTrackerMap
              userLocation={userCoords}
              hospitalLocation={activeDispatch.hospitalLocation}
              hospitalName={activeDispatch.hospitalName}
            />

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveDispatch(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all border border-slate-700"
              >
                Close Radar View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Command Grid Layout (Stacked on Mobile, 3-Col on Desktop) */}
      <div className="flex-1 max-w-[1800px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[calc(100vh-3.5rem)] overflow-y-auto lg:overflow-hidden">
        {/* =================================================== */}
        {/* LEFT COLUMN (1/3 Width): AI Triage & Voice / Text Input */}
        {/* =================================================== */}
        <section className="lg:col-span-1 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto pr-0 lg:pr-1 space-y-5 flex flex-col scrollbar-thin scrollbar-thumb-slate-800">
          <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between flex-shrink-0">
            <h2 className="text-base font-black flex items-center space-x-2 text-white uppercase tracking-wider">
              <Mic className="w-4 h-4 text-red-500" />
              <span>AI Emergency Input & Triage</span>
            </h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-slate-900 border border-slate-700 text-slate-200 rounded">
              INPUT STATION 1
            </span>
          </div>

          {/* Mode Selector Tabs (Neutral Dark Gray Theme) */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-full flex-shrink-0">
            <button
              onClick={() => { setInputTab('mic'); setErrorMsg(null); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
                inputTab === 'mic' ? 'bg-slate-800 text-white border border-slate-700 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4 text-red-500" />
              <span>Voice Mic Input</span>
            </button>
            <button
              onClick={() => { setInputTab('text'); setErrorMsg(null); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
                inputTab === 'text' ? 'bg-slate-800 text-white border border-slate-700 shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-200" />
              <span>Text Description</span>
            </button>
          </div>

          {/* Task 1 & 2: Primary RED Record Button & High-Legibility Subtext */}
          {inputTab === 'mic' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col items-center text-center shadow-xl flex-shrink-0">
              <p className="text-xs text-slate-200 font-semibold mb-5 leading-relaxed">
                Press <strong className="text-white font-extrabold underline underline-offset-2">Start Recording</strong> and dictate paramedic vitals into microphone.
              </p>

              <div className="flex items-center justify-center w-full mb-3">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-3 py-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-base transition-all duration-300 shadow-[0_0_25px_rgba(220,38,38,0.4)] disabled:opacity-50"
                  >
                    <Mic className="w-5 h-5 animate-pulse" />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="w-full flex items-center justify-center space-x-3 py-4 rounded-xl bg-red-700 hover:bg-red-800 active:scale-95 text-white font-black text-base transition-all duration-300 ring-4 ring-red-500/50 animate-pulse shadow-[0_0_35px_rgba(220,38,38,0.6)]"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    <span>Stop & Analyze Voice</span>
                  </button>
                )}
              </div>

              {isRecording && (
                <div className="w-full mt-2 flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-2 text-red-400 font-extrabold text-xs animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span>Listening to paramedic voice input...</span>
                  </div>
                  {liveTranscript && (
                    <div className="w-full bg-black/60 border border-slate-800 p-3 rounded-xl text-xs text-slate-200 italic text-left">
                      <span className="font-bold text-slate-300 not-italic block mb-1">Live Voice Speech:</span>
                      "{liveTranscript}"
                    </div>
                  )}
                </div>
              )}

              {audioUrl && !isRecording && (
                <div className="mt-3 w-full flex flex-col items-center space-y-2">
                  <audio src={audioUrl} controls className="w-full h-9 rounded-lg bg-slate-800" />
                  <button
                    onClick={() => uploadAudioAndTriage(undefined, liveTranscript)}
                    disabled={loading}
                    className="flex items-center space-x-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    <span>Re-send Audio & Voice Transcript</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Input Station B: Text Description */}
          {inputTab === 'text' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-3 shadow-xl flex-shrink-0">
              <label className="block text-xs font-extrabold uppercase text-slate-300 tracking-wider">
                Patient Vitals & Incident Description
              </label>
              <textarea
                value={vitalsText}
                onChange={(e) => setVitalsText(e.target.value)}
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-slate-600 transition-colors resize-none text-sm placeholder:text-slate-500 font-medium"
                placeholder="e.g. Railway collision with 10 critical casualties, severe trauma, open fractures..."
              />
              <button
                onClick={handleTextTriage}
                disabled={loading || !vitalsText.trim()}
                className="flex items-center justify-center space-x-2 w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm transition-all border border-slate-700 shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Analyze Incident Text with AI</span>
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col items-center text-center space-y-3 shadow-lg flex-shrink-0 animate-fadeIn">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              <div>
                <h3 className="text-base font-black text-white">Analyzing Triage Data (Native Language Translation)...</h3>
                <p className="text-xs text-slate-300 font-medium mt-1">Detecting regional language & converting to standardized clinical English</p>
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="bg-red-950/60 border border-red-800 text-red-300 p-4 rounded-xl flex items-center space-x-3 text-xs flex-shrink-0 shadow-md">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* AI Clinical Triage Output Card */}
          {triageData && theme && !loading && (
            <div
              className={`w-full border rounded-2xl p-5 transition-all duration-500 transform scale-100 animate-fadeIn ${theme.bg} ${theme.border} ${theme.glow} flex-shrink-0`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                <div className="flex items-center space-x-2">
                  <CategoryIcon className={`w-6 h-6 ${theme.text}`} />
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${theme.badge}`}>
                    Priority: {triageData.priority}
                  </span>
                </div>
                {triageData.confidence_score !== undefined && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">AI Confidence</span>
                    <p className="text-sm font-black text-emerald-400">
                      {(triageData.confidence_score * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Triage Medical Category</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <CategoryIcon className={`w-4 h-4 ${theme.text}`} />
                    <p className="text-lg font-black text-white">{triageData.category}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Clinical Summary</p>
                  <p className="text-xs text-slate-100 mt-1 bg-black/60 p-3 rounded-xl border border-slate-800 leading-relaxed font-medium">
                    {triageData.summary}
                  </p>
                </div>

                {/* Mechanism of Injury (Vision Analysis) Section */}
                {triageData.mechanismOfInjury && (
                  <div>
                    <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Mechanism of Injury (Vision Analysis)</span>
                    </div>
                    <p className="text-xs text-slate-100 mt-1 bg-black/70 p-3 rounded-xl border border-slate-800/90 leading-relaxed font-medium">
                      {triageData.mechanismOfInjury}
                    </p>
                  </div>
                )}

                {/* Find Nearest Care Button (Prominent GREEN Medical Button) */}
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    onClick={handleFindNearestCare}
                    disabled={fetchingHospitals}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50"
                  >
                    {fetchingHospitals ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Locating Hospitals via Google Places...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        <span>Find Nearest Care ({triageData.category})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* =================================================== */}
        {/* RIGHT COLUMN (2/3 Width): Hospital Command Dashboard */}
        {/* =================================================== */}
        <section className="lg:col-span-2 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto pl-0 lg:pl-1 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
            <h2 className="text-base font-black flex items-center space-x-2 text-white uppercase tracking-wider">
              <HospitalIcon className="w-4 h-4 text-emerald-400" />
              <span>National Hospital Command & Dispatch Matrix</span>
            </h2>
            {hospitals && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                {hospitals.length} Hospitals Loaded
              </span>
            )}
          </div>

          {/* If no hospital list fetched yet: Display Command Dashboard Overview */}
          {!hospitals && (
            <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center h-[520px] space-y-5">
              <div className="p-4 rounded-full bg-slate-950 border border-slate-800 text-slate-300 shadow-inner">
                <Radio className="w-12 h-12 text-emerald-400 animate-pulse" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-extrabold text-white">Emergency Command Standby</h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Record paramedic voice input or enter patient incident vitals on the left panel to execute instant AI clinical triage and locate nearby emergency care facilities with live bed & ambulance status.
                </p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-bold text-slate-300 pt-2">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>Critical Care</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Delayed Care</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Available Beds</span>
                </div>
              </div>
            </div>
          )}

          {/* Nearby Hospital Facilities Accordion List */}
          {hospitals && hospitals.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {hospitals.map((hospital) => {
                  const isExpanded = expandedHospitalId === hospital.place_id;
                  const isTopBeds = hospital.isMostBeds;
                  const hasBeds = hospital.availableBeds > 0;

                  return (
                    <div
                      key={hospital.place_id}
                      onClick={() => toggleHospitalExpand(hospital.place_id)}
                      className={`relative rounded-2xl p-5 border cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg ${
                        isExpanded
                          ? 'bg-slate-900 border-slate-700 ring-2 ring-slate-700/50 shadow-xl'
                          : isTopBeds
                          ? 'bg-emerald-950/30 border-emerald-500/80 hover:border-emerald-400'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Badge for Most Beds */}
                      {isTopBeds && (
                        <div className="absolute -top-3 right-6 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-3 py-0.5 rounded-full flex items-center space-x-1 shadow-md z-10">
                          <Award className="w-3.5 h-3.5" />
                          <span>MOST BEDS AVAILABLE</span>
                        </div>
                      )}

                      {/* Header Row: Clickable Accordion Summary */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-base font-black text-white flex items-center space-x-2 hover:text-emerald-400 transition-colors">
                            <span>{hospital.name}</span>
                          </h4>
                          <p className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>{hospital.distance_km} km away</span>
                          </p>
                        </div>

                        <div className="flex items-center space-x-3 flex-shrink-0">
                          {/* Quick Bed Availability Badge */}
                          <span
                            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1.5 border ${
                              hasBeds
                                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                                : 'bg-red-950/90 border-red-500 text-red-300'
                            }`}
                          >
                            <BedDouble className="w-3.5 h-3.5" />
                            <span>{hospital.availableBeds} Beds Available</span>
                          </span>

                          {/* Accordion Indicator */}
                          <div className="p-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Task 3 & 1: Expanded Accordion Content with Refined Sleek Pill Badges & Deep Warning Action Button */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3.5 animate-fadeIn transition-all duration-300">
                          {/* Location Address Details */}
                          <div className="bg-black/50 p-3.5 rounded-xl border border-slate-800 space-y-1">
                            <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Hospital Vicinity & Location Address</span>
                            </div>
                            <p className="text-xs font-bold text-slate-100">
                              {hospital.address || 'Address available upon dispatch.'}
                            </p>
                          </div>

                          {/* Task 3: Sleek Compact Side-by-Side Horizontal Pill Badges */}
                          <div className="flex items-center justify-between gap-3 bg-black/40 p-3 rounded-xl border border-slate-800/90">
                            {/* Sleek Pill Badge 1: Bed Availability */}
                            <div className={`px-3.5 py-2 rounded-lg border font-bold text-xs flex items-center space-x-2 flex-1 justify-between ${
                              hasBeds
                                ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                                : 'bg-red-950/60 border-red-500/80 text-red-200'
                            }`}>
                              <div className="flex items-center space-x-2">
                                <BedDouble className={`w-4 h-4 ${hasBeds ? 'text-emerald-400' : 'text-red-400'}`} />
                                <span className="text-slate-200 font-bold text-xs">Bed Availability</span>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-md font-black text-xs border ${
                                hasBeds 
                                  ? 'bg-emerald-600 text-white border-emerald-400' 
                                  : 'bg-red-600 text-white border-red-400'
                              }`}>
                                {hospital.availableBeds} {hasBeds ? 'Beds' : 'Full'}
                              </span>
                            </div>

                            {/* Sleek Pill Badge 2: Ready Ambulances */}
                            <div className="px-3.5 py-2 rounded-lg border border-slate-800 bg-slate-950 font-bold text-xs flex items-center space-x-2 flex-1 justify-between">
                              <div className="flex items-center space-x-2">
                                <Truck className="w-4 h-4 text-amber-400" />
                                <span className="text-slate-200 font-bold text-xs">Ready Ambulances</span>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-md font-black text-xs bg-amber-600 text-white border border-amber-400">
                                {hospital.availableAmbulances} Standby
                              </span>
                            </div>
                          </div>

                          {/* Task 1: Non-Competing Deep Amber Warning Dispatch Button (Turns Red ONLY on Hover) */}
                          <div className="pt-1">
                            <button
                              onClick={(e) => handleCallAmbulance(hospital, e)}
                              className="w-full py-3.5 px-6 rounded-xl bg-amber-700 hover:bg-red-600 active:scale-95 text-white font-extrabold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(180,83,9,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] flex items-center justify-center space-x-2.5 tracking-wide"
                            >
                              <PhoneCall className="w-4 h-4 animate-pulse" />
                              <span>Call Ambulance Right Now</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}