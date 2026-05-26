import { ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AgentSidebar } from "./AgentSidebar";

export const AgentLayout = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-primary/5">
      <AgentSidebar />
      <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
    </div>
  );
};
