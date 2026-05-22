import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, CalendarX, CheckCircle2, DollarSign, TrendingUp, UserX } from "lucide-react";
import { getReports } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_authenticated/app/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Agenday" }] }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const fetchReports = useServerFn(getReports);
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => fetchReports(),
  });

  const maxCount = Math.max(1, ...(data?.serie ?? []).map((s) => s.count));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold">Relatórios</h1>
        <p className="text-ink-soft mt-1">Últimos 30 dias.</p>
      </header>

      {isLoading ? (
        <p className="text-sm text-ink-soft">Carregando...</p>
      ) : (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={DollarSign} label="Receita" value={`R$ ${(data?.receita ?? 0).toFixed(2)}`} tone="emerald" />
            <Stat icon={TrendingUp} label="Ticket médio" value={`R$ ${(data?.ticketMedio ?? 0).toFixed(2)}`} tone="brand" />
            <Stat icon={CheckCircle2} label="Concluídos" value={String(data?.concluidos ?? 0)} tone="blue" />
            <Stat icon={CalendarX} label="Cancelados + faltas" value={String((data?.cancelados ?? 0) + (data?.faltas ?? 0))} tone="rose" />
          </section>

          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-brand-600" /> Agendamentos por dia
            </h2>
            {!data?.serie?.length ? (
              <p className="text-sm text-ink-soft">Sem dados ainda.</p>
            ) : (
              <div className="space-y-2">
                {data.serie.map((s) => (
                  <div key={s.data} className="flex items-center gap-3 text-sm">
                    <span className="w-20 text-xs text-ink-soft">{new Date(s.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <div className="h-full bg-brand-500 flex items-center justify-end px-2 text-xs text-white font-medium" style={{ width: `${(s.count / maxCount) * 100}%`, minWidth: s.count > 0 ? "32px" : "0" }}>
                        {s.count > 0 && s.count}
                      </div>
                    </div>
                    <span className="w-20 text-xs text-right text-ink-soft">R$ {s.receita.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Resumo</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <Row label="Total" value={String(data?.total ?? 0)} />
              <Row label="Concluídos" value={String(data?.concluidos ?? 0)} />
              <Row label="Cancelados" value={String(data?.cancelados ?? 0)} />
              <Row label="Faltas" value={String(data?.faltas ?? 0)} />
            </dl>
          </section>
        </>
      )}
    </div>
  );
}

const TONES = {
  emerald: "bg-emerald-50 text-emerald-700",
  brand: "bg-brand-50 text-brand-700",
  blue: "bg-blue-50 text-blue-700",
  rose: "bg-rose-50 text-rose-700",
};

function Stat({ icon: Icon, label, value, tone }: { icon: typeof UserX; label: string; value: string; tone: keyof typeof TONES }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className={`w-9 h-9 rounded-lg ${TONES[tone]} flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs uppercase tracking-wide text-ink-soft mt-3">{label}</p>
      <p className="font-display text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="font-display text-xl font-semibold mt-1">{value}</dd>
    </div>
  );
}
