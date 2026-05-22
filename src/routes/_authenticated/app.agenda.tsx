import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, User, CreditCard, CalendarPlus, MoreVertical, MessageCircle, Bell, Receipt } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { sendWhatsAppTemplate } from "@/lib/whatsapp.functions";
import { createMpPaymentLink } from "@/lib/mercadopago.functions";
import { syncAgendamentoToGoogle } from "@/lib/google-calendar.functions";
import { getIntegrationsStatus } from "@/lib/integrations.functions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/lib/use-tenant";
import { PageHeader, EmptyState } from "@/components/crud/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/app/agenda")({
  head: () => ({ meta: [{ title: "Agenda — Agenday" }] }),
  component: AgendaPage,
});

type Status = "pendente" | "confirmado" | "concluido" | "cancelado" | "faltou";

type Agendamento = {
  id: string;
  cliente_id: string;
  servico_id: string;
  profissional_id: string;
  unidade_id: string | null;
  inicio: string;
  fim: string;
  status: Status;
  preco: number;
  observacoes: string | null;
  pagamento_status: string | null;
  cliente: { nome: string } | null;
  servico: { nome: string; cor: string; duracao_min: number; preco: number } | null;
  profissional: { nome: string; cor: string } | null;
};

const STATUS_LABEL: Record<Status, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  faltou: "Não compareceu",
};

const STATUS_STYLE: Record<Status, string> = {
  pendente: "bg-amber-100 text-amber-800",
  confirmado: "bg-emerald-100 text-emerald-800",
  concluido: "bg-blue-100 text-blue-800",
  cancelado: "bg-slate-200 text-slate-700 line-through",
  faltou: "bg-rose-100 text-rose-800",
};

function toLocalDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatHour(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function AgendaPage() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const [date, setDate] = useState(() => toLocalDateInput(new Date()));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Agendamento | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const dayStart = useMemo(() => new Date(`${date}T00:00:00`).toISOString(), [date]);
  const dayEnd = useMemo(() => new Date(`${date}T23:59:59`).toISOString(), [date]);

  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ["agendamentos", tenantId, date],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("id,cliente_id,servico_id,profissional_id,unidade_id,inicio,fim,status,preco,observacoes,pagamento_status,cliente:clientes(nome),servico:servicos(nome,cor,duracao_min,preco),profissional:profissionais(nome,cor)")
        .gte("inicio", dayStart)
        .lte("inicio", dayEnd)
        .order("inicio");
      if (error) throw error;
      return data as unknown as Agendamento[];
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-select", tenantId], enabled: !!tenantId,
    queryFn: async () => (await supabase.from("clientes").select("id,nome").order("nome")).data ?? [],
  });
  const { data: servicos = [] } = useQuery({
    queryKey: ["servicos-select", tenantId], enabled: !!tenantId,
    queryFn: async () => (await supabase.from("servicos").select("id,nome,duracao_min,preco,cor").eq("ativo", true).order("nome")).data ?? [],
  });
  const { data: profissionais = [] } = useQuery({
    queryKey: ["profissionais-select", tenantId], enabled: !!tenantId,
    queryFn: async () => (await supabase.from("profissionais").select("id,nome,cor").eq("ativo", true).order("nome")).data ?? [],
  });
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-select", tenantId], enabled: !!tenantId,
    queryFn: async () => (await supabase.from("unidades").select("id,nome").eq("ativo", true).order("nome")).data ?? [],
  });

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (a: Agendamento) => { setEditing(a); setOpen(true); };

  const sendWa = useServerFn(sendWhatsAppTemplate);

  const upsert = useMutation({
    mutationFn: async (input: {
      cliente_id: string; servico_id: string; profissional_id: string;
      unidade_id: string | null; data: string; hora: string; observacoes: string | null; status: Status;
    }) => {
      if (!tenantId) throw new Error("sem tenant");
      const servico = servicos.find((s) => s.id === input.servico_id);
      if (!servico) throw new Error("Serviço inválido");
      const inicio = new Date(`${input.data}T${input.hora}:00`);
      const fim = new Date(inicio.getTime() + servico.duracao_min * 60000);
      const payload = {
        cliente_id: input.cliente_id,
        servico_id: input.servico_id,
        profissional_id: input.profissional_id,
        unidade_id: input.unidade_id,
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        observacoes: input.observacoes,
        preco: servico.preco,
        status: input.status,
      };
      if (editing) {
        const { error } = await supabase.from("agendamentos").update(payload).eq("id", editing.id);
        if (error) throw error;
        return { id: editing.id, created: false };
      } else {
        const { data, error } = await supabase
          .from("agendamentos")
          .insert({ ...payload, tenant_id: tenantId })
          .select("id")
          .single();
        if (error) throw error;
        return { id: data.id as string, created: true };
      }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["agendamentos"] });
      setOpen(false); setEditing(null);
      toast.success(editing ? "Agendamento atualizado" : "Agendamento criado");
      if (res.created) {
        // envia confirmação automática via Meta WhatsApp sem bloquear UI
        sendWa({ data: { agendamento_id: res.id, tipo: "confirmacao" } })
          .then(() => toast.success("Confirmação enviada via WhatsApp"))
          .catch((e: Error) => {
            console.warn("[whatsapp auto]", e.message);
          });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("agendamentos").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agendamentos"] });
      toast.success("Status atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agendamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agendamentos"] });
      setDeleteId(null);
      toast.success("Agendamento removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const shiftDate = (delta: number) => {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + delta);
    setDate(toLocalDateInput(d));
  };

  const canCreate = clientes.length > 0 && servicos.length > 0 && profissionais.length > 0;

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Veja e gerencie os agendamentos do dia."
        onAdd={canCreate ? openCreate : undefined}
        addLabel="Novo agendamento"
      />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => shiftDate(-1)} aria-label="Dia anterior"><ChevronLeft className="w-4 h-4" /></Button>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        <Button variant="outline" size="icon" onClick={() => shiftDate(1)} aria-label="Próximo dia"><ChevronRight className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setDate(toLocalDateInput(new Date()))}>Hoje</Button>
      </div>

      {!canCreate && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm mb-6">
          Antes de criar agendamentos, cadastre pelo menos 1 <b>cliente</b>, 1 <b>serviço</b> e 1 <b>profissional</b>.
        </div>
      )}

      {isLoading ? (
        <p className="text-ink-soft text-sm">Carregando...</p>
      ) : agendamentos.length === 0 ? (
        <EmptyState
          title="Nada agendado para esse dia"
          description="Aproveite para criar um novo agendamento ou navegar para outra data."
          actionLabel={canCreate ? "Criar agendamento" : undefined}
          onAction={canCreate ? openCreate : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {agendamentos.map((a) => (
            <li key={a.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-brand-200 transition">
              <div className="w-20 shrink-0">
                <p className="font-display text-lg font-semibold">{formatHour(a.inicio)}</p>
                <p className="text-xs text-ink-soft">até {formatHour(a.fim)}</p>
              </div>
              <span className="w-1 self-stretch rounded-full hidden sm:block" style={{ background: a.servico?.cor ?? "#FF81AE" }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{a.cliente?.nome ?? "—"}</p>
                <p className="text-sm text-ink-soft truncate">{a.servico?.nome}</p>
                <p className="text-xs text-ink-soft mt-1 flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: a.profissional?.cor }} />
                  {a.profissional?.nome}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={a.status} onValueChange={(v) => updateStatus.mutate({ id: a.id, status: v as Status })}>
                  <SelectTrigger className={`h-8 text-xs border-0 ${STATUS_STYLE[a.status]}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AgendamentoActions agendamentoId={a.id} pagamentoStatus={a.pagamento_status ?? "nao_solicitado"} />
                <button onClick={() => openEdit(a)} className="p-1.5 text-ink-soft hover:text-ink rounded-md hover:bg-muted" aria-label="Editar"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setDeleteId(a.id)} className="p-1.5 text-ink-soft hover:text-destructive rounded-md hover:bg-muted" aria-label="Excluir"><Trash2 className="w-4 h-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar agendamento" : "Novo agendamento"}</DialogTitle></DialogHeader>
          <AgendamentoForm
            key={editing?.id ?? "new"}
            editing={editing}
            defaultDate={date}
            clientes={clientes as { id: string; nome: string }[]}
            servicos={servicos as { id: string; nome: string; duracao_min: number; preco: number; cor: string }[]}
            profissionais={profissionais as { id: string; nome: string; cor: string }[]}
            unidades={unidades as { id: string; nome: string }[]}
            onSubmit={(v) => upsert.mutate(v)}
            pending={upsert.isPending}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir agendamento?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && remove.mutate(deleteId)}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AgendamentoForm({
  editing, defaultDate, clientes, servicos, profissionais, unidades, onSubmit, pending, onCancel,
}: {
  editing: Agendamento | null;
  defaultDate: string;
  clientes: { id: string; nome: string }[];
  servicos: { id: string; nome: string; duracao_min: number; preco: number; cor: string }[];
  profissionais: { id: string; nome: string; cor: string }[];
  unidades: { id: string; nome: string }[];
  onSubmit: (v: { cliente_id: string; servico_id: string; profissional_id: string; unidade_id: string | null; data: string; hora: string; observacoes: string | null; status: Status }) => void;
  pending: boolean;
  onCancel: () => void;
}) {
  const initialData = editing ? toLocalDateInput(new Date(editing.inicio)) : defaultDate;
  const initialHora = editing
    ? new Date(editing.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "09:00";

  const [clienteId, setClienteId] = useState(editing?.cliente_id ?? "");
  const [servicoId, setServicoId] = useState(editing?.servico_id ?? "");
  const [profissionalId, setProfissionalId] = useState(editing?.profissional_id ?? "");
  const [unidadeId, setUnidadeId] = useState(editing?.unidade_id ?? "");
  const [status, setStatus] = useState<Status>(editing?.status ?? "pendente");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (!clienteId || !servicoId || !profissionalId) {
          toast.error("Selecione cliente, serviço e profissional");
          return;
        }
        onSubmit({
          cliente_id: clienteId,
          servico_id: servicoId,
          profissional_id: profissionalId,
          unidade_id: unidadeId || null,
          data: String(fd.get("data")),
          hora: String(fd.get("hora")),
          observacoes: String(fd.get("observacoes") ?? "").trim() || null,
          status,
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>Cliente *</Label>
        <Select value={clienteId} onValueChange={setClienteId}>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Serviço *</Label>
        <Select value={servicoId} onValueChange={setServicoId}>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>{servicos.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome} · {s.duracao_min}min</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Profissional *</Label>
        <Select value={profissionalId} onValueChange={setProfissionalId}>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>{profissionais.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {unidades.length > 0 && (
        <div className="space-y-2">
          <Label>Unidade</Label>
          <Select value={unidadeId} onValueChange={setUnidadeId}>
            <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
            <SelectContent>{unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="data">Data *</Label><Input id="data" name="data" type="date" required defaultValue={initialData} /></div>
        <div className="space-y-2"><Label htmlFor="hora">Hora *</Label><Input id="hora" name="hora" type="time" required defaultValue={initialHora} /></div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{(Object.keys(STATUS_LABEL) as Status[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" name="observacoes" rows={2} defaultValue={editing?.observacoes ?? ""} /></div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : (editing ? "Salvar" : "Criar")}</Button>
      </DialogFooter>
    </form>
  );
}

const PAGAMENTO_LABEL: Record<string, { label: string; cls: string }> = {
  nao_solicitado: { label: "Sem cobrança", cls: "bg-muted text-ink-soft" },
  aguardando: { label: "Aguardando pagamento", cls: "bg-amber-100 text-amber-800" },
  pendente: { label: "Pagamento pendente", cls: "bg-amber-100 text-amber-800" },
  pago: { label: "Pago ✓", cls: "bg-emerald-100 text-emerald-800" },
  falhou: { label: "Pagamento falhou", cls: "bg-rose-100 text-rose-800" },
};

function friendlyError(e: Error, fallback: string): string {
  const msg = e?.message ?? "";
  if (/WHATSAPP|whatsapp/i.test(msg) && /não configurado|not configured/i.test(msg)) {
    return "Integração com WhatsApp indisponível no momento.";
  }
  if (/MERCADO|mercado pago/i.test(msg) && /não configurado|not configured/i.test(msg)) {
    return "Integração de pagamento indisponível no momento.";
  }
  if (/GOOGLE|google/i.test(msg) && /não configurado|not configured/i.test(msg)) {
    return "Integração com Google Calendar indisponível no momento.";
  }
  if (/SUPABASE|service_role/i.test(msg)) {
    return "Serviço temporariamente indisponível. Tente novamente em instantes.";
  }
  if (/sem telefone/i.test(msg)) return "Cliente sem telefone cadastrado.";
  if (/sem preço/i.test(msg)) return "Defina um preço no agendamento para gerar o link.";
  if (/Conecte o Google/i.test(msg)) return msg;
  // Log raw para o dev, mas mostra fallback amigável ao usuário
  console.error("[integration error]", msg);
  return fallback;
}

function AgendamentoActions({ agendamentoId, pagamentoStatus }: { agendamentoId: string; pagamentoStatus: string }) {
  const qc = useQueryClient();
  const createMp = useServerFn(createMpPaymentLink);
  const syncGoogle = useServerFn(syncAgendamentoToGoogle);
  const sendWa = useServerFn(sendWhatsAppTemplate);
  const getStatus = useServerFn(getIntegrationsStatus);

  const { data: integrations } = useQuery({
    queryKey: ["integrations-status"],
    queryFn: () => getStatus(),
    staleTime: 60_000,
  });

  const mpEnabled = integrations?.mercadoPago ?? false;
  const gcEnabled = integrations?.googleCalendar ?? false;
  const waEnabled = integrations?.whatsApp ?? false;

  const mp = useMutation({
    mutationFn: () => createMp({ data: { agendamento_id: agendamentoId } }),
    onSuccess: async (res) => {
      qc.invalidateQueries({ queryKey: ["agendamentos"] });
      await navigator.clipboard.writeText(res.link).catch(() => undefined);
      toast.success("Link de pagamento criado e copiado!");
    },
    onError: (e: Error) => toast.error(friendlyError(e, "Não foi possível gerar o link de pagamento.")),
  });

  const gc = useMutation({
    mutationFn: () => syncGoogle({ data: { agendamento_id: agendamentoId } }),
    onSuccess: (res) => {
      if (res.ok) toast.success("Sincronizado com Google Calendar");
      else toast.error("Conecte o Google Calendar em Configurações");
    },
    onError: (e: Error) => toast.error(friendlyError(e, "Não foi possível sincronizar com o Google Calendar.")),
  });

  const wa = useMutation({
    mutationFn: (tipo: "confirmacao" | "lembrete" | "pagamento") =>
      sendWa({ data: { agendamento_id: agendamentoId, tipo } }),
    onSuccess: () => toast.success("Mensagem enviada via WhatsApp"),
    onError: (e: Error) => toast.error(friendlyError(e, "Não foi possível enviar a mensagem.")),
  });

  const pag = PAGAMENTO_LABEL[pagamentoStatus] ?? PAGAMENTO_LABEL.nao_solicitado;
  const anyAction = mpEnabled || gcEnabled || waEnabled;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 text-ink-soft hover:text-ink rounded-md hover:bg-muted" aria-label="Ações">
          <MoreVertical className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className={`text-xs px-2 py-1 mx-1 mb-1 rounded ${pag.cls}`}>{pag.label}</div>
        {!anyAction && (
          <div className="text-xs text-ink-soft px-2 py-3">
            Nenhuma integração configurada.
          </div>
        )}
        {waEnabled && (
          <>
            <DropdownMenuItem onClick={() => wa.mutate("confirmacao")} disabled={wa.isPending}>
              <MessageCircle className="w-4 h-4 mr-2" /> Enviar confirmação
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => wa.mutate("lembrete")} disabled={wa.isPending}>
              <Bell className="w-4 h-4 mr-2" /> Enviar lembrete
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => wa.mutate("pagamento")} disabled={wa.isPending}>
              <Receipt className="w-4 h-4 mr-2" /> Enviar cobrança
            </DropdownMenuItem>
          </>
        )}
        {mpEnabled && (
          <>
            {waEnabled && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => mp.mutate()} disabled={mp.isPending}>
              <CreditCard className="w-4 h-4 mr-2" /> {mp.isPending ? "Gerando..." : "Gerar link de pagamento"}
            </DropdownMenuItem>
          </>
        )}
        {gcEnabled && (
          <>
            {(mpEnabled || waEnabled) && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => gc.mutate()} disabled={gc.isPending}>
              <CalendarPlus className="w-4 h-4 mr-2" /> Sincronizar Google Calendar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
