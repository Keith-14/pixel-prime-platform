import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { Home } from "./pages/Home";
import { LoadingScreen } from "./pages/LoadingScreen";
import { Login } from "./pages/Login";
import { Quran } from "./pages/Quran";
import { Qibla } from "./pages/Qibla";
import { Shop } from "./pages/Shop";
import { Places } from "./pages/Places";
import { Account } from "./pages/Account";
import { PrayerTimes } from "./pages/PrayerTimes";
import { Progress } from "./pages/Progress";
import { FAQ } from "./pages/FAQ";
import { Zakat } from "./pages/Zakat";
import { Hajj } from "./pages/Hajj";
import { BusinessAccount } from "./pages/BusinessAccount";
import { Cart } from "./pages/Cart";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/loading" element={<LoadingScreen />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/quran" element={<Quran />} />
          <Route path="/qibla" element={<Qibla />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/places" element={<Places />} />
          <Route path="/account" element={<Account />} />
          <Route path="/prayer-times" element={<PrayerTimes />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/zakat" element={<Zakat />} />
          <Route path="/hajj" element={<Hajj />} />
          <Route path="/business-account" element={<BusinessAccount />} />
          <Route path="/cart" element={<Cart />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
