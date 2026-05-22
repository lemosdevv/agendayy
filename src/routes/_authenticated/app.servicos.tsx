import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Clock, Tag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/lib/use-tenant";
import { PageHeader, EmptyState } from "@/components/crud/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/app/servicos")({
  head: () => ({ meta: [{ title: "Serviços — Agenday" }] }),
  component: ServicosPage,
});

type Servico = {
  id: string;
  nome: string;
  descricao: string | null;
  duracao_min: number;
  preco: number;
  cor: string;
  ativo: boolean;
};

const CORES = ["#FF81AE", "#A855F7", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

function formatBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ServicosPage() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Servico | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cor, setCor] = useState(CORES[0]);
  const [ativo, setAtivo] = useState(true);
  const [horas, setHoras] = useState(1);
  const [minutos, setMinutos] = useState(0);
  const [precoCentavos, setPrecoCentavos] = useState(0);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["servicos", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("servicos").select("*").order("nome");
      if (error) throw error;
      return data as Servico[];
    },
  });

  const openCreate = () => {
    setEditing(null); setCor(CORES[0]); setAtivo(true);
    setHoras(1); setMinutos(0); setPrecoCentavos(0);
    setOpen(true);
  };
  const openEdit = (s: Servico) => {
    setEditing(s); setCor(s.cor); setAtivo(s.ativo);
    setHoras(Math.floor(s.duracao_min / 60));
    setMinutos(s.duracao_min % 60);
    setPrecoCentavos(Math.round(Number(s.preco) * 100));
    setOpen(true);
  };

  const upsert = useMutation({
    mutationFn: async (input: Partial<Servico>) => {
      if (!tenantId) throw new Error("sem tenant");
      const payload = { ...input, cor, ativo };
      if (editing) {
        const { error } = await supabase.from("servicos").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("servicos").insert({ ...payload, tenant_id: tenantId, nome: input.nome!, duracao_min: input.duracao_min!, preco: input.preco! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
      setOpen(false); setEditing(null);
      toast.success(editing ? "Serviço atualizado" : "Serviço criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("servicos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
      setDeleteId(null);
      toast.success("Serviço removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Serviços" description="Configure os serviços que você oferece." onAdd={openCreate} addLabel="Novo serviço" />

      {isLoading ? (
        <p className="text-ink-soft text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <EmptyState title="Nenhum serviço ainda" description="Cadastre os serviços para que clientes possam agendar online." actionLabel="Adicionar primeiro serviço" onAction={openCreate} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <article key={s.id} className="bg-card border border-border rounded-xl p-5 hover:border-brand-200 transition">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.cor }} />
                  <h3 className="font-semibold truncate">{s.nome}</h3>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(s)} className="p-1.5 text-ink-soft hover:text-ink rounded-md hover:bg-muted" aria-label="Editar"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(s.id)} className="p-1.5 text-ink-soft hover:text-destructive rounded-md hover:bg-muted" aria-label="Excluir"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {s.descricao && <p className="text-sm text-ink-soft mt-2 line-clamp-2">{s.descricao}</p>}
              <div className="mt-3 flex items-center gap-4 text-sm text-ink-soft">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{s.duracao_min} min</span>
                <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />R$ {Number(s.preco).toFixed(2)}</span>
              </div>
              {!s.ativo && <span className="inline-block mt-3 text-xs px-2 py-0.5 rounded-full bg-muted text-ink-soft">Inativo</span>}
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle></DialogHeader>
          <form id="servico-form" onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const duracao = horas * 60 + minutos;
            if (duracao < 5) { toast.error("Duração mínima de 5 minutos"); return; }
            upsert.mutate({
              nome: String(fd.get("nome") ?? "").trim(),
              descricao: String(fd.get("descricao") ?? "").trim() || null,
              duracao_min: duracao,
              preco: precoCentavos / 100,
            });
          }} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="nome">Nome *</Label><Input id="nome" name="nome" required maxLength={120} defaultValue={editing?.nome ?? ""} placeholder="Ex: Aplicação de cílios" /></div>
            <div className="space-y-2"><Label htmlFor="descricao">Descrição</Label><Textarea id="descricao" name="descricao" rows={2} maxLength={500} defaultValue={editing?.descricao ?? ""} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Duração *</Label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-1">
                    <Input type="number" min={0} max={23} value={horas} onChange={(e) => setHoras(Math.max(0, Math.min(23, Number(e.target.value) || 0)))} />
                    <span className="text-sm text-ink-soft">h</span>
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <Input type="number" min={0} max={59} step={5} value={minutos} onChange={(e) => setMinutos(Math.max(0, Math.min(59, Number(e.target.value) || 0)))} />
                    <span className="text-sm text-ink-soft">min</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco">Preço *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft pointer-events-none">R$</span>
                  <Input
                    id="preco"
                    inputMode="numeric"
                    className="pl-10"
                    value={formatBRL(precoCentavos)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                      setPrecoCentavos(Number(digits) || 0);
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2">
                {CORES.map((c) => (
                  <button key={c} type="button" onClick={() => setCor(c)} className={`w-8 h-8 rounded-full ring-2 transition ${cor === c ? "ring-ink scale-110" : "ring-transparent"}`} style={{ background: c }} aria-label={`Cor ${c}`} />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between bg-muted/40 rounded-lg p-3">
              <Label htmlFor="ativo">Serviço ativo</Label>
              <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="servico-form" disabled={upsert.isPending}>{upsert.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir serviço?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && remove.mutate(deleteId)}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
