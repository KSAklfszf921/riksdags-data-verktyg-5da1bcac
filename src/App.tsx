
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ResponsiveHeader } from "./components/ResponsiveHeader";
import BreadcrumbNavigation from "./components/BreadcrumbNavigation";
import EnhancedErrorBoundary from "./components/EnhancedErrorBoundary";
import SyncStatusIndicator from "./components/SyncStatusIndicator";
import { ThemeProvider } from "./contexts/ThemeContext";
import Index from "./pages/Index";
import Ledamoter from "./pages/Ledamoter";
import Anforanden from "./pages/Anforanden";
import Voteringar from "./pages/Voteringar";
import Dokument from "./pages/Dokument";
import Kalender from "./pages/Kalender";
import Partianalys from "./pages/Partianalys";
import Topplistor from "./pages/Topplistor";
import SprakAnalys from "./pages/SprakAnalys";
import Databashantering from "./pages/Databashantering";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <EnhancedErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <div className="min-h-screen bg-background text-foreground font-sans antialiased w-full transition-colors duration-300">
                <Toaster 
                  position="top-right"
                  expand={false}
                  richColors
                  closeButton
                  className="dark:bg-gray-800"
                />
                <BrowserRouter>
                  <ResponsiveHeader />
                  <BreadcrumbNavigation />
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
                    <Route path="/databashantering" element={<Databashantering />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/testverktyg" element={<Admin />} />
                    <Route path="/calendar-test" element={<Admin />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <SyncStatusIndicator />
                </BrowserRouter>
              </div>
            </TooltipProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </HelmetProvider>
    </EnhancedErrorBoundary>
  );
}

export default App;
