import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, CalendarDays, CreditCard, LayoutDashboard, LogOut, Menu, Scissors, Settings, Shield, UserCircle2, Users, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoAgenday from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Painel — Agenday" }] }),
  component: AppLayout,
});

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/app/clientes", label: "Clientes", icon: Users },
  { to: "/app/servicos", label: "Serviços", icon: Scissors },
  { to: "/app/profissionais", label: "Profissionais", icon: UserCircle2 },
  { to: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/app/pagamentos", label: "Pagamentos", icon: CreditCard },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
] as const;

function AppLayout() {
  const { profile, signOut, loading } = useAuth();
  const { isSuperAdmin } = useIsSuperAdmin();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { location } = useRouterState();

  useEffect(() => {
    if (!loading && profile && !profile.onboarded) {
      navigate({ to: "/onboarding" });
    }
  }, [loading, profile, navigate]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  if (loading || !profile?.onboarded) {
    return <div className="min-h-screen flex items-center justify-center bg-surface-warm text-ink-soft">Carregando...</div>;
  }

  const initials = (profile.full_name ?? profile.email ?? "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-surface-warm">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:w-[260px] flex-col bg-card border-r border-border/70 sticky top-0 h-screen">
        <div className="px-6 py-5 border-b border-border/60 flex items-center justify-center">
          <img src={logoAgenday} alt="Agenday" className="h-14 w-auto object-contain" />
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} pathname={location.pathname} />
          ))}
          {isSuperAdmin && <AdminNavLink pathname={location.pathname} />}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-50/50">
            <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-medium text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate text-ink">{profile.full_name ?? "Usuária"}</p>
              <p className="text-xs text-ink-soft truncate">{profile.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start mt-2 text-ink-soft hover:text-ink"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-20 bg-card/95 backdrop-blur border-b border-border/70 px-4 h-14 flex items-center justify-between">
        <img src={logoAgenday} alt="Agenday" className="h-9 w-auto object-contain" />
        <button onClick={() => setOpen(!open)} aria-label={open ? "Fechar menu" : "Abrir menu"} className="p-2 -mr-2 rounded-lg hover:bg-muted transition">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 top-14 z-10 bg-card animate-in fade-in flex flex-col">
          <nav className="px-3 py-4 space-y-1.5 flex-1">
            {NAV.map((item) => (
              <NavItem key={item.to} {...item} pathname={location.pathname} />
            ))}
            {isSuperAdmin && <AdminNavLink pathname={location.pathname} />}
          </nav>
          <div className="px-3 py-4 border-t border-border/60">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-medium text-sm">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{profile.full_name ?? "Usuária"}</p>
                <p className="text-xs text-ink-soft truncate">{profile.email}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-ink-soft" onClick={() => signOut()}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, label, icon: Icon, exact, pathname }: {
  to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; pathname: string;
}) {
  const active = exact ? pathname === to : pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        active
          ? "bg-brand-50 text-brand-700 shadow-sm"
          : "text-ink-soft hover:bg-brand-50/40 hover:text-ink",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-600" aria-hidden />
      )}
      <Icon className={cn("w-[18px] h-[18px] transition", active ? "text-brand-600" : "text-ink-soft group-hover:text-brand-600")} />
      {label}
    </Link>
  );
}

function AdminNavLink({ pathname }: { pathname: string }) {
  const active = pathname.startsWith("/admin");
  return (
    <Link
      to="/admin/dashboard"
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-2 border border-amber-200/60",
        active
          ? "bg-amber-100 text-amber-900"
          : "text-amber-800 bg-amber-50/60 hover:bg-amber-100",
      )}
    >
      <Shield className="w-[18px] h-[18px] text-amber-700" />
      Admin
    </Link>
  );
}
