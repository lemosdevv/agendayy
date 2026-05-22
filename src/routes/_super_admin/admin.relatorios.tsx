import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminCharts } from "@/lib/admin.functions";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

export const Route = createFileRoute("/_super_admin/admin/relatorios")({
  component: AdminReportsPage,
});

const COLORS = ["#10b981", "#ef4444", "#f59e0b"];

function AdminReportsPage() {
  const fetchCharts = useServerFn(getAdminCharts);
  const [period, setPeriod] = useState<"30d" | "90d" | "12m">("90d");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "charts", period],
    queryFn: () => fetchCharts({ data: { period } }),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Relatórios</h1>
          <p className="text-sm text-slate-500 mt-1">Métricas do SaaS ao longo do tempo.</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as never)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="12m">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Crescimento de usuários" loading={isLoading}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.userGrowth ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} name="Novos usuários" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Receita estimada" loading={isLoading}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.revenue ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
              <Bar dataKey="value" fill="#10b981" name="MRR" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Assinaturas: ativas vs canceladas" loading={isLoading}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data?.activeVsCanceled ?? []} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} label>
                {(data?.activeVsCanceled ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Taxa de cancelamento (churn)" loading={isLoading}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.churn ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} name="Cancelamentos" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Novos clientes por período" loading={isLoading} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.newCustomers ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" name="Novos clientes" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, loading, children, className }: { title: string; loading?: boolean; children: ReactNode; className?: string }) {
  return (
    <Card className={`p-5 ${className ?? ""}`}>
      <h3 className="font-medium text-slate-900 mb-4">{title}</h3>
      {loading ? <Skeleton className="h-[260px] w-full" /> : children}
    </Card>
  );
}
