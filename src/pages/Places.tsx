import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navigation, Search, MapPin, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLocation } from '@/hooks/useLocation';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Mosque {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance?: number;
  address?: string;
}

export const Places = () => {
  const { location: userLocation, loading: locationLoading, error: locationError, refresh: refreshLocation } = useLocation();
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Find nearby mosques using Overpass API
  const findNearbyMosques = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const radius = 10000; // 10km radius for better results
      const overpassQuery = `
        [out:json][timeout:30];
        (
          node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
          node["building"="mosque"](around:${radius},${lat},${lon});
          way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
          way["building"="mosque"](around:${radius},${lat},${lon});
          relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
        );
        out center;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.elements || data.elements.length === 0) {
        setMosques([]);
        toast.info('No mosques found in your area. Try expanding your search.');
        return;
      }
      
      const mosquesList: Mosque[] = data.elements
        .map((element: any) => {
          const elLat = element.lat || element.center?.lat;
          const elLon = element.lon || element.center?.lon;
          
          if (!elLat || !elLon) return null;
          
          const distance = calculateDistance(lat, lon, elLat, elLon);
          
          return {
            id: element.id.toString(),
            name: element.tags?.name || element.tags?.['name:en'] || element.tags?.['name:ar'] || 'Mosque',
            lat: elLat,
            lon: elLon,
            distance,
            address: element.tags?.['addr:full'] || element.tags?.['addr:street'] || element.tags?.['addr:city'] || 'Address not available',
          };
        })
        .filter((mosque: Mosque | null): mosque is Mosque => mosque !== null)
        .sort((a: Mosque, b: Mosque) => (a.distance || 0) - (b.distance || 0));

      setMosques(mosquesList);
      
      if (mosquesList.length > 0) {
        toast.success(`Found ${mosquesList.length} mosque${mosquesList.length > 1 ? 's' : ''} nearby`);
      } else {
        toast.info('No mosques found in your area.');
      }
    } catch (error) {
      console.error('Error finding mosques:', error);
      toast.error('Failed to find nearby mosques. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch mosques when location is available
  useEffect(() => {
    if (userLocation && !locationLoading) {
      findNearbyMosques(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation, locationLoading]);

  // Filter mosques based on search query
  const filteredMosques = mosques.filter(mosque =>
    mosque.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open directions in Google Maps
  const openDirections = (mosque: Mosque) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lon}`;
    window.open(url, '_blank');
  };

  // Refresh mosques search
  const handleRefresh = () => {
    if (userLocation) {
      findNearbyMosques(userLocation.latitude, userLocation.longitude);
    } else {
      refreshLocation();
    }
  };

  const isLoading = loading || locationLoading;

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Nearby Mosques</h1>
            {userLocation && (
              <p className="text-xs text-muted-foreground mt-1">
                📍 {userLocation.city}, {userLocation.country}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-full border-primary text-primary"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full border-primary text-primary"
              onClick={() => setShowMap(!showMap)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {showMap ? 'List' : 'Map'}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search mosques..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border rounded-full"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
            <span className="text-foreground">
              {locationLoading ? 'Getting your location...' : 'Finding mosques near you...'}
            </span>
          </div>
        )}

        {/* Location Error */}
        {!isLoading && locationError && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">{locationError}</p>
            <Button onClick={refreshLocation} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <MapPin className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Map View */}
        {showMap && userLocation && !isLoading && (
          <div className="h-96 rounded-2xl overflow-hidden">
            <MapContainer
              center={[userLocation.latitude, userLocation.longitude]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {/* User location marker */}
              <Marker position={[userLocation.latitude, userLocation.longitude]}>
                <Popup>Your Location</Popup>
              </Marker>
              {/* Mosque markers */}
              {filteredMosques.map((mosque) => (
                <Marker key={mosque.id} position={[mosque.lat, mosque.lon]}>
                  <Popup>
                    <div className="text-center">
                      <h3 className="font-semibold">{mosque.name}</h3>
                      <p className="text-sm text-muted-foreground">{mosque.distance?.toFixed(2)} km away</p>
                      <Button 
                        size="sm" 
                        className="mt-2 bg-primary text-primary-foreground"
                        onClick={() => openDirections(mosque)}
                      >
                        Get Directions
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Places Grid */}
        {!showMap && userLocation && !isLoading && (
          <div className="grid grid-cols-1 gap-4">
            {filteredMosques.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No mosques found nearby</p>
                <Button onClick={handleRefresh} className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Search className="h-4 w-4 mr-2" />
                  Search Again
                </Button>
              </div>
            ) : (
              filteredMosques.map((mosque) => (
                <Card key={mosque.id} className="p-4 rounded-2xl bg-card card-interactive">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🕌</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary mb-1">{mosque.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{mosque.address}</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {mosque.distance?.toFixed(2)} km away
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => openDirections(mosque)}
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Directions
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};