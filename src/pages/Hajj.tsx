import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plane, 
  Users, 
  Calendar, 
  MapPin, 
  Star,
  Clock,
  Shield,
  Heart
} from 'lucide-react';

const hajjPackages = [
  {
    id: 1,
    name: 'Essential Hajj Package',
    price: '$4,999',
    duration: '14 days',
    group: '50 pilgrims',
    rating: 4.8,
    features: ['Accommodation', 'Transportation', 'Guide', 'Meals']
  },
  {
    id: 2,
    name: 'Premium Hajj Package',
    price: '$7,999',
    duration: '21 days',
    group: '30 pilgrims',
    rating: 4.9,
    features: ['Luxury Stay', 'Private Transport', 'Expert Guide', 'All Meals', 'Extra Services']
  },
  {
    id: 3,
    name: 'VIP Hajj Package',
    price: '$12,999',
    duration: '28 days',
    group: '15 pilgrims',
    rating: 5.0,
    features: ['5-Star Hotels', 'Private Jets', 'Personal Guide', 'Gourmet Meals', 'Exclusive Access']
  }
];

export const Hajj = () => {
  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-2">Hajj Pilgrimage</h1>
          <p className="text-muted-foreground">
            Join fellow Muslims on this sacred journey
          </p>
        </div>

        {/* Hero Section */}
        <Card className="bg-primary text-primary-foreground p-6 rounded-2xl text-center">
          <Plane className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sacred Journey Awaits</h2>
          <p className="opacity-90 mb-4">
            Experience the pilgrimage of a lifetime with guided group tours
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-1">
              <Shield className="h-4 w-4" />
              <span>Licensed</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>Trusted</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>Community</span>
            </div>
          </div>
        </Card>

        {/* Package Cards */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-primary">Available Packages</h3>
          {hajjPackages.map((pkg) => (
            <Card key={pkg.id} className="p-4 rounded-2xl bg-card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-lg text-foreground">{pkg.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-muted-foreground">{pkg.rating}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{pkg.price}</div>
                  <div className="text-sm text-muted-foreground">per person</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">{pkg.duration}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">{pkg.group}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {pkg.features.map((feature, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Book Package
              </Button>
            </Card>
          ))}
        </div>

        {/* Information Section */}
        <Card className="p-4 rounded-2xl bg-card">
          <h3 className="font-bold text-lg mb-3 text-primary">Important Information</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start space-x-2">
              <Clock className="h-4 w-4 mt-0.5 text-primary" />
              <p>Booking must be completed at least 6 months in advance</p>
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 mt-0.5 text-primary" />
              <p>All packages include accommodation in Mecca and Medina</p>
            </div>
            <div className="flex items-start space-x-2">
              <Users className="h-4 w-4 mt-0.5 text-primary" />
              <p>Group leaders are experienced Islamic scholars</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};
