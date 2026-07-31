import { Layout } from '@/components/Layout';
import { ShoppingCart, Search, Menu, Leaf } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORIES } from '@/data/shopCategories';
import { SideMenu } from '@/components/SideMenu';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  inventory_quantity: number;
  seller_id: string;
}

const CREAM = '#FFF5E5';
const CREAM_SOFT = '#FFF5E5';
const BROWN = '#A35233';
const BROWN_DARK = '#5C2A14';
const ACCENT_BROWN = '#B54A22';

export const Shop = () => {
  const { getTotalItems } = useCart();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sellerDestination, setSellerDestination] = useState('/seller-onboarding');
  const [destinationLoading, setDestinationLoading] = useState(false);

  useEffect(() => {
    const resolveSellerDestination = async () => {
      if (userRole !== 'seller' || !user?.uid) {
        setSellerDestination('/seller-onboarding');
        return;
      }

      setDestinationLoading(true);
      try {
        const { data } = await supabase
          .from('seller_profiles')
          .select('onboarding_completed')
          .eq('user_id', user.uid)
          .maybeSingle();

        setSellerDestination(data?.onboarding_completed ? '/seller-dashboard' : '/seller-onboarding');
      } catch (error) {
        console.error('Failed to resolve seller destination', error);
        setSellerDestination('/seller-onboarding');
      } finally {
        setDestinationLoading(false);
      }
    };

    resolveSellerDestination();
  }, [userRole, user?.uid]);

  const handleSellerCTA = () => {
    navigate(sellerDestination);
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <Layout showHeader={false} pageBackgroundColor={CREAM}>
      <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
        {/* Top bar */}
        <div className="bg-white px-4 pt-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setIsMenuOpen(true)}
              style={{ color: BROWN_DARK }}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold" style={{ color: BROWN_DARK }}>Marketplace</h1>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" aria-label="Search" style={{ color: BROWN_DARK }}>
              <Search className="h-5 w-5" />
            </button>
            <button type="button" onClick={handleCartClick} className="relative" style={{ color: BROWN_DARK }}>
              <ShoppingCart className="h-6 w-6" />
              {getTotalItems() > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center text-white"
                  style={{ backgroundColor: BROWN }}
                >
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="px-4 pt-5 pb-32 space-y-6">
          {/* Categories */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: BROWN_DARK }}>Categories</h2>
              <button type="button" onClick={() => navigate('/shop/categories')} className="text-sm" style={{ color: BROWN_DARK, opacity: 0.7 }}>See all</button>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              {CATEGORIES.map((c) => (
                <button key={c.key} type="button" onClick={() => navigate('/shop/categories')} className="flex flex-col items-center gap-2 shrink-0 w-16">
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-neutral-100">
                    <img src={c.image} alt={c.label} loading="lazy" width={64} height={64} className="h-full w-full object-cover" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight" style={{ color: BROWN_DARK }}>{c.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Hero banner */}
          <section>
            <div
              className="relative rounded-3xl overflow-hidden p-6 h-44 flex flex-col justify-center"
              style={{
                background: `linear-gradient(135deg, ${BROWN} 0%, ${BROWN_DARK} 100%)`,
              }}
            >
              <div className="relative z-10 max-w-[60%]">
                <h3 className="text-2xl font-bold text-white leading-tight">Artisanal Selection</h3>
                <p className="text-xs text-white/85 mt-2 leading-snug">
                  Curated handcrafted pieces from master artisans across the heritage belt.
                </p>
              </div>
              <div
                className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30"
                style={{
                  background:
                    'radial-gradient(circle at 70% 50%, rgba(255,220,180,0.6), transparent 60%)',
                }}
              />
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <span className="h-1.5 w-6 rounded-full" style={{ backgroundColor: ACCENT_BROWN }} />
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#D9C4A4' }} />
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#D9C4A4' }} />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: BROWN }}>Marketplace</h2>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm" style={{ boxShadow: '0 2px 10px rgba(92,42,20,0.08)' }}>
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: BROWN_DARK }}>Want to sell on Barakah?</h3>
                  <p className="mt-2 text-sm text-[#5C2A14]/80">
                    Our marketplace only displays active seller listings. Complete seller onboarding to start adding products and reach buyers now.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSellerCTA}
                  disabled={destinationLoading}
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
                  style={{
                    backgroundColor: BROWN,
                    color: '#fff',
                    opacity: destinationLoading ? 0.7 : 1,
                  }}
                >
                  {destinationLoading ? 'Checking seller status…' : userRole === 'seller' ? 'Open seller dashboard' : 'Start selling products'}
                </button>
              </div>
            </div>
          </section>
        </div>
        <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      </div>
    </Layout>
  );
};
