import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { toast } from 'sonner';

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  fullAddress: string;
  isManual?: boolean;
}

interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  setManualLocation: (lat: number, lon: number) => Promise<void>;
  clearManualLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_CACHE_KEY = 'barakah_cached_location';
const MANUAL_LOCATION_KEY = 'barakah_manual_location';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for fresher data

const normalizeLocation = (value: unknown): LocationData | null => {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Partial<LocationData> & {
    lat?: number | string;
    lon?: number | string;
    lng?: number | string;
  };
  const latitude = Number(raw.latitude ?? raw.lat);
  const longitude = Number(raw.longitude ?? raw.lon ?? raw.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    latitude,
    longitude,
    city: raw.city || 'Unknown',
    country: raw.country || 'Unknown',
    fullAddress: raw.fullAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    isManual: raw.isManual,
  };
};

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeRequestRef = useRef(0);

  const getCachedLocation = (): LocationData | null => {
    try {
      // First check for manual location
      const manual = localStorage.getItem(MANUAL_LOCATION_KEY);
      if (manual) {
        const parsed = normalizeLocation(JSON.parse(manual));
        if (parsed) return parsed;
        localStorage.removeItem(MANUAL_LOCATION_KEY);
      }
      
      const cached = localStorage.getItem(LOCATION_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const parsed = normalizeLocation(data);
        if (parsed && Date.now() - timestamp < CACHE_DURATION) {
          return parsed;
        }
        localStorage.removeItem(LOCATION_CACHE_KEY);
      }
    } catch {
      // Ignore cache errors
    }
    return null;
  };

  const cacheLocation = (data: LocationData) => {
    try {
      if (data.isManual) {
        localStorage.setItem(MANUAL_LOCATION_KEY, JSON.stringify(data));
      } else {
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      }
    } catch {
      // Ignore cache errors
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<Partial<LocationData>> => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch location details');
      }

      const data = await response.json();
      
      return {
        city: data.city || data.locality || data.principalSubdivision || 'Unknown',
        country: data.countryName || 'Unknown',
        fullAddress: [
          data.locality,
          data.city,
          data.principalSubdivision,
          data.countryName
        ].filter(Boolean).join(', ')
      };
    } catch {
      return {
        city: 'Unknown',
        country: 'Unknown',
        fullAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      };
    }
  };

  const setManualLocation = async (lat: number, lon: number) => {
    setLoading(true);
    const geoData = await reverseGeocode(lat, lon);
    
    const locationData: LocationData = {
      latitude: lat,
      longitude: lon,
      city: geoData.city || 'Unknown',
      country: geoData.country || 'Unknown',
      fullAddress: geoData.fullAddress || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      isManual: true
    };

    setLocation(locationData);
    cacheLocation(locationData);
    setLoading(false);
    toast.success(`Location set to ${locationData.city}, ${locationData.country}`);
  };

  const clearManualLocation = () => {
    localStorage.removeItem(MANUAL_LOCATION_KEY);
    fetchLocation();
  };

  const getDevicePosition = async (): Promise<GeolocationPosition | import('@capacitor/geolocation').Position> => {
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    };

    if (Capacitor.isNativePlatform()) {
      const permission = await Geolocation.checkPermissions();
      if (permission.location === 'denied') {
        throw new Error('Location access denied. Please enable location permissions.');
      }
      if (permission.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted') {
          throw new Error('Location access denied. Please enable location permissions.');
        }
      }

      return Geolocation.getCurrentPosition(options);
    }

    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  const fetchLocation = useCallback(async () => {
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;
    setLoading(true);
    setError(null);

    // Check for manual location first
    const manualLocation = localStorage.getItem(MANUAL_LOCATION_KEY);
    if (manualLocation) {
      const parsed = normalizeLocation(JSON.parse(manualLocation));
      if (parsed) {
        if (requestId !== activeRequestRef.current) return;
        setLocation(parsed);
        setLoading(false);
        return;
      }
      localStorage.removeItem(MANUAL_LOCATION_KEY);
    }

    // Check cache
    const cached = getCachedLocation();
    if (cached && !cached.isManual) {
      if (requestId !== activeRequestRef.current) return;
      setLocation(cached);
      setLoading(false);
      return;
    }

    try {
      const position = await getDevicePosition();
      if (requestId !== activeRequestRef.current) return;

      const { latitude, longitude, accuracy } = position.coords;
      console.log(`Location accuracy: ${accuracy} meters`);

      const geoData = await reverseGeocode(latitude, longitude);
      if (requestId !== activeRequestRef.current) return;
      
      const locationData: LocationData = {
        latitude,
        longitude,
        city: geoData.city || 'Unknown',
        country: geoData.country || 'Unknown',
        fullAddress: geoData.fullAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        isManual: false
      };

      setLocation(locationData);
      cacheLocation(locationData);
      setError(null);
    } catch (err) {
      if (requestId !== activeRequestRef.current) return;

      let errorMessage = err instanceof Error ? err.message : 'Unable to get your location';
      const code = typeof err === 'object' && err !== null && 'code' in err ? (err as { code?: number | string }).code : undefined;
      
      switch (code) {
        case 1:
        case 'PERMISSION_DENIED':
        case 'OS-PLUG-GLOC-0003':
          errorMessage = 'Location access denied. Please enable location permissions.';
          break;
        case 2:
        case 'POSITION_UNAVAILABLE':
          errorMessage = 'Location information unavailable. Please try again.';
          break;
        case 3:
        case 'TIMEOUT':
          errorMessage = 'Location request timed out. Please try again.';
          break;
      }

      setError(errorMessage);
      
      // Try to use any cached location as fallback
      const fallback = getCachedLocation();
      if (fallback) {
        setLocation(fallback);
      }
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return (
    <LocationContext.Provider value={{
      location,
      loading,
      error,
      refresh: fetchLocation,
      setManualLocation,
      clearManualLocation
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useGlobalLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useGlobalLocation must be used within a LocationProvider');
  }
  return context;
};
