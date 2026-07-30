'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AmbulanceTrackerMapProps {
  userLocation: { lat: number; lng: number };
  hospitalLocation: { lat: number; lng: number };
  hospitalName: string;
}

// Custom Leaflet DivIcons to prevent default asset missing issues in Next.js
const hospitalIcon = L.divIcon({
  className: 'custom-hospital-icon',
  html: `<div style="background-color: #059669; color: white; border: 2px solid white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">🏥</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const userIcon = L.divIcon({
  className: 'custom-user-icon',
  html: `<div style="background-color: #10b981; color: white; border: 2px solid white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">📍</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const ambulanceIcon = L.divIcon({
  className: 'custom-ambulance-icon',
  html: `<div style="background-color: #dc2626; color: white; border: 2px solid #fef08a; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 0 20px rgba(220,38,38,0.8); animation: pulse 1s infinite alternate;">🚑</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// Component to dynamically fit map bounds to show both hospital & user location
function RecenterMap({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, bounds]);
  return null;
}

export default function AmbulanceTrackerMap({
  userLocation,
  hospitalLocation,
  hospitalName,
}: AmbulanceTrackerMapProps) {
  // Generate interpolated path steps between hospital and user
  const TOTAL_STEPS = 60; // 60 steps for simulated driving movement
  const pathSteps = useMemo(() => {
    const steps: { lat: number; lng: number }[] = [];
    for (let i = 0; i <= TOTAL_STEPS; i++) {
      const t = i / TOTAL_STEPS;
      // Add slight curved variation to simulate real road curvature
      const latCurve = Math.sin(t * Math.PI) * 0.002;
      const lngCurve = Math.cos(t * Math.PI) * 0.002;
      const lat = hospitalLocation.lat + (userLocation.lat - hospitalLocation.lat) * t + latCurve;
      const lng = hospitalLocation.lng + (userLocation.lng - hospitalLocation.lng) * t + lngCurve;
      steps.push({ lat, lng });
    }
    return steps;
  }, [hospitalLocation, userLocation]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [etaMinutes, setEtaMinutes] = useState(5.0);

  // Simulated GPS movement timer
  useEffect(() => {
    setCurrentStepIndex(0);
    setEtaMinutes(5.0);

    const interval = setInterval(() => {
      setCurrentStepIndex((prevIndex) => {
        if (prevIndex >= pathSteps.length - 1) {
          clearInterval(interval);
          setEtaMinutes(0);
          return prevIndex;
        }
        const nextIndex = prevIndex + 1;
        const remainingFraction = 1 - nextIndex / pathSteps.length;
        setEtaMinutes(Math.max(0, +(remainingFraction * 5.0).toFixed(1)));
        return nextIndex;
      });
    }, 1000); // Step every 1 second

    return () => clearInterval(interval);
  }, [pathSteps]);

  const ambulancePosition = pathSteps[currentStepIndex] || hospitalLocation;

  // Center calculation
  const centerLat = (userLocation.lat + hospitalLocation.lat) / 2;
  const centerLng = (userLocation.lng + hospitalLocation.lng) / 2;
  const bounds: L.LatLngBoundsExpression = [
    [userLocation.lat, userLocation.lng],
    [hospitalLocation.lat, hospitalLocation.lng],
  ];

  const fullPathCoordinates: [number, number][] = pathSteps.map((p) => [p.lat, p.lng]);
  const drivenPathCoordinates: [number, number][] = pathSteps
    .slice(0, currentStepIndex + 1)
    .map((p) => [p.lat, p.lng]);

  const isArrived = currentStepIndex >= pathSteps.length - 1 || etaMinutes === 0;

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Prominent Text Overlay / Dispatch Status Bar */}
      <div className="bg-gradient-to-r from-red-950 via-zinc-900 to-red-950 border border-red-500/60 p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-3 text-white">
        <div className="flex items-center space-x-3">
          <span className="w-4 h-4 rounded-full bg-red-500 animate-ping flex-shrink-0"></span>
          <div>
            <p className="text-xs uppercase font-extrabold tracking-wider text-red-400">
              {isArrived ? '🚑 Ambulance Arrived' : '🚨 Real-Time GPS Ambulance Dispatch'}
            </p>
            <h4 className="text-base font-bold text-white">
              Ambulance dispatched from <span className="text-emerald-400 font-extrabold">{hospitalName}</span>
            </h4>
          </div>
        </div>

        <div className="bg-black/60 border border-red-500/80 px-4 py-2 rounded-xl text-center flex-shrink-0">
          <span className="text-[10px] block text-zinc-400 uppercase tracking-widest font-bold">Estimated Time of Arrival</span>
          <span className="text-xl font-black text-yellow-300">
            {isArrived ? 'ARRIVED NOW' : `${etaMinutes.toFixed(1)} mins`}
          </span>
        </div>
      </div>

      {/* Map Rendering Container */}
      <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl z-0">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <RecenterMap bounds={bounds} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Planned Route Line */}
          <Polyline
            positions={fullPathCoordinates}
            pathOptions={{ color: '#64748b', weight: 4, dashArray: '8, 8', opacity: 0.7 }}
          />

          {/* Driven Route Line */}
          <Polyline
            positions={drivenPathCoordinates}
            pathOptions={{ color: '#ef4444', weight: 6, opacity: 0.9 }}
          />

          {/* Static Marker 1: Hospital Location */}
          <Marker position={[hospitalLocation.lat, hospitalLocation.lng]} icon={hospitalIcon}>
            <Popup>
              <div className="text-black font-bold">
                🏥 <strong>{hospitalName}</strong>
                <br />
                Dispatch Origin
              </div>
            </Popup>
          </Marker>

          {/* Static Marker 2: User / Incident Location */}
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-black font-bold">
                📍 <strong>Patient Location</strong>
                <br />
                Emergency Destination
              </div>
            </Popup>
          </Marker>

          {/* Moving Marker 3: Ambulance Position */}
          <Marker position={[ambulancePosition.lat, ambulancePosition.lng]} icon={ambulanceIcon}>
            <Popup>
              <div className="text-black font-bold">
                🚑 <strong>Emergency Response Unit</strong>
                <br />
                {isArrived ? 'Arrived at destination!' : `En route — ETA ${etaMinutes.toFixed(1)} min`}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
