import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, CreditCard, DollarSign, TrendingDown, TrendingUp, UserCheck, UserPlus, Users, UserX } from "lucide-react";
import { MetricCard } from "@/components/admin/MetricCard";
import { getAdminMetrics } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_super_admin/admin/dashboard")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { session } = useAuth();
  const fetchMetrics = useServerFn(getAdminMetrics);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "metrics"],
    enabled: !!session?.access_token,
    queryFn: () => fetchMetrics(),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Visão geral do SaaS em tempo real.</p>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between">
          <span>Erro ao carregar métricas.</span>
          <button onClick={() => refetch()} className="underline font-medium">Tentar novamente</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total de usuários" value={data?.totalUsers} icon={Users} loading={isLoading} color="blue" />
        <MetricCard label="Usuários ativos" value={data?.activeUsers} icon={UserCheck} loading={isLoading} color="emerald" />
        <MetricCard label="Usuários inativos" value={data?.inactiveUsers} icon={UserX} loading={isLoading} color="slate" />
        <MetricCard label="Novos no mês" value={data?.newUsersThisMonth} icon={UserPlus} loading={isLoading} color="indigo" />
        <MetricCard label="Assinaturas ativas" value={data?.activeSubscriptions} icon={CreditCard} loading={isLoading} color="teal" />
        <MetricCard label="Assinaturas canceladas" value={data?.canceledSubscriptions} icon={TrendingDown} loading={isLoading} color="rose" />
        <MetricCard label="MRR estimado" value={data?.mrr} icon={DollarSign} loading={isLoading} color="emerald" format="currency" />
        <MetricCard label="Cancelamentos no mês" value={data?.cancellationsThisMonth} icon={TrendingDown} loading={isLoading} color="amber" />
        <MetricCard label="Agendamentos no mês" value={data?.appointmentsThisMonth} icon={Activity} loading={isLoading} color="violet" />
        <MetricCard label="Taxa de retenção" value={data ? Math.round((1 - (data.cancellationsThisMonth / Math.max(1, data.activeSubscriptions))) * 100) + "%" : null} icon={TrendingUp} loading={isLoading} color="emerald" />
      </div>
    </div>
  );
}
