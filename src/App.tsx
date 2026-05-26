import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import ParentView from "./pages/ParentView";
import AgentsDashboard from "./pages/agents/AgentsDashboard";
import CreateAgent from "./pages/agents/CreateAgent";
import AgentPlayground from "./pages/agents/AgentPlayground";
import Marketplace from "./pages/agents/Marketplace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/parent/:token" element={<ParentView />} />
            <Route path="/agents" element={<AgentsDashboard />} />
            <Route path="/agents/new" element={<CreateAgent />} />
            <Route path="/agents/:id/edit" element={<CreateAgent />} />
            <Route path="/agents/:agentId" element={<AgentPlayground />} />
            <Route path="/agents/:agentId/chat/:threadId" element={<AgentPlayground />} />
            <Route path="/marketplace" element={<Marketplace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
