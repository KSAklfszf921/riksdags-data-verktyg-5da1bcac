
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Ledamoter from "./pages/Ledamoter";
import Voteringar from "./pages/Voteringar";
import Dokument from "./pages/Dokument";
import Anforanden from "./pages/Anforanden";
import Kalender from "./pages/Kalender";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/ledamoter" element={<Ledamoter />} />
          <Route path="/voteringar" element={<Voteringar />} />
          <Route path="/dokument" element={<Dokument />} />
          <Route path="/anforanden" element={<Anforanden />} />
          <Route path="/kalender" element={<Kalender />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
