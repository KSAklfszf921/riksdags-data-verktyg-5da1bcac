
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ResponsiveHeader } from "./components/ResponsiveHeader";
import Index from "./pages/Index";
import Ledamoter from "./pages/Ledamoter";
import Anforanden from "./pages/Anforanden";
import Voteringar from "./pages/Voteringar";
import Dokument from "./pages/Dokument";
import Kalender from "./pages/Kalender";
import Partianalys from "./pages/Partianalys";
import Topplistor from "./pages/Topplistor";
import SprakAnalys from "./pages/SprakAnalys";
import DatabaseManager from "./pages/DatabaseManager";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <ResponsiveHeader />
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
            <Route path="/databashantering" element={<DatabaseManager />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
