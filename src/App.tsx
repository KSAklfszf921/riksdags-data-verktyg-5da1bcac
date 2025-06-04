
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import { EnhancedAuthProvider } from "@/contexts/EnhancedAuthContext";
import AuthPage from "@/components/AuthPage";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <EnhancedAuthProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            {navItems.map(({ to, page }) => (
              <Route 
                key={to} 
                path={to} 
                element={
                  <ProtectedRoute>
                    {page}
                  </ProtectedRoute>
                } 
              />
            ))}
          </Routes>
        </BrowserRouter>
      </EnhancedAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
