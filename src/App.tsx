
import { Toaster } from "@/components/ui/sonner";
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
import Databashantering from "./pages/Databashantering";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Toaster />
          <BrowserRouter>
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
              <Route path="/databashantering" element={<Databashantering />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/testverktyg" element={<Admin />} />
              <Route path="/calendar-test" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
