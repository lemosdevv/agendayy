import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarPlus,
  Check,
  Copy,
  ExternalLink,
  Link2,
  Pencil,
  Plus,
  Scissors,
  Share2,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useState, type ComponentType } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDashboardStats } from "@/lib/dashboard.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getTrialInfo } from "@/lib/trial";

export const Route = createFileRoute("/_authenticated/app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  const fetchStats = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchStats(),
    enabled: !!profile?.tenant_id,
  });

  const { data: tenant } = useQuery({
    queryKey: ["tenant", profile?.tenant_id],
    enabled: !!profile?.tenant_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("tenants")
        .select("slug,name,trial_start_date,plan,plan_status")
        .eq("id", profile!.tenant_id!)
        .single();
      return data;
    },
  });

  const publicUrl = typeof window !== "undefined" && tenant?.slug
    ? `${window.location.origin}/agenda/${tenant.slug}`
    : "";

  const trial = getTrialInfo(tenant?.trial_start_date);
  const showTrialBanner = !!tenant && (tenant.plan ?? "trial") === "trial";

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink tracking-tight">
            Olá{firstName ? `, ${firstName}` : ""} <span className="inline-block">👋</span>
          </h1>
          <p className="text-ink-soft mt-1.5 text-base">Aqui está um resumo do seu negócio hoje.</p>
        </div>
        <Button asChild className="bg-brand-600 hover:bg-brand-700 text-white shadow-sm h-11 px-5 rounded-xl">
          <Link to="/app/agenda">
            <Plus className="w-4 h-4 mr-1.5" /> Novo agendamento
          </Link>
        </Button>
      </header>

      {showTrialBanner && <TrialBanner daysLeft={trial.daysLeft} severity={trial.severity} expired={trial.expired} />}



      {/* Métricas */}
      <section
        aria-label="Métricas"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
      >
        <MetricCard
          icon={CalendarCheck2}
          label="Agendamentos hoje"
          value={isLoading ? null : String(data?.agendamentosHoje ?? 0)}
          helper="Marcados para hoje"
        />
        <MetricCard
          icon={Users}
          label="Clientes cadastrados"
          value={isLoading ? null : String(data?.totalClientes ?? 0)}
          helper="Total na sua base"
        />
        <MetricCard
          icon={Sparkles}
          label="Serviços ativos"
          value={isLoading ? null : String(data?.servicosAtivos ?? 0)}
          helper="Disponíveis na agenda"
        />
        <MetricCard
          icon={TrendingUp}
          label="Receita do mês"
          value={isLoading ? null : formatBRL(data?.receitaMes ?? 0)}
          helper="Acumulado em vendas"
          accent
        />
      </section>

      {/* Link público */}
      {publicUrl && tenant?.slug && (
        <PublicLinkCard publicUrl={publicUrl} slug={tenant.slug} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        {/* Próximos agendamentos */}
        <section className="lg:col-span-2 bg-card border border-border/70 rounded-2xl p-6 md:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Próximos agendamentos</h2>
              <p className="text-sm text-ink-soft mt-0.5">Sua agenda nos próximos dias.</p>
            </div>
            <Link to="/app/agenda" className="text-sm text-brand-700 hover:text-brand-600 font-medium hidden sm:inline">
              Ver agenda →
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : !data?.proximos?.length ? (
            <EmptyAppointments />
          ) : (
            <ul className="divide-y divide-border/60">
              {data.proximos.map((a) => (
                <li key={a.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                      <CalendarCheck2 className="w-[18px] h-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-ink truncate">
                        {new Date(a.inicio).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {new Date(a.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <Link to="/app/agenda" className="text-sm text-brand-700 hover:underline font-medium shrink-0">
                    Ver →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Ações rápidas */}
        <section className="bg-card border border-border/70 rounded-2xl p-6 md:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <h2 className="font-display text-xl font-semibold text-ink">Ações rápidas</h2>
          <p className="text-sm text-ink-soft mt-0.5">Atalhos para o dia a dia.</p>
          <div className="mt-5 space-y-2">
            <QuickAction to="/app/agenda" icon={CalendarPlus} label="Novo agendamento" />
            <QuickAction to="/app/clientes" icon={UserPlus} label="Novo cliente" />
            <QuickAction to="/app/servicos" icon={Scissors} label="Novo serviço" />
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  accent,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  helper?: string;
  accent?: boolean;
}) {
  return (
    <div className="group bg-card border border-border/70 rounded-2xl p-5 md:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-brand-200 hover:shadow-[0_8px_24px_-12px_rgba(159,59,101,0.15)] transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-soft">{label}</span>
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
            accent ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600",
          )}
        >
          <Icon className="w-[18px] h-[18px]" />
        </div>
      </div>
      <div className="mt-4">
        {value === null ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <p className="font-display text-3xl font-semibold text-ink tracking-tight">{value}</p>
        )}
        {helper && <p className="text-xs text-ink-soft mt-1.5">{helper}</p>}
      </div>
    </div>
  );
}

function PublicLinkCard({ publicUrl, slug }: { publicUrl: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWa = () => {
    const text = encodeURIComponent(`Agende seu horário comigo: ${publicUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50/70 via-card to-card border border-brand-200/60 rounded-2xl p-6 md:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
            <Link2 className="w-[18px] h-[18px]" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Seu link público de agendamento</h2>
            <p className="text-sm text-ink-soft mt-1 max-w-md">
              Compartilhe com seus clientes para que eles agendem horários online a qualquer hora.
            </p>
          </div>
        </div>
        <Link
          to="/agenda/$slug"
          params={{ slug }}
          target="_blank"
          className="text-sm text-brand-700 hover:text-brand-600 inline-flex items-center gap-1.5 font-medium"
        >
          <ExternalLink className="w-4 h-4" /> Abrir página
        </Link>
      </div>

      <div className="mt-5 flex items-center gap-2 bg-card border border-border rounded-xl p-1.5 pl-4">
        <code className="flex-1 text-sm text-ink-soft truncate font-sans">{publicUrl}</code>
        <Button
          size="sm"
          onClick={copy}
          className={cn(
            "h-9 px-3.5 rounded-lg transition-all",
            copied ? "bg-success text-white hover:bg-success/90" : "bg-brand-600 hover:bg-brand-700 text-white",
          )}
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5 mr-1.5" /> Copiado!</>
          ) : (
            <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar</>
          )}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={shareWa} className="h-9 rounded-lg border-brand-200 hover:bg-brand-50/60 text-ink">
          <Share2 className="w-3.5 h-3.5 mr-1.5" /> Compartilhar no WhatsApp
        </Button>
        <Button asChild variant="outline" size="sm" className="h-9 rounded-lg border-brand-200 hover:bg-brand-50/60 text-ink">
          <Link to="/app/configuracoes">
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar link
          </Link>
        </Button>
      </div>
    </section>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-brand-200 hover:bg-brand-50/50 transition group"
    >
      <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-ink">{label}</span>
    </Link>
  );
}

function EmptyAppointments() {
  return (
    <div className="text-center py-10 px-4">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
        <CalendarCheck2 className="w-6 h-6" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">Nenhum agendamento futuro</h3>
      <p className="mt-1 text-sm text-ink-soft max-w-sm mx-auto">
        Quando seus clientes agendarem horários, eles aparecerão aqui.
      </p>
      <Button asChild className="mt-5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl h-10">
        <Link to="/app/agenda">
          <Plus className="w-4 h-4 mr-1.5" /> Criar agendamento
        </Link>
      </Button>
    </div>
  );
}

function TrialBanner({ daysLeft, severity, expired }: { daysLeft: number; severity: "ok" | "warn" | "danger" | "expired"; expired: boolean }) {
  const styles = {
    ok: "bg-brand-50/60 border-brand-200 text-ink",
    warn: "bg-amber-50 border-amber-200 text-amber-900",
    danger: "bg-rose-50 border-rose-200 text-rose-900",
    expired: "bg-rose-50 border-rose-300 text-rose-900",
  }[severity];

  const message = expired
    ? "Seu teste expirou — escolha um plano para continuar."
    : severity === "danger"
      ? `Seu teste termina em breve — restam ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}.`
      : `Você está em teste grátis — restam ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}.`;

  return (
    <div className={cn("flex items-center justify-between gap-3 flex-wrap rounded-xl border px-4 py-3", styles)}>
      <p className="text-sm font-medium inline-flex items-center gap-2">
        {(severity === "danger" || expired) && <AlertTriangle className="w-4 h-4" />}
        {message}
      </p>
      <Button asChild size="sm" variant="outline" className="h-8 rounded-lg bg-white/80 border-current/20 hover:bg-white">
        <Link to="/app/pagamentos">Ver planos →</Link>
      </Button>
    </div>
  );
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}
