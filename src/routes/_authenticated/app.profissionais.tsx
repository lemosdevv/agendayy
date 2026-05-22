import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/lib/use-tenant";
import { PageHeader, EmptyState } from "@/components/crud/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/app/profissionais")({
  head: () => ({ meta: [{ title: "Profissionais — Agenday" }] }),
  component: ProfissionaisPage,
});

type Profissional = {
  id: string; nome: string; email: string | null; telefone: string | null; cor: string; ativo: boolean;
};

const CORES = ["#FF81AE", "#A855F7", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

function formatPhoneBR(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function ProfissionaisPage() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Profissional | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cor, setCor] = useState(CORES[0]);
  const [ativo, setAtivo] = useState(true);
  const [telefone, setTelefone] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["profissionais", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("profissionais").select("id,nome,email,telefone,cor,ativo").order("nome");
      if (error) throw error;
      return data as Profissional[];
    },
  });

  const openCreate = () => { setEditing(null); setCor(CORES[0]); setAtivo(true); setTelefone(""); setOpen(true); };
  const openEdit = (p: Profissional) => { setEditing(p); setCor(p.cor); setAtivo(p.ativo); setTelefone(formatPhoneBR(p.telefone ?? "")); setOpen(true); };

  const upsert = useMutation({
    mutationFn: async (input: Partial<Profissional>) => {
      if (!tenantId) throw new Error("sem tenant");
      const payload = { ...input, cor, ativo };
      if (editing) {
        const { error } = await supabase.from("profissionais").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profissionais").insert({ ...payload, tenant_id: tenantId, nome: input.nome! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profissionais"] });
      setOpen(false); setEditing(null);
      toast.success(editing ? "Profissional atualizado" : "Profissional adicionado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profissionais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profissionais"] });
      setDeleteId(null);
      toast.success("Profissional removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Profissionais" description="Quem atende na sua equipe." onAdd={openCreate} addLabel="Novo profissional" />

      {isLoading ? (
        <p className="text-ink-soft text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <EmptyState title="Nenhum profissional ainda" description="Adicione quem realiza os atendimentos — pode ser só você mesma." actionLabel="Adicionar profissional" onAction={openCreate} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <article key={p.id} className="bg-card border border-border rounded-xl p-5 hover:border-brand-200 transition">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-full grid place-items-center text-white font-semibold shrink-0" style={{ background: p.cor }}>
                  {p.nome.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold truncate">{p.nome}</h3>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-ink-soft hover:text-ink rounded-md hover:bg-muted" aria-label="Editar"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-ink-soft hover:text-destructive rounded-md hover:bg-muted" aria-label="Excluir"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="mt-1 space-y-1 text-sm text-ink-soft">
                    {p.telefone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{p.telefone}</p>}
                    {p.email && <p className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5" />{p.email}</p>}
                  </div>
                  {!p.ativo && <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-muted text-ink-soft">Inativo</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar profissional" : "Novo profissional"}</DialogTitle></DialogHeader>
          <form id="prof-form" onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            upsert.mutate({
              nome: String(fd.get("nome") ?? "").trim().slice(0, 256),
              email: (String(fd.get("email") ?? "").trim() || null)?.slice(0, 256) || null,
              telefone: telefone.trim() || null,
            });
          }} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="nome">Nome *</Label><Input id="nome" name="nome" required maxLength={256} defaultValue={editing?.nome ?? ""} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  inputMode="tel"
                  placeholder="(11) 91234-5678"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhoneBR(e.target.value))}
                />
              </div>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" maxLength={256} defaultValue={editing?.email ?? ""} /></div>
            </div>
            <div className="space-y-2">
              <Label>Cor na agenda</Label>
              <div className="flex gap-2">
                {CORES.map((c) => (
                  <button key={c} type="button" onClick={() => setCor(c)} className={`w-8 h-8 rounded-full ring-2 transition ${cor === c ? "ring-ink scale-110" : "ring-transparent"}`} style={{ background: c }} aria-label={`Cor ${c}`} />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between bg-muted/40 rounded-lg p-3">
              <Label htmlFor="ativo">Profissional ativo</Label>
              <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="prof-form" disabled={upsert.isPending}>{upsert.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir profissional?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && remove.mutate(deleteId)}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
