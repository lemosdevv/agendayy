import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, CreditCard, LayoutDashboard, LogOut, Menu, ScrollText, Shield, Users, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { verifyAdminAccess } from "@/lib/admin.functions";

export const Route = createFileRoute("/_super_admin")({
  head: () => ({ meta: [{ title: "Admin — Agenday" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/assinaturas", label: "Assinaturas", icon: CreditCard },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/admin/auditoria", label: "Auditoria", icon: ScrollText },
] as const;

function AdminLayout() {
  const { profile, signOut, session, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const { location } = useRouterState();
  const navigate = useNavigate();
  const verify = useServerFn(verifyAdminAccess);

  // Client-side session guard
  useEffect(() => {
    if (!authLoading && !session) {
      const redirect = encodeURIComponent("/admin/dashboard");
      navigate({ to: "/entrar", search: { redirect } as never });
    }
  }, [authLoading, session, navigate]);

  // Server-side super_admin check
  const { data, isLoading, isError } = useQuery({
    queryKey: ["verify-admin-access", session?.user?.id],
    enabled: !!session?.user?.id,
    retry: false,
    queryFn: () => verify(),
  });

  useEffect(() => {
    if (isError) navigate({ to: "/app" });
  }, [isError, navigate]);

  if (authLoading || (session && isLoading)) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Carregando...</div>;
  }

  if (!session || !data?.ok) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Redirecionando...</div>;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-[240px] flex-col bg-slate-900 text-slate-100 sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <span className="font-semibold tracking-tight">Admin Panel</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <AdminNavItem key={item.to} {...item} pathname={location.pathname} onClick={() => setOpen(false)} />
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800 text-xs space-y-2">
          <p className="text-slate-400 truncate">{profile?.email}</p>
          <Button asChild variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
            <Link to="/app">← Voltar ao app</Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-slate-900 text-slate-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <span className="font-semibold">Admin</span>
          <Badge variant="secondary" className="ml-1 text-[10px]">SUPER</Badge>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2 -mr-2">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden fixed inset-0 top-14 z-20 bg-slate-900 text-slate-100 p-3">
          {NAV.map((item) => (
            <AdminNavItem key={item.to} {...item} pathname={location.pathname} onClick={() => setOpen(false)} />
          ))}
          <Button asChild variant="ghost" className="mt-4 w-full justify-start text-slate-300">
            <Link to="/app" onClick={() => setOpen(false)}>← Voltar ao app</Link>
          </Button>
          <Button variant="ghost" className="mt-1 w-full justify-start text-slate-300" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="mb-4 hidden md:flex items-center gap-2">
            <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-amber-200">Modo Super Admin</Badge>
            <span className="text-xs text-slate-500">Todas as ações são auditadas.</span>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function AdminNavItem({ to, label, icon: Icon, pathname, onClick }: {
  to: string; label: string; icon: typeof LayoutDashboard; pathname: string; onClick?: () => void;
}) {
  const active = pathname.startsWith(to);
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
        active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
