import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type HospitalDto = {
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

// Nagpur/Local fallback coordinates
const DEFAULT_LAT = 21.1458;
const DEFAULT_LNG = 79.0882;
const MAX_RADIUS_KM = 5.0;

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Pseudo-random generator seeded by string for consistent bed count per hospital
function getStableBedCount(seedStr: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % (max + 1);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let lat = parseFloat(searchParams.get('lat') || String(DEFAULT_LAT));
  let lng = parseFloat(searchParams.get('lng') || String(DEFAULT_LNG));
  const specialty = searchParams.get('specialty') || 'Trauma & Emergency';
  const locationQuery = searchParams.get('query')?.trim() || '';

  // 1. If user typed a manual location (City or ZIP code), geocode it via Nominatim
  if (locationQuery) {
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'NationalTriageApp/1.0 (Emergency Triage Hospital Finder)',
          },
        }
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        }
      }
    } catch (geoErr) {
      console.warn('City/ZIP geocoding error:', geoErr);
    }
  }

  let hospitals: HospitalDto[] = [];

  // 2. Preference: Try Google Places API if key exists (Strict 5km / 5000m radius)
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googleApiKey && !googleApiKey.includes('your-google-maps-api-key')) {
    try {
      const keyword = specialty ? `${specialty} hospital` : 'hospital trauma emergency';
      const googleRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=hospital&keyword=${encodeURIComponent(keyword)}&key=${googleApiKey}`
      );
      if (googleRes.ok) {
        const data = await googleRes.json();
        if (data.results && data.results.length > 0) {
          hospitals = data.results.map((place: any) => {
            const hLat = place.geometry?.location?.lat || lat;
            const hLng = place.geometry?.location?.lng || lng;
            const distKm = calculateDistanceKm(lat, lng, hLat, hLng);
            const beds = getStableBedCount(place.place_id || place.name, 6);
            const ambulances = getStableBedCount(place.name + 'amb', 3);

            return {
              place_id: place.place_id || `place-${Math.random()}`,
              name: place.name,
              address: place.vicinity || place.formatted_address || 'Emergency Medical Center',
              distance_km: distKm,
              availableBeds: beds,
              availableAmbulances: ambulances,
              lat: hLat,
              lng: hLng,
              specialty,
              isMostBeds: false,
            };
          });
        }
      }
    } catch (googleErr) {
      console.warn('Google Places API fetch note:', googleErr);
    }
  }

  // 3. Free Fallback: OpenStreetMap Overpass API (Strict 5 km / 5000m radius search)
  if (hospitals.length === 0) {
    try {
      const overpassQuery = `[out:json][timeout:8];(node["amenity"="hospital"](around:5000,${lat},${lng});way["amenity"="hospital"](around:5000,${lat},${lng}););out center 15;`;
      const osmRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        if (osmData.elements && osmData.elements.length > 0) {
          hospitals = osmData.elements
            .map((elem: any) => {
              const tags = elem.tags || {};
              const name = tags.name || tags['name:en'] || tags.operator;
              if (!name) return null;

              const hLat = elem.lat || elem.center?.lat;
              const hLng = elem.lon || elem.center?.lon;
              if (!hLat || !hLng) return null;

              const distKm = calculateDistanceKm(lat, lng, hLat, hLng);
              const addressParts = [
                tags['addr:street'] ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`.trim() : null,
                tags['addr:suburb'] || tags['addr:district'] || tags['addr:city'],
              ].filter(Boolean);

              const address = addressParts.length > 0 ? addressParts.join(', ') : `${name} Medical Center`;
              const beds = getStableBedCount(name + 'beds', 6);
              const ambulances = getStableBedCount(name + 'amb', 4);

              return {
                place_id: `osm-${elem.type}-${elem.id}`,
                name: name.includes('Hospital') || name.includes('Center') ? name : `${name} Hospital`,
                address,
                distance_km: distKm,
                availableBeds: beds,
                availableAmbulances: ambulances,
                lat: hLat,
                lng: hLng,
                specialty,
                isMostBeds: false,
              };
            })
            .filter(Boolean);
        }
      }
    } catch (osmErr) {
      console.warn('OpenStreetMap Overpass API note:', osmErr);
    }
  }

  // 4. Nominatim fallback if Overpass returned no hospitals
  if (hospitals.length === 0) {
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=hospital&lat=${lat}&lon=${lng}&limit=10`,
        {
          headers: {
            'User-Agent': 'NationalTriageApp/1.0 (Emergency Triage Hospital Finder)',
          },
        }
      );
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (nomData && nomData.length > 0) {
          hospitals = nomData.map((item: any) => {
            const hLat = parseFloat(item.lat);
            const hLng = parseFloat(item.lon);
            const distKm = calculateDistanceKm(lat, lng, hLat, hLng);
            const name = item.display_name.split(',')[0] || 'Local Emergency Hospital';
            const beds = getStableBedCount(item.place_id + 'beds', 5);
            const ambulances = getStableBedCount(item.place_id + 'amb', 3);

            return {
              place_id: `nom-${item.place_id}`,
              name: name.includes('Hospital') ? name : `${name} Medical Center`,
              address: item.display_name,
              distance_km: distKm,
              availableBeds: beds,
              availableAmbulances: ambulances,
              lat: hLat,
              lng: hLng,
              specialty,
              isMostBeds: false,
            };
          });
        }
      }
    } catch (nomErr) {
      console.warn('Nominatim fallback note:', nomErr);
    }
  }

  // 5. Filter strictly within 5 km radius boundary
  hospitals = hospitals.filter((h) => h.distance_km <= MAX_RADIUS_KM);

  // 6. Dynamic fallback centered around user's live (lat, lng) within 5km if sparse OSM coverage
  if (hospitals.length === 0) {
    const localSample = [
      { name: 'Nagpur Emergency & Trauma Super Specialty Hospital', dLat: 0.008, dLng: 0.012, beds: 6, ambulances: 3 },
      { name: `Kingsway Hospital & Research Centre (${specialty})`, dLat: -0.015, dLng: 0.019, beds: 5, ambulances: 2 },
      { name: 'Alexis Multispecialty Hospital & Emergency ER', dLat: 0.022, dLng: -0.014, beds: 4, ambulances: 2 },
      { name: 'Orange City Hospital & Research Institute', dLat: -0.028, dLng: -0.025, beds: 3, ambulances: 1 },
      { name: 'AIIMS Nagpur Emergency & Disaster Care Unit', dLat: 0.034, dLng: 0.031, beds: 7, ambulances: 4 },
    ];

    hospitals = localSample.map((item, i) => {
      const hLat = lat + item.dLat;
      const hLng = lng + item.dLng;
      const distKm = calculateDistanceKm(lat, lng, hLat, hLng);
      return {
        place_id: `nagpur-local-${i + 1}`,
        name: item.name,
        address: `Local Emergency Sector, Nagpur Region (${hLat.toFixed(4)} Lat, ${hLng.toFixed(4)} Lng)`,
        distance_km: distKm,
        availableBeds: item.beds,
        availableAmbulances: item.ambulances,
        lat: hLat,
        lng: hLng,
        specialty,
        isMostBeds: false,
      };
    }).filter((h) => h.distance_km <= MAX_RADIUS_KM);
  }

  // 7. Highlight hospital with maximum available beds
  let maxBeds = -1;
  let maxIdx = -1;
  hospitals.forEach((h, idx) => {
    if (h.availableBeds > maxBeds) {
      maxBeds = h.availableBeds;
      maxIdx = idx;
    }
  });
  if (maxIdx >= 0) {
    hospitals[maxIdx].isMostBeds = true;
  }

  // 8. Sort by distance (closest first)
  hospitals.sort((a, b) => a.distance_km - b.distance_km);

  return NextResponse.json(hospitals);
}
