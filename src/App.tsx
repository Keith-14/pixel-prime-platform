import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { LoadingScreen } from "./pages/LoadingScreen";
import { Login } from "./pages/Login";
import { Quran } from "./pages/Quran";
import { Shop } from "./pages/Shop";
import { Places } from "./pages/Places";
import { Account } from "./pages/Account";
import { PrayerTimes } from "./pages/PrayerTimes";
import { Progress } from "./pages/Progress";
import { FAQ } from "./pages/FAQ";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/loading" element={<LoadingScreen />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/quran" element={<Quran />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/places" element={<Places />} />
          <Route path="/account" element={<Account />} />
          <Route path="/prayer-times" element={<PrayerTimes />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/faq" element={<FAQ />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
