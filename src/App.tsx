import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ReCaptchaProvider } from "@/components/ReCaptcha";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { Grok3ChatBot } from "@/components/Grok3ChatBot";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";
import { AppWithMaintenance } from "@/components/AppWithMaintenance";
import { TopProgressBar } from "@/components/TopProgressBar";
import { PageTransition } from "@/components/PageTransition";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Market from "./pages/Market";
import MarketDetail from "./pages/MarketDetail";
import Admin from "./pages/Admin";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Leaderboard from "./pages/Leaderboard";
import Rewards from "./pages/Rewards";
import Referral from "./pages/Referral";
import Apis from "./pages/Apis";
import Accuracy from "./pages/Accuracy";
import Support from "./pages/Support";
import Docs from "./pages/Docs";
import Terms from "./pages/Terms";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Explore from "./pages/Explore";
import PoliticsPage from "./pages/categories/PoliticsPage";
import CryptoPage from "./pages/categories/CryptoPage";
import FinancePage from "./pages/categories/FinancePage";
import GeopoliticsPage from "./pages/categories/GeopoliticsPage";
import TechPage from "./pages/categories/TechPage";
import EconomyPage from "./pages/categories/EconomyPage";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isEnabled } = useFeatureFlags();

  return (
    <>
      <PageTransition>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/market" element={isEnabled('feature_markets') ? <Market /> : <Navigate to="/" replace />} />
          <Route path="/market/:marketId" element={isEnabled('feature_markets') ? <Market /> : <Navigate to="/" replace />} />
          <Route path="/market-detail" element={isEnabled('feature_markets') ? <MarketDetail /> : <Navigate to="/" replace />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/feed" element={isEnabled('feature_feed') ? <Feed /> : <Navigate to="/" replace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={isEnabled('feature_leaderboard') ? <Leaderboard /> : <Navigate to="/" replace />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/apis" element={<Apis />} />
          <Route path="/accuracy" element={<Accuracy />} />
          <Route path="/support" element={<Support />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/politics" element={<PoliticsPage />} />
          <Route path="/crypto" element={<CryptoPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/geopolitics" element={<GeopoliticsPage />} />
          <Route path="/tech" element={<TechPage />} />
          <Route path="/economy" element={<EconomyPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
      {/* AI chat moved to admin panel */}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DemoProvider>
      <ReCaptchaProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <InstallPromptBanner />
        <BrowserRouter>
          <TopProgressBar />
          <AppWithMaintenance>
            <AppRoutes />
          </AppWithMaintenance>
        </BrowserRouter>
      </TooltipProvider>
      </ReCaptchaProvider>
      </DemoProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
