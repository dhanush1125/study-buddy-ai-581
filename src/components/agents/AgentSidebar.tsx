import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Plus, Store, Sparkles, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/agents", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agents/new", label: "Create Agent", icon: Plus },
  { to: "/marketplace", label: "Marketplace", icon: Store },
];

export const AgentSidebar = () => {
  const loc = useLocation();
  return (
    <aside className="w-60 shrink-0 border-r border-border/50 bg-card/40 backdrop-blur-xl flex flex-col">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold text-sm">Agent Studio</div>
            <div className="text-[10px] text-muted-foreground">Build, deploy, chat</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {items.map(it => {
          const active = loc.pathname === it.to ||
            (it.to === "/agents" && loc.pathname.startsWith("/agents") && loc.pathname !== "/agents/new");
          const Icon = it.icon;
          return (
            <NavLink key={it.to} to={it.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
              <Icon className="w-4 h-4" /> {it.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-2 border-t border-border/50">
        <NavLink to="/"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted">
          <ArrowLeft className="w-3 h-3" /> Back to Study Buddy
        </NavLink>
      </div>
    </aside>
  );
};
