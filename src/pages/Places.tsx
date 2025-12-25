import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Navigation, Search, MapPin, Loader2, AlertCircle, RefreshCw, UtensilsCrossed, Settings2, LocateFixed } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useGlobalLocation } from '@/contexts/LocationContext';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type PlaceType = 'mosque' | 'restaurant';

interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance?: number;
  address?: string;
  type: PlaceType;
}

export const Places = () => {
  const { location: userLocation, loading: locationLoading, error: locationError, refresh: refreshLocation, setManualLocation, clearManualLocation } = useGlobalLocation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [placeType, setPlaceType] = useState<PlaceType>('mosque');
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [searchingCity, setSearchingCity] = useState(false);

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

  // Search for city coordinates
  const searchCity = async () => {
    if (!citySearch.trim()) return;
    
    setSearchingCity(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(citySearch)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        await setManualLocation(parseFloat(lat), parseFloat(lon));
        setLocationDialogOpen(false);
        setCitySearch('');
      } else {
        toast.error('City not found. Please try a different search.');
      }
    } catch (error) {
      toast.error('Failed to search for city. Please try again.');
    } finally {
      setSearchingCity(false);
    }
  };

  // Set manual coordinates
  const handleManualCoordinates = async () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      toast.error('Please enter valid coordinates');
      return;
    }
    
    await setManualLocation(lat, lon);
    setLocationDialogOpen(false);
    setManualLat('');
    setManualLon('');
  };

  // Use current GPS location
  const useCurrentLocation = () => {
    clearManualLocation();
    setLocationDialogOpen(false);
  };

  // Build Overpass query based on place type
  const buildOverpassQuery = (lat: number, lon: number, radius: number, type: PlaceType) => {
    if (type === 'mosque') {
      return `
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
    } else {
      return `
        [out:json][timeout:30];
        (
          node["amenity"="restaurant"]["diet:halal"="yes"](around:${radius},${lat},${lon});
          node["amenity"="restaurant"]["cuisine"~"halal"](around:${radius},${lat},${lon});
          node["amenity"="fast_food"]["diet:halal"="yes"](around:${radius},${lat},${lon});
          node["amenity"="cafe"]["diet:halal"="yes"](around:${radius},${lat},${lon});
          way["amenity"="restaurant"]["diet:halal"="yes"](around:${radius},${lat},${lon});
          way["amenity"="restaurant"]["cuisine"~"halal"](around:${radius},${lat},${lon});
        );
        out center;
      `;
    }
  };

  // Find nearby places using Overpass API
  const findNearbyPlaces = async (lat: number, lon: number, type: PlaceType) => {
    setLoading(true);
    try {
      const radius = 5000; // 5km radius as requested
      const overpassQuery = buildOverpassQuery(lat, lon, radius, type);

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
      
      const typeLabel = type === 'mosque' ? 'mosques' : 'halal restaurants';
      
      if (!data.elements || data.elements.length === 0) {
        setPlaces([]);
        toast.info(`No ${typeLabel} found within 5km. Try changing your location.`);
        return;
      }
      
      const placesList: Place[] = data.elements
        .map((element: any) => {
          const elLat = element.lat || element.center?.lat;
          const elLon = element.lon || element.center?.lon;
          
          if (!elLat || !elLon) return null;
          
          const distance = calculateDistance(lat, lon, elLat, elLon);
          
          const defaultName = type === 'mosque' ? 'Mosque' : 'Halal Restaurant';
          
          return {
            id: element.id.toString(),
            name: element.tags?.name || element.tags?.['name:en'] || element.tags?.['name:ar'] || defaultName,
            lat: elLat,
            lon: elLon,
            distance,
            address: element.tags?.['addr:full'] || element.tags?.['addr:street'] || element.tags?.['addr:city'] || 'Address not available',
            type,
          };
        })
        .filter((place: Place | null): place is Place => place !== null)
        .sort((a: Place, b: Place) => (a.distance || 0) - (b.distance || 0));

      setPlaces(placesList);
      
      if (placesList.length > 0) {
        toast.success(`Found ${placesList.length} ${typeLabel} within 5km`);
      } else {
        toast.info(`No ${typeLabel} found within 5km.`);
      }
    } catch (error) {
      console.error('Error finding places:', error);
      const typeLabel = type === 'mosque' ? 'mosques' : 'halal restaurants';
      toast.error(`Failed to find nearby ${typeLabel}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch places when location is available or place type changes
  useEffect(() => {
    if (userLocation && !locationLoading) {
      findNearbyPlaces(userLocation.latitude, userLocation.longitude, placeType);
    }
  }, [userLocation, locationLoading, placeType]);

  // Filter places based on search query
  const filteredPlaces = places.filter(place =>
    place.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open directions in Google Maps
  const openDirections = (place: Place) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;
    window.open(url, '_blank');
  };

  // Refresh places search
  const handleRefresh = () => {
    if (userLocation) {
      findNearbyPlaces(userLocation.latitude, userLocation.longitude, placeType);
    } else {
      refreshLocation();
    }
  };

  const isLoading = loading || locationLoading;

  const getPlaceIcon = (type: PlaceType) => type === 'mosque' ? '🕌' : '🍽️';
  const getPlaceLabel = (type: PlaceType) => type === 'mosque' ? 'Mosques' : 'Halal Restaurants';

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Nearby Places</h1>
            {userLocation && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {userLocation.isManual ? '📌' : '📍'} {userLocation.city}, {userLocation.country}
                {userLocation.isManual && <span className="text-primary text-[10px]">(manual)</span>}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="rounded-full border-primary text-primary"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Change Location</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {/* Use GPS */}
                  <Button 
                    onClick={useCurrentLocation} 
                    className="w-full bg-primary text-primary-foreground"
                    disabled={locationLoading}
                  >
                    <LocateFixed className="h-4 w-4 mr-2" />
                    Use My Current GPS Location
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or search city</span>
                    </div>
                  </div>
                  
                  {/* Search by city */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter city name..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchCity()}
                    />
                    <Button onClick={searchCity} disabled={searchingCity}>
                      {searchingCity ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or enter coordinates</span>
                    </div>
                  </div>
                  
                  {/* Manual coordinates */}
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Latitude"
                      type="number"
                      step="any"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                    />
                    <Input
                      placeholder="Longitude"
                      type="number"
                      step="any"
                      value={manualLon}
                      onChange={(e) => setManualLon(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleManualCoordinates} 
                    variant="outline" 
                    className="w-full"
                    disabled={!manualLat || !manualLon}
                  >
                    Set Coordinates
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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

        {/* Place Type Toggle */}
        <div className="flex gap-2">
          <Button
            variant={placeType === 'mosque' ? 'default' : 'outline'}
            className={`flex-1 rounded-full ${placeType === 'mosque' ? 'bg-primary text-primary-foreground' : 'border-primary text-primary'}`}
            onClick={() => setPlaceType('mosque')}
            disabled={isLoading}
          >
            <span className="mr-2">🕌</span>
            Mosques
          </Button>
          <Button
            variant={placeType === 'restaurant' ? 'default' : 'outline'}
            className={`flex-1 rounded-full ${placeType === 'restaurant' ? 'bg-primary text-primary-foreground' : 'border-primary text-primary'}`}
            onClick={() => setPlaceType('restaurant')}
            disabled={isLoading}
          >
            <UtensilsCrossed className="h-4 w-4 mr-2" />
            Halal Food
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder={`Search ${getPlaceLabel(placeType).toLowerCase()}...`}
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
              {locationLoading ? 'Getting your location...' : `Finding ${getPlaceLabel(placeType).toLowerCase()} within 5km...`}
            </span>
          </div>
        )}

        {/* Location Error */}
        {!isLoading && locationError && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">{locationError}</p>
            <div className="flex gap-2">
              <Button onClick={refreshLocation} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <MapPin className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => setLocationDialogOpen(true)} variant="outline">
                <Settings2 className="h-4 w-4 mr-2" />
                Set Manually
              </Button>
            </div>
          </div>
        )}

        {/* Map View */}
        {showMap && userLocation && !isLoading && (
          <div className="h-96 rounded-2xl overflow-hidden">
            <MapContainer
              center={[userLocation.latitude, userLocation.longitude]}
              zoom={14}
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
              {/* Place markers */}
              {filteredPlaces.map((place) => (
                <Marker key={place.id} position={[place.lat, place.lon]}>
                  <Popup>
                    <div className="text-center">
                      <h3 className="font-semibold">{place.name}</h3>
                      <p className="text-sm text-muted-foreground">{place.distance?.toFixed(2)} km away</p>
                      <Button 
                        size="sm" 
                        className="mt-2 bg-primary text-primary-foreground"
                        onClick={() => openDirections(place)}
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
            {filteredPlaces.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No {getPlaceLabel(placeType).toLowerCase()} found within 5km</p>
                <div className="flex gap-2 justify-center mt-4">
                  <Button onClick={handleRefresh} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Search className="h-4 w-4 mr-2" />
                    Search Again
                  </Button>
                  <Button onClick={() => setLocationDialogOpen(true)} variant="outline">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Change Location
                  </Button>
                </div>
              </div>
            ) : (
              filteredPlaces.map((place) => (
                <Card key={place.id} className="p-4 rounded-2xl bg-card card-interactive">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                      <span className="text-2xl">{getPlaceIcon(place.type)}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary mb-1">{place.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{place.address}</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {place.distance?.toFixed(2)} km away
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => openDirections(place)}
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
