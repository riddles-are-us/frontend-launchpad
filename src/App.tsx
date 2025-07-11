import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DelphinusReactProvider } from 'zkwasm-minirollup-browser';
import { LaunchpadProvider } from "./contexts/LaunchpadContext";
import { API_CONFIG } from "./config/api";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Launchpad configuration from API config
const launchpadConfig = {
  serverUrl: API_CONFIG.serverUrl,
  privkey: API_CONFIG.privateKey // This will be overridden by wallet context
};

const App = () => (
  <DelphinusReactProvider appName="ZKCROSS-LAUNCHPAD">
    <QueryClientProvider client={queryClient}>
      <LaunchpadProvider config={launchpadConfig}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/dashboard" element={<Dashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LaunchpadProvider>
    </QueryClientProvider>
  </DelphinusReactProvider>
);

export default App;
