
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ResponsiveHeader } from "./components/ResponsiveHeader";
import Index from "./pages/Index";
import Ledamoter from "./pages/Ledamoter";
import Partianalys from "./pages/Partianalys";
import Voteringar from "./pages/Voteringar";
import Dokument from "./pages/Dokument";
import Anforanden from "./pages/Anforanden";
import Kalender from "./pages/Kalender";
import Topplistor from "./pages/Topplistor";
import DatabaseManager from "./pages/DatabaseManager";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <ResponsiveHeader />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/ledamoter" element={<Ledamoter />} />
                <Route path="/partianalys" element={<Partianalys />} />
                <Route path="/voteringar" element={<Voteringar />} />
                <Route path="/dokument" element={<Dokument />} />
                <Route path="/anforanden" element={<Anforanden />} />
                <Route path="/kalender" element={<Kalender />} />
                <Route path="/topplistor" element={<Topplistor />} />
                <Route path="/databas" element={<DatabaseManager />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
