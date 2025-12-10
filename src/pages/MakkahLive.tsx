import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { ExternalLink, Radio } from 'lucide-react';

export const MakkahLive = () => {
  const handleStreamClick = () => {
    window.open('https://www.youtube.com/@AlQuran4KOfficial/streams', '_blank');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Main clickable stream card */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] rounded-3xl border-none bg-sage-dark px-6 py-8 text-primary-foreground shadow-lg"
          onClick={handleStreamClick}
        >
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse bg-cream/10 rounded-full blur-xl"></div>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cream/10">
                <Radio className="h-10 w-10 text-cream relative z-10" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-widest text-cream/80">
                Makkah Live Stream
              </p>
              <h2 className="text-2xl font-bold text-cream">
                Watch Live Now
              </h2>
              <p className="text-sm text-cream/70 max-w-xs mx-auto">
                Experience the blessed view of Masjid al-Haram
              </p>
              <div className="flex items-center justify-center gap-2 text-cream font-medium pt-2">
                <span className="text-sm">Open YouTube Stream</span>
                <ExternalLink className="h-4 w-4" />
              </div>
            </div>
          </div>
        </Card>

        {/* Information about Makkah */}
        <Card className="rounded-3xl border-none bg-sage-dark px-5 py-5 text-primary-foreground shadow-lg">
          <p className="text-xs font-medium uppercase tracking-widest text-cream/80">
            About Makkah
          </p>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-cream/90">
            <p>
              Makkah (Mecca) is the holiest city in Islam and the birthplace of Prophet Muhammad (peace be upon him). 
              It is home to the Kaaba, the most sacred site in Islam, located within Masjid al-Haram (The Sacred Mosque).
            </p>
            <p>
              Muslims around the world face the direction of the Kaaba during their five daily prayers, 
              and it is the focal point of the annual Hajj pilgrimage, one of the Five Pillars of Islam.
            </p>
            <p>
              The live stream allows Muslims worldwide to connect with the holy site, 
              observe prayers, and feel spiritually closer to this blessed location at any time.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};
