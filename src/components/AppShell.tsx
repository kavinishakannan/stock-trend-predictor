import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { Activity, BarChart3, Brain, LayoutDashboard, Lightbulb, LogOut, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/stocks.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function useMe() {
  const fetchMe = useServerFn(getMe);
  return useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), staleTime: 60_000 });
}

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analysis", label: "Stock Analysis", icon: BarChart3 },
  { to: "/prediction", label: "Prediction", icon: Brain },
  { to: "/insights", label: "Insights", icon: Lightbulb },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="border-b border-border bg-sidebar lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:block">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            <span className="font-display text-base font-semibold">TrendIQ</span>
          </Link>
          <div className="lg:mt-4">
            <Badge variant="secondary" className="num text-[10px] tracking-widest uppercase">
              {me?.role ?? "…"}
            </Badge>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent text-foreground font-medium" }}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
          {me?.role === "admin" && (
            <Link
              to="/admin"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent text-foreground font-medium" }}
            >
              <Shield className="size-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden px-5 py-4 lg:block">
          <p className="truncate text-xs text-muted-foreground">{me?.email}</p>
          <Button variant="ghost" size="sm" className="mt-2 -ml-2" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1">
        <div className="flex items-center justify-end px-5 py-3 lg:hidden">
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}