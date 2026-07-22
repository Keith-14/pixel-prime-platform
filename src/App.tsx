import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LocationProvider } from "./contexts/LocationContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useEffect } from "react";
import { useNativePushRegistration, schedulePrayerReminders, type PrayerOccurrence, type PrayerName } from "./hooks/useNativeNotifications";
import { useGlobalLocation } from "./contexts/LocationContext";

// Eager — needed for first paint / auth flow
import { Home } from "./pages/Home";
import { LoadingScreen } from "./pages/LoadingScreen";
import { Register } from "./pages/Register";
import { Onboarding } from "./pages/Onboarding";

// Lazy — split per route to shrink the initial bundle
const Quran = lazy(() => import("./pages/Quran").then(m => ({ default: m.Quran })));
const Qibla = lazy(() => import("./pages/Qibla").then(m => ({ default: m.Qibla })));
const Shop = lazy(() => import("./pages/Shop").then(m => ({ default: m.Shop })));
const ShopCategories = lazy(() => import("./pages/ShopCategories").then(m => ({ default: m.ShopCategories })));
const ProductDetail = lazy(() => import("./pages/ProductDetail").then(m => ({ default: m.ProductDetail })));
const Places = lazy(() => import("./pages/Places").then(m => ({ default: m.Places })));
const Account = lazy(() => import("./pages/Account").then(m => ({ default: m.Account })));
const PrayerTimes = lazy(() => import("./pages/PrayerTimes").then(m => ({ default: m.PrayerTimes })));
const Progress = lazy(() => import("./pages/Progress").then(m => ({ default: m.Progress })));
const MonthlyStreak = lazy(() => import("./pages/MonthlyStreak").then(m => ({ default: m.MonthlyStreak })));
const FAQ = lazy(() => import("./pages/FAQ").then(m => ({ default: m.FAQ })));
const Zakat = lazy(() => import("./pages/Zakat").then(m => ({ default: m.Zakat })));
const ZakatResult = lazy(() => import("./pages/ZakatResult").then(m => ({ default: m.ZakatResult })));
const Hajj = lazy(() => import("./pages/Hajj").then(m => ({ default: m.Hajj })));
const BusinessAccount = lazy(() => import("./pages/BusinessAccount").then(m => ({ default: m.BusinessAccount })));
const Cart = lazy(() => import("./pages/Cart").then(m => ({ default: m.Cart })));
const Checkout = lazy(() => import("./pages/Checkout").then(m => ({ default: m.Checkout })));
const ShippingAddresses = lazy(() => import("./pages/ShippingAddresses").then(m => ({ default: m.ShippingAddresses })));
const AddShippingAddress = lazy(() => import("./pages/AddShippingAddress").then(m => ({ default: m.AddShippingAddress })));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation").then(m => ({ default: m.OrderConfirmation })));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard").then(m => ({ default: m.SellerDashboard })));
const SellerOnboarding = lazy(() => import("./pages/SellerOnboarding").then(m => ({ default: m.SellerOnboarding })));
const SellerProducts = lazy(() => import("./pages/seller/SellerProducts").then(m => ({ default: m.SellerProducts })));
const SellerAddProduct = lazy(() => import("./pages/seller/SellerAddProduct").then(m => ({ default: m.SellerAddProduct })));
const SellerOrdersPage = lazy(() => import("./pages/seller/SellerOrdersPage").then(m => ({ default: m.SellerOrdersPage })));
const SellerOrderDetail = lazy(() => import("./pages/seller/SellerOrderDetail").then(m => ({ default: m.SellerOrderDetail })));
const SellerEarnings = lazy(() => import("./pages/seller/SellerEarnings").then(m => ({ default: m.SellerEarnings })));
const MakkahLive = lazy(() => import("./pages/MakkahLive").then(m => ({ default: m.MakkahLive })));
const Forum = lazy(() => import("./pages/Forum").then(m => ({ default: m.Forum })));
const News = lazy(() => import("./pages/News").then(m => ({ default: m.News })));
const NewsDetail = lazy(() => import("./pages/NewsDetail").then(m => ({ default: m.NewsDetail })));
const Mood = lazy(() => import("./pages/Mood").then(m => ({ default: m.Mood })));
const HalalScanner = lazy(() => import("./pages/HalalScanner").then(m => ({ default: m.HalalScanner })));
const Hadith = lazy(() => import("./pages/Hadith").then(m => ({ default: m.Hadith })));
const HadithBook = lazy(() => import("./pages/HadithBook").then(m => ({ default: m.HadithBook })));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService").then(m => ({ default: m.TermsOfService })));
const Notifications = lazy(() => import("./pages/Notifications").then(m => ({ default: m.Notifications })));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings").then(m => ({ default: m.NotificationSettings })));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Force splash + onboarding once per app launch (cold start)
  if (typeof window !== 'undefined' && !sessionStorage.getItem('barakah_startup_shown')) {
    return <Navigate to="/loading" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const NotificationsBootstrap = () => {
  useNativePushRegistration();
  const { user } = useAuth();
  const { location } = useGlobalLocation();

  useEffect(() => {
    if (!user || !location) return;
    let cancelled = false;

    const PRAYERS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    const fetchDay = async (d: Date): Promise<PrayerOccurrence[]> => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      // Aladhan timings API — method 2 (ISNA); returns times in the location's local tz.
      const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${location.latitude}&longitude=${location.longitude}&method=2`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('aladhan fetch failed');
      const json = await res.json();
      const timings = json?.data?.timings || {};
      return PRAYERS.map((name) => {
        const raw: string = timings[name] || '00:00';
        const [h, m] = raw.split(':').map((s: string) => parseInt(s, 10));
        const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);
        return { name, at };
      });
    };

    const run = async () => {
      try {
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const [t1, t2] = await Promise.all([fetchDay(today), fetchDay(tomorrow)]);
        if (cancelled) return;
        await schedulePrayerReminders([...t1, ...t2]);
      } catch (e) {
        console.warn('Prayer reminder schedule failed', e);
      }
    };

    run();
    // Re-run every 6h so tomorrow's shifting times get scheduled without a manual app open.
    const iv = setInterval(run, 6 * 60 * 60 * 1000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [user, location?.latitude, location?.longitude]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <HashRouter>
          <AuthProvider>
            <LocationProvider>
              <CartProvider>
                <Toaster />
                <Sonner />
                <NotificationsBootstrap />
                <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/loading" element={<LoadingScreen />} />
                  <Route path="/login" element={<Register />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                  <Route path="/quran" element={<ProtectedRoute><Quran /></ProtectedRoute>} />
                  <Route path="/qibla" element={<ProtectedRoute><Qibla /></ProtectedRoute>} />
                  <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
                  <Route path="/shop/categories" element={<ProtectedRoute><ShopCategories /></ProtectedRoute>} />
                  <Route path="/shop/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
                  <Route path="/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
                  <Route path="/places" element={<ProtectedRoute><Places /></ProtectedRoute>} />
                  <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                  <Route path="/seller-dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
                  <Route path="/seller-onboarding" element={<ProtectedRoute><SellerOnboarding /></ProtectedRoute>} />
                  <Route path="/seller/products" element={<ProtectedRoute><SellerProducts /></ProtectedRoute>} />
                  <Route path="/seller/products/new" element={<ProtectedRoute><SellerAddProduct /></ProtectedRoute>} />
                  <Route path="/seller/orders" element={<ProtectedRoute><SellerOrdersPage /></ProtectedRoute>} />
                  <Route path="/seller/orders/:id" element={<ProtectedRoute><SellerOrderDetail /></ProtectedRoute>} />
                  <Route path="/seller/earnings" element={<ProtectedRoute><SellerEarnings /></ProtectedRoute>} />
                  <Route path="/prayer-times" element={<ProtectedRoute><PrayerTimes /></ProtectedRoute>} />
                  <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                  <Route path="/monthly-streak" element={<ProtectedRoute><MonthlyStreak /></ProtectedRoute>} />
                  <Route path="/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
                  <Route path="/zakat" element={<ProtectedRoute><Zakat /></ProtectedRoute>} />
                  <Route path="/zakat-result" element={<ProtectedRoute><ZakatResult /></ProtectedRoute>} />
                  <Route path="/hajj" element={<ProtectedRoute><Hajj /></ProtectedRoute>} />
                  <Route path="/business-account" element={<ProtectedRoute><BusinessAccount /></ProtectedRoute>} />
                  <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/shipping-address" element={<ProtectedRoute><ShippingAddresses /></ProtectedRoute>} />
                  <Route path="/shipping-address/new" element={<ProtectedRoute><AddShippingAddress /></ProtectedRoute>} />
                  <Route path="/shipping-address/edit/:id" element={<ProtectedRoute><AddShippingAddress /></ProtectedRoute>} />
                  <Route path="/order-confirmation/:orderId" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
                  <Route path="/makkah-live" element={<ProtectedRoute><MakkahLive /></ProtectedRoute>} />
                  <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
                  <Route path="/news/:id" element={<ProtectedRoute><NewsDetail /></ProtectedRoute>} />
                  <Route path="/mood" element={<ProtectedRoute><Mood /></ProtectedRoute>} />
                  <Route path="/halal-scanner" element={<ProtectedRoute><HalalScanner /></ProtectedRoute>} />
                  <Route path="/hadith" element={<ProtectedRoute><Hadith /></ProtectedRoute>} />
                  <Route path="/hadith/:slug" element={<ProtectedRoute><HadithBook /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/notifications/settings" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
              </CartProvider>
            </LocationProvider>
          </AuthProvider>
        </HashRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
