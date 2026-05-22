import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Phone, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/lib/use-tenant";
import { PageHeader, EmptyState } from "@/components/crud/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/app/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Agenday" }] }),
  component: ClientesPage,
});

type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  observacoes: string | null;
};

function ClientesPage() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id,nome,telefone,email,data_nascimento,observacoes")
        .order("nome");
      if (error) throw error;
      return data as Cliente[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<Cliente>) => {
      if (!tenantId) throw new Error("sem tenant");
      if (editing) {
        const { error } = await supabase.from("clientes").update(input).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clientes").insert({ ...input, tenant_id: tenantId, nome: input.nome! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      setOpen(false); setEditing(null);
      toast.success(editing ? "Cliente atualizada" : "Cliente adicionada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      setDeleteId(null);
      toast.success("Cliente removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = clientes.filter((c) => c.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Sua base de clientes para agendar e relacionar."
        onAdd={() => { setEditing(null); setOpen(true); }}
        addLabel="Nova cliente"
      />

      <div className="mb-4">
        <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {isLoading ? (
        <p className="text-ink-soft text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search ? "Nenhuma cliente encontrada" : "Sem clientes ainda"}
          description={search ? "Tente outro nome." : "Comece cadastrando suas clientes para agilizar os agendamentos."}
          actionLabel={search ? undefined : "Adicionar primeira cliente"}
          onAction={search ? undefined : () => { setEditing(null); setOpen(true); }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <article key={c.id} className="bg-card border border-border rounded-xl p-5 hover:border-brand-200 transition">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold truncate">{c.nome}</h3>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(c); setOpen(true); }} className="p-1.5 text-ink-soft hover:text-ink rounded-md hover:bg-muted" aria-label="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-ink-soft hover:text-destructive rounded-md hover:bg-muted" aria-label="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-ink-soft">
                {c.telefone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{c.telefone}</p>}
                {c.email && <p className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5" />{c.email}</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Nova cliente"}</DialogTitle>
          </DialogHeader>
          <form
            id="cliente-form"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              upsert.mutate({
                nome: String(fd.get("nome") ?? "").trim(),
                telefone: String(fd.get("telefone") ?? "").trim() || null,
                email: String(fd.get("email") ?? "").trim() || null,
                data_nascimento: String(fd.get("data_nascimento") ?? "") || null,
                observacoes: String(fd.get("observacoes") ?? "").trim() || null,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2"><Label htmlFor="nome">Nome *</Label><Input id="nome" name="nome" required defaultValue={editing?.nome ?? ""} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="telefone">Telefone</Label><Input id="telefone" name="telefone" defaultValue={editing?.telefone ?? ""} placeholder="(11) 99999-9999" /></div>
              <div className="space-y-2"><Label htmlFor="data_nascimento">Nascimento</Label><Input id="data_nascimento" name="data_nascimento" type="date" defaultValue={editing?.data_nascimento ?? ""} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={editing?.email ?? ""} /></div>
            <div className="space-y-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" name="observacoes" rows={3} defaultValue={editing?.observacoes ?? ""} placeholder="Preferências, alergias, observações..." /></div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="cliente-form" disabled={upsert.isPending}>{upsert.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && remove.mutate(deleteId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
