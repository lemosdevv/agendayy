import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Check, Clock, MapPin, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { getTenantPublic, getBusySlots, createPublicBooking } from "@/lib/public-booking.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agenda/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Agendar — ${params.slug}` },
      { name: "description", content: "Agende seu horário online em poucos cliques." },
    ],
  }),
  loader: async ({ params }) => {
    try {
      return await getTenantPublic({ data: { slug: params.slug } });
    } catch {
      throw notFound();
    }
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-surface-warm">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold">Página não encontrada</h1>
        <p className="text-ink-soft mt-2">Este link de agendamento não existe ou foi desativado.</p>
        <Link to="/" className="text-brand-700 underline mt-4 inline-block">Voltar ao início</Link>
      </div>
    </div>
  ),
  component: PublicBookingPage,
});

const HOURS = Array.from({ length: 24 }, (_, h) => h).filter((h) => h >= 8 && h <= 20);
const MINUTES = [0, 30];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function PublicBookingPage() {
  const data = Route.useLoaderData() as Awaited<ReturnType<typeof getTenantPublic>>;
  const { tenant, servicos, profissionais, unidades } = data;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [servicoId, setServicoId] = useState<string>("");
  const [profissionalId, setProfissionalId] = useState<string>("");
  const [unidadeId, setUnidadeId] = useState<string>(unidades[0]?.id ?? "");
  const [date, setDate] = useState<string>(todayISO());
  const [time, setTime] = useState<string>("");
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", observacoes: "" });
  const [done, setDone] = useState(false);

  const servico = servicos.find((s) => s.id === servicoId);

  const fetchBusy = useServerFn(getBusySlots);
  const { data: busy = [] } = useQuery({
    queryKey: ["busy", tenant.id, profissionalId, date],
    enabled: !!profissionalId && !!date,
    queryFn: () => fetchBusy({ data: { tenantId: tenant.id, profissionalId, date } }),
  });

  const slots = useMemo(() => {
    if (!servico) return [];
    const result: { time: string; iso: string; busy: boolean }[] = [];
    for (const h of HOURS) {
      for (const m of MINUTES) {
        const dt = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
        const fim = new Date(dt.getTime() + servico.duracao_min * 60_000);
        const isBusy = busy.some((b) => {
          const bi = new Date(b.inicio).getTime();
          const bf = new Date(b.fim).getTime();
          return dt.getTime() < bf && fim.getTime() > bi;
        });
        const isPast = dt.getTime() < Date.now();
        result.push({
          time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
          iso: dt.toISOString(),
          busy: isBusy || isPast,
        });
      }
    }
    return result;
  }, [date, servico, busy]);

  const createFn = useServerFn(createPublicBooking);
  const book = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          tenantId: tenant.id,
          servicoId,
          profissionalId,
          unidadeId: unidadeId || null,
          inicio: time,
          cliente: form,
        },
      }),
    onSuccess: () => setDone(true),
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => { setTime(""); }, [profissionalId, date, servicoId]);

  if (servicos.length === 0 || profissionais.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-warm px-4">
        <div className="text-center max-w-md">
          <h1 className="font-display text-2xl font-semibold">{tenant.name}</h1>
          <p className="text-ink-soft mt-2">Esta agenda ainda não está disponível para reservas online.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-warm px-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <Check className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold mt-4">Agendamento solicitado!</h1>
          <p className="text-ink-soft mt-2">Você receberá uma confirmação em breve. Status atual: <span className="font-medium text-ink">pendente</span>.</p>
          <div className="mt-6 text-sm text-left bg-muted rounded-lg p-4 space-y-1">
            <p><span className="text-ink-soft">Serviço:</span> {servico?.nome}</p>
            <p><span className="text-ink-soft">Profissional:</span> {profissionais.find((p) => p.id === profissionalId)?.nome}</p>
            <p><span className="text-ink-soft">Quando:</span> {new Date(time).toLocaleString("pt-BR")}</p>
          </div>
          <Button className="w-full mt-6" onClick={() => { setDone(false); setStep(1); setServicoId(""); setProfissionalId(""); setTime(""); setForm({ nome: "", telefone: "", email: "", observacoes: "" }); }}>
            Fazer outro agendamento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold leading-tight">{tenant.name}</h1>
            <p className="text-xs text-ink-soft">Agendamento online</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
        <Stepper step={step} />

        {step === 1 && (
          <Card title="Escolha o serviço" icon={Sparkles}>
            <div className="grid sm:grid-cols-2 gap-3">
              {servicos.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setServicoId(s.id); setStep(2); }}
                  className={cn(
                    "text-left border rounded-xl p-4 transition hover:border-brand-400 hover:bg-brand-50/50",
                    servicoId === s.id ? "border-brand-500 bg-brand-50" : "border-border bg-card",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.cor }} />
                    <span className="font-medium">{s.nome}</span>
                  </div>
                  {s.descricao && <p className="text-xs text-ink-soft mt-1 line-clamp-2">{s.descricao}</p>}
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="text-ink-soft flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {s.duracao_min} min</span>
                    <span className="font-semibold">R$ {Number(s.preco).toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card title="Escolha o profissional" icon={User}>
            <div className="grid sm:grid-cols-2 gap-3">
              {profissionais.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setProfissionalId(p.id); setStep(3); }}
                  className={cn(
                    "flex items-center gap-3 border rounded-xl p-4 transition hover:border-brand-400",
                    profissionalId === p.id ? "border-brand-500 bg-brand-50" : "border-border bg-card",
                  )}
                >
                  <span className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: p.cor }}>
                    {p.nome.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium">{p.nome}</span>
                </button>
              ))}
            </div>
            <BackBtn onClick={() => setStep(1)} />
          </Card>
        )}

        {step === 3 && (
          <Card title="Escolha data e horário" icon={CalendarDays}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="date">Data</Label>
                <Input id="date" type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
              </div>
              {unidades.length > 1 && (
                <div>
                  <Label htmlFor="unidade">Unidade</Label>
                  <select id="unidade" value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </div>
              )}
              <div>
                <Label>Horários disponíveis</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      disabled={s.busy}
                      onClick={() => { setTime(s.iso); setStep(4); }}
                      className={cn(
                        "px-2 py-2 text-sm rounded-md border transition",
                        s.busy
                          ? "border-border bg-muted text-ink-soft/50 cursor-not-allowed line-through"
                          : time === s.iso
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-border bg-card hover:border-brand-400 hover:bg-brand-50/50",
                      )}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <BackBtn onClick={() => setStep(2)} />
          </Card>
        )}

        {step === 4 && (
          <Card title="Seus dados" icon={User}>
            <form
              onSubmit={(e) => { e.preventDefault(); book.mutate(); }}
              className="space-y-3"
            >
              <div>
                <Label htmlFor="nome">Nome completo *</Label>
                <Input id="nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="telefone">WhatsApp *</Label>
                  <Input id="telefone" required placeholder="(11) 99999-9999" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="obs">Observações</Label>
                <Textarea id="obs" rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>

              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <p><span className="text-ink-soft">Serviço:</span> {servico?.nome} ({servico?.duracao_min} min)</p>
                <p><span className="text-ink-soft">Profissional:</span> {profissionais.find((p) => p.id === profissionalId)?.nome}</p>
                <p><span className="text-ink-soft">Quando:</span> {new Date(time).toLocaleString("pt-BR")}</p>
                <p><span className="text-ink-soft">Valor:</span> R$ {Number(servico?.preco ?? 0).toFixed(2)}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(3)}>Voltar</Button>
                <Button type="submit" className="flex-1" disabled={book.isPending}>
                  {book.isPending ? "Confirmando..." : "Confirmar agendamento"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Serviço", "Profissional", "Horário", "Dados"];
  return (
    <ol className="flex items-center gap-2 text-xs">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <li key={l} className="flex items-center gap-2 flex-1">
            <span className={cn("w-6 h-6 rounded-full flex items-center justify-center font-semibold",
              done ? "bg-emerald-500 text-white" : active ? "bg-brand-500 text-white" : "bg-muted text-ink-soft")}>
              {done ? <Check className="w-3 h-3" /> : n}
            </span>
            <span className={cn("hidden sm:inline", active ? "text-ink font-medium" : "text-ink-soft")}>{l}</span>
            {n < labels.length && <span className="flex-1 h-px bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Sparkles; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-2xl p-5 md:p-6">
      <h2 className="font-display text-lg font-semibold flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-brand-600" /> {title}
      </h2>
      {children}
    </section>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return <Button variant="ghost" size="sm" onClick={onClick} className="mt-4">← Voltar</Button>;
}
