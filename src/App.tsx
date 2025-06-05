
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ResponsiveHeader } from "./components/ResponsiveHeader";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Ledamoter from "./pages/Ledamoter";
import Anforanden from "./pages/Anforanden";
import Voteringar from "./pages/Voteringar";
import Dokument from "./pages/Dokument";
import Kalender from "./pages/Kalender";
import Partianalys from "./pages/Partianalys";
import Topplistor from "./pages/Topplistor";
import SprakAnalys from "./pages/SprakAnalys";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <ResponsiveHeader />
            <main>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/ledamoter" element={<Ledamoter />} />
                <Route path="/anforanden" element={<Anforanden />} />
                <Route path="/voteringar" element={<Voteringar />} />
                <Route path="/dokument" element={<Dokument />} />
                <Route path="/kalender" element={<Kalender />} />
                <Route path="/partianalys" element={<Partianalys />} />
                <Route path="/topplistor" element={<Topplistor />} />
                <Route path="/sprakanalys" element={<SprakAnalys />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
