import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';

export const Qibla = () => {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Mecca coordinates
  const meccaLat = 21.4225;
  const meccaLng = 39.8262;

  // Calculate Qibla direction
  const calculateQiblaDirection = (userLat: number, userLng: number) => {
    const lat1 = (userLat * Math.PI) / 180;
    const lat2 = (meccaLat * Math.PI) / 180;
    const deltaLng = ((meccaLng - userLng) * Math.PI) / 180;

    const y = Math.sin(deltaLng);
    const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(deltaLng);
    
    let qibla = (Math.atan2(y, x) * 180) / Math.PI;
    qibla = (qibla + 360) % 360;
    
    return qibla;
  };

  // Get user location
  const getUserLocation = () => {
    setIsCalibrating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          const direction = calculateQiblaDirection(latitude, longitude);
          setQiblaDirection(direction);
          setIsCalibrating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Mumbai, India for demo
          setUserLocation({ lat: 19.0760, lng: 72.8777 });
          const direction = calculateQiblaDirection(19.0760, 72.8777);
          setQiblaDirection(direction);
          setIsCalibrating(false);
        }
      );
    }
  };

  // Device orientation (simplified for demo)
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setDeviceHeading(event.alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, []);

  useEffect(() => {
    getUserLocation();
  }, []);

  const compassDirection = qiblaDirection - deviceHeading;

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary mb-2">Qibla Direction</h1>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              {userLocation ? `${userLocation.lat.toFixed(2)}, ${userLocation.lng.toFixed(2)}` : 'Getting location...'}
            </span>
          </div>
        </div>

        {/* Compass Card */}
        <Card className="p-8 rounded-3xl bg-secondary/30">
          <div className="relative w-80 h-80 mx-auto">
            {/* Outer compass ring */}
            <div className="absolute inset-0 border-4 border-primary/30 rounded-full">
              {/* Compass markings */}
              {[...Array(36)].map((_, i) => {
                const angle = i * 10;
                const isCardinal = angle % 90 === 0;
                const isMainDirection = angle % 30 === 0;
                
                return (
                  <div
                    key={i}
                    className="absolute w-0.5 bg-primary/50"
                    style={{
                      height: isCardinal ? '20px' : isMainDirection ? '15px' : '10px',
                      left: '50%',
                      top: isCardinal ? '8px' : isMainDirection ? '12px' : '15px',
                      transformOrigin: 'bottom center',
                      transform: `translateX(-50%) rotate(${angle}deg)`
                    }}
                  />
                );
              })}
              
              {/* Cardinal directions */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-primary font-bold text-lg">N</div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-primary font-bold text-lg">S</div>
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-primary font-bold text-lg">W</div>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary font-bold text-lg">E</div>
            </div>

            {/* Inner compass */}
            <div className="absolute inset-8 border-2 border-primary/20 rounded-full bg-card">
              {/* Qibla direction pointer */}
              <div
                className="absolute w-1 bg-primary rounded-full transition-transform duration-500"
                style={{
                  height: '120px',
                  left: '50%',
                  top: '20px',
                  transformOrigin: 'bottom center',
                  transform: `translateX(-50%) rotate(${compassDirection}deg)`
                }}
              >
                {/* Arrow head */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-primary"></div>
                </div>
              </div>

              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Navigation className="h-4 w-4 text-primary-foreground" />
              </div>

              {/* Kaaba symbol */}
              <div
                className="absolute w-6 h-6 transition-transform duration-500"
                style={{
                  left: 'calc(50% - 12px)',
                  top: '30px',
                  transformOrigin: 'center 110px',
                  transform: `rotate(${compassDirection}deg)`
                }}
              >
                <div className="w-6 h-6 bg-foreground rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Direction Info */}
        <Card className="p-4 rounded-2xl bg-primary text-primary-foreground">
          <div className="text-center">
            <h3 className="font-bold text-lg mb-2">QIBLA DIRECTION</h3>
            <p className="text-2xl font-bold">{Math.round(qiblaDirection)}°</p>
            <p className="text-sm opacity-90 mt-1">
              Point your device towards Mecca
            </p>
          </div>
        </Card>

        {/* Calibrate Button */}
        <Button 
          onClick={getUserLocation}
          disabled={isCalibrating}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl py-3"
        >
          {isCalibrating ? 'Calibrating...' : 'Recalibrate Location'}
        </Button>

        {/* Instructions */}
        <Card className="p-4 rounded-2xl bg-card">
          <h3 className="font-semibold text-primary mb-2">How to use:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Hold your phone flat and horizontal</li>
            <li>• The green arrow points to Qibla direction</li>
            <li>• Rotate yourself until the arrow points straight up</li>
            <li>• The black square represents the Kaaba</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
};
