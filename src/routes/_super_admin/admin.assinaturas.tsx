import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { listAdminTenants, updateTenantSubscription } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_super_admin/admin/assinaturas")({
  component: AdminSubscriptionsPage,
});

type Action = { tenantId: string; tenantName: string; type: "cancel" | "reactivate" | "change_plan"; plan?: string } | null;

function AdminSubscriptionsPage() {
  const list = useServerFn(listAdminTenants);
  const update = useServerFn(updateTenantSubscription);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [action, setAction] = useState<Action>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "tenants", { search, status, plan, page }],
    queryFn: () => list({ data: { search: search || undefined, status, plan, page, pageSize } }),
  });

  const mutation = useMutation({
    mutationFn: () => update({ data: { tenantId: action!.tenantId, action: action!.type, plan: action!.plan } }),
    onSuccess: () => {
      toast.success("Assinatura atualizada");
      qc.invalidateQueries({ queryKey: ["admin"] });
      setAction(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  const confirmText = action?.type === "cancel"
    ? "Esta ação cancela a assinatura e desativa o estabelecimento imediatamente. Pode ser revertida depois."
    : action?.type === "reactivate"
      ? "O estabelecimento voltará a ter assinatura ativa."
      : `O plano será alterado para "${action?.plan}".`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Assinaturas</h1>
        <p className="text-sm text-slate-500 mt-1">Planos e status dos estabelecimentos.</p>
      </header>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar nome ou slug" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={plan} onValueChange={(v) => { setPlan(v); setPage(1); }}>
            <SelectTrigger className="sm:w-40"><SelectValue placeholder="Plano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos planos</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="active">Active (legado)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="canceled">Cancelada</SelectItem>
              <SelectItem value="overdue">Vencida</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-rose-700">Erro ao carregar.</p>
            <Button variant="outline" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estabelecimento</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 7 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                ))
              ) : data?.rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-500">Nada encontrado.</TableCell></TableRow>
              ) : (
                data?.rows.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-slate-500">/{t.slug}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{t.owner.fullName}</p>
                      <p className="text-xs text-slate-500 font-mono">{t.owner.email}</p>
                    </TableCell>
                    <TableCell><Badge variant="outline">{t.plan}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={t.planStatus === "active" ? "default" : t.planStatus === "canceled" ? "destructive" : "secondary"}>{t.planStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{new Date(t.trialStartDate).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="tabular-nums">{t.mrr.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {t.planStatus !== "canceled" ? (
                          <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => setAction({ tenantId: t.id, tenantName: t.name, type: "cancel" })}>Cancelar</Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setAction({ tenantId: t.id, tenantName: t.name, type: "reactivate" })}>Reativar</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-500">{data ? `${data.total} assinaturas` : ""}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="text-slate-600">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!action}
        onOpenChange={(o) => !o && setAction(null)}
        title={action?.type === "cancel" ? `Cancelar assinatura de ${action.tenantName}?` : action?.type === "reactivate" ? `Reativar ${action.tenantName}?` : "Alterar plano?"}
        description={confirmText}
        destructive={action?.type === "cancel"}
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate()}
        confirmLabel={action?.type === "cancel" ? "Sim, cancelar" : "Confirmar"}
      />
    </div>
  );
}
