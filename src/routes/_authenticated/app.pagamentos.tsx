import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Check, CreditCard, Sparkles, Zap, Crown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getTrialInfo, TRIAL_DAYS } from "@/lib/trial";
import { PaymentCheckoutModal } from "@/components/PaymentCheckoutModal";

type PlanId = "start" | "profissional" | "studio";

export const Route = createFileRoute("/_authenticated/app/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos — Agenday" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ status: s.status as string | undefined }),
  component: PagamentosPage,
});

type TenantPlan = {
  plan: string;
  plan_status: string;
  trial_start_date: string;
  name: string;
};

type Plano = {
  id: string;
  nome: string;
  preco: number;
  icon: typeof Zap;
  destaque?: boolean;
  benefits: string[];
};

const PLANOS: Plano[] = [
  {
    id: "start",
    nome: "Start",
    preco: 29.99,
    icon: Zap,
    benefits: [
      "Link público de agendamento",
      "Cadastro ilimitado de serviços",
      "Agenda online 24h",
      "Clientes com histórico",
      "Página com sua marca",
    ],
  },
  {
    id: "profissional",
    nome: "Profissional",
    preco: 49.99,
    icon: Sparkles,
    destaque: true,
    benefits: [
      "Tudo do Start",
      "Até 5 profissionais",
      "Lembretes e confirmações",
      "Templates de mensagem",
      "Dashboard de operação",
    ],
  },
  {
    id: "studio",
    nome: "Studio",
    preco: 109.99,
    icon: Crown,
    benefits: [
      "Tudo do Profissional",
      "10+ profissionais",
      "Unidades e equipe",
      "Relatórios e visão geral",
      "Controle avançado",
    ],
  },
];

function PagamentosPage() {
  const { profile } = useAuth();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant-plan", profile?.tenant_id],
    enabled: !!profile?.tenant_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("plan, plan_status, trial_start_date, name")
        .eq("id", profile!.tenant_id!)
        .single();
      if (error) throw error;
      return data as TenantPlan;
    },
  });

  const trial = getTrialInfo(tenant?.trial_start_date);
  const isTrial = tenant?.plan === "trial";
  const currentPlanId = tenant?.plan ?? "trial";

  const search = useSearch({ from: "/_authenticated/app/pagamentos" });
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  useEffect(() => {
    if (search.status === "ok") toast.success("Pagamento confirmado! Seu plano será ativado em instantes.");
    if (search.status === "pendente") toast.info("Pagamento pendente. Você receberá a confirmação em breve.");
    if (search.status === "erro") toast.error("Pagamento não concluído. Tente novamente.");
  }, [search.status]);

  const handleUpgrade = (planoId: string) => {
    setSelectedPlan(planoId as PlanId);
  };

  const selectedPlano = PLANOS.find((p) => p.id === selectedPlan);

  return (
    <div className="space-y-8 md:space-y-10">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink tracking-tight">
          Seu plano
        </h1>
        <p className="text-ink-soft mt-1.5 text-base">
          Gerencie seu plano e assinatura.
        </p>
      </header>

      {/* Plano atual */}
      <section className="bg-card border border-border/70 rounded-2xl p-6 md:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-2xl font-semibold text-ink">
                      {planoLabel(tenant?.plan ?? "trial")}
                    </h2>
                    {isTrial && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                        Período de teste
                      </span>
                    )}
                    {!isTrial && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3" /> Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-soft mt-0.5">
                    {tenant?.name ?? "Seu estabelecimento"}
                  </p>
                </div>
              </div>
            </div>

            {isTrial && (
              <TrialCountdown
                daysLeft={trial.daysLeft}
                percent={trial.percent}
                severity={trial.severity}
                expired={trial.expired}
              />
            )}
          </div>
        )}
      </section>

      {/* Planos disponíveis */}
      <section>
        <div className="mb-5">
          <h2 className="font-display text-2xl font-semibold text-ink tracking-tight">
            Escolha seu plano
          </h2>
          <p className="text-sm text-ink-soft mt-1">
            Faça upgrade quando quiser. Sem fidelidade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {PLANOS.map((p) => {
            const Icon = p.icon;
            const isCurrent = currentPlanId === p.id;
            return (
              <article
                key={p.id}
                className={cn(
                  "relative bg-card border rounded-2xl p-6 md:p-7 flex flex-col transition-all",
                  isCurrent
                    ? "border-brand-600 shadow-[0_8px_24px_-12px_rgba(159,59,101,0.25)]"
                    : "border-border/70 hover:border-brand-200",
                  p.destaque && !isCurrent && "border-brand-300",
                )}
              >
                {p.destaque && !isCurrent && (
                  <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-600 text-white">
                    Mais popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                    <Check className="w-3 h-3" /> Plano atual
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      p.destaque ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-ink">{p.nome}</h3>
                </div>

                <div className="mt-5">
                  <span className="font-display text-4xl font-semibold text-ink tracking-tight">
                    R$ {p.preco.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-ink-soft text-sm ml-1">/mês</span>
                </div>

                <ul className="mt-5 space-y-2.5 flex-1">
                  {p.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-ink">
                      <Check className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "mt-6 w-full h-11 rounded-xl",
                    isCurrent
                      ? "bg-muted text-ink-soft hover:bg-muted cursor-default"
                      : p.destaque
                        ? "bg-brand-600 hover:bg-brand-700 text-white"
                        : "bg-ink hover:bg-ink/90 text-white",
                  )}
                  disabled={isCurrent}
                  onClick={() => handleUpgrade(p.id)}
                >
                  {isCurrent ? "Plano atual" : isTrial ? "Assinar agora" : "Fazer upgrade"}
                </Button>
              </article>
            );
          })}
        </div>

        <p className="text-xs text-ink-soft mt-5 text-center">
          Cancele quando quiser. Sem multas. Pagamentos processados via Mercado Pago.
        </p>
      </section>

      <PaymentCheckoutModal
        open={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        plan={selectedPlan}
        planLabel={selectedPlano ? `Plano ${selectedPlano.nome}` : ""}
        planAmount={selectedPlano?.preco ?? 0}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["tenant-plan", profile?.tenant_id] });
        }}
      />
    </div>
  );
}

function planoLabel(plan: string) {
  switch (plan) {
    case "start": return "Plano Start";
    case "profissional": return "Plano Profissional";
    case "studio": return "Plano Studio";
    default: return "Teste grátis";
  }
}

function TrialCountdown({
  daysLeft,
  percent,
  severity,
  expired,
}: {
  daysLeft: number;
  percent: number;
  severity: "ok" | "warn" | "danger" | "expired";
  expired: boolean;
}) {
  const colorBar = {
    ok: "bg-emerald-500",
    warn: "bg-amber-500",
    danger: "bg-rose-500",
    expired: "bg-rose-600",
  }[severity];
  const colorBg = {
    ok: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warn: "bg-amber-50 border-amber-200 text-amber-900",
    danger: "bg-rose-50 border-rose-200 text-rose-900",
    expired: "bg-rose-50 border-rose-300 text-rose-900",
  }[severity];

  return (
    <div className={cn("rounded-xl border p-5", colorBg)}>
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <p className="font-display text-2xl font-semibold tracking-tight">
            {expired
              ? "Seu teste expirou"
              : `Restam ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} do seu teste grátis`}
          </p>
          <p className="text-sm opacity-80 mt-0.5">
            {expired
              ? "Escolha um plano abaixo para continuar usando o Agenday."
              : `Teste grátis de ${TRIAL_DAYS} dias — sem cartão.`}
          </p>
        </div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-white/60 overflow-hidden">
        <div
          className={cn("h-full transition-all", colorBar)}
          style={{ width: `${expired ? 100 : Math.max(5, 100 - percent)}%` }}
        />
      </div>
    </div>
  );
}
