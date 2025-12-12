import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navigation, Search, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

interface UserLocation {
  lat: number;
  lon: number;
}

export const Places = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);

  // Get user's current location
  const getUserLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setUserLocation(location);
          findNearbyMosques(location);
        },
        (error) => {
          toast.error('Unable to get your location. Please enable location services.');
          setLoading(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  };

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
    const distance = R * c;
    return distance;
  };

  // Find nearby mosques using Overpass API
  const findNearbyMosques = async (location: UserLocation) => {
    try {
      const radius = 5000; // 5km radius
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${location.lat},${location.lon});
          way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${location.lat},${location.lon});
          relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${location.lat},${location.lon});
        );
        out center;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = await response.json();
      
      const mosquesList: Mosque[] = data.elements.map((element: any) => {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;
        const distance = calculateDistance(location.lat, location.lon, lat, lon);
        
        return {
          id: element.id.toString(),
          name: element.tags?.name || 'Mosque',
          lat,
          lon,
          distance,
          address: element.tags?.['addr:full'] || element.tags?.['addr:street'] || 'No address available',
        };
      }).filter((mosque: Mosque) => mosque.lat && mosque.lon)
        .sort((a: Mosque, b: Mosque) => (a.distance || 0) - (b.distance || 0));

      setMosques(mosquesList);
      toast.success(`Found ${mosquesList.length} mosques nearby`);
    } catch (error) {
      toast.error('Failed to find nearby mosques. Please try again.');
      console.error('Error finding mosques:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter mosques based on search query
  const filteredMosques = mosques.filter(mosque =>
    mosque.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open directions in Google Maps
  const openDirections = (mosque: Mosque) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lon}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Nearby Mosques</h1>
          <Button 
            variant="outline" 
            className="rounded-full border-primary text-primary"
            onClick={() => setShowMap(!showMap)}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {showMap ? 'List' : 'Map'}
          </Button>
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

        {/* Location Status */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
            <span className="text-foreground">Finding mosques near you...</span>
          </div>
        )}

        {!loading && !userLocation && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">Location access required to find nearby mosques</p>
            <Button onClick={getUserLocation} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <MapPin className="h-4 w-4 mr-2" />
              Enable Location
            </Button>
          </div>
        )}

        {/* Map View */}
        {showMap && userLocation && (
          <div className="h-96 rounded-2xl overflow-hidden">
            <MapContainer
              center={[userLocation.lat, userLocation.lon]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {/* User location marker */}
              <Marker position={[userLocation.lat, userLocation.lon]}>
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
        {!showMap && userLocation && (
          <div className="grid grid-cols-1 gap-4">
            {filteredMosques.length === 0 && !loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No mosques found nearby</p>
                <Button onClick={getUserLocation} className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Search className="h-4 w-4 mr-2" />
                  Search Again
                </Button>
              </div>
            ) : (
              filteredMosques.map((mosque) => (
                <Card key={mosque.id} className="p-4 rounded-2xl bg-card">
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
