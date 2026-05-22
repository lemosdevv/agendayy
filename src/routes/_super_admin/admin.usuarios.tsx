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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { getAdminUserDetail, listAdminUsers, setUserActive } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_super_admin/admin/usuarios")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const list = useServerFn(listAdminUsers);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "users", { search, status, page }],
    queryFn: () => list({ data: { search: search || undefined, status, page, pageSize } }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Usuários</h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie todos os usuários da plataforma.</p>
      </header>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou email"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v as never); setPage(1); }}>
            <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-rose-700">Erro ao carregar usuários.</p>
            <Button variant="outline" className="mt-2" onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Estabelecimento</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-500">Nenhum usuário encontrado.</TableCell></TableRow>
              ) : (
                data?.rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell className="text-slate-600 font-mono text-xs">{u.email}</TableCell>
                    <TableCell className="text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <Badge variant={u.accountActive ? "default" : "secondary"}>
                        {u.accountActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-700">{u.tenantName}</TableCell>
                    <TableCell><Badge variant="outline">{u.plan}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={u.subscriptionStatus === "active" ? "default" : u.subscriptionStatus === "canceled" ? "destructive" : "secondary"}>
                        {u.subscriptionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedId(u.id)}>Detalhes</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-500">{data ? `${data.total} usuários` : ""}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="text-slate-600">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      </div>

      {selectedId && <UserDetailModal userId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function UserDetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const getDetail = useServerFn(getAdminUserDetail);
  const toggle = useServerFn(setUserActive);
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => getDetail({ data: { userId } }),
  });

  const mutation = useMutation({
    mutationFn: (active: boolean) => toggle({ data: { userId, active } }),
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["admin"] });
      setConfirmOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isActive = data?.profile.onboarded;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do usuário</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="space-y-3"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-32 w-full" /></div>
        ) : (
          <Tabs defaultValue="profile">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="subscription">Assinatura</TabsTrigger>
              <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              <TabsTrigger value="actions">Ações</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-2 mt-4">
              <Field label="Nome" value={data.profile.fullName ?? "—"} />
              <Field label="Email" value={data.profile.email ?? "—"} />
              <Field label="Telefone" value={data.profile.phone ?? "—"} />
              <Field label="Cadastro" value={new Date(data.profile.createdAt).toLocaleString("pt-BR")} />
              <Field label="Onboarded" value={data.profile.onboarded ? "Sim" : "Não"} />
              <div>
                <p className="text-xs text-slate-500 mt-3">Papéis</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.roles.length === 0 ? <span className="text-sm text-slate-400">Nenhum</span> :
                    data.roles.map((r, i) => <Badge key={i} variant="outline">{r.role}</Badge>)}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-2 mt-4">
              {data.tenant ? (
                <>
                  <Field label="Estabelecimento" value={data.tenant.name} />
                  <Field label="Slug" value={data.tenant.slug} />
                  <Field label="Plano" value={data.tenant.plan} />
                  <Field label="Status" value={data.tenant.planStatus} />
                  <Field label="Trial iniciado" value={new Date(data.tenant.trialStart).toLocaleDateString("pt-BR")} />
                </>
              ) : <p className="text-sm text-slate-500">Sem estabelecimento associado.</p>}
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              {data.recentAppointments.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum agendamento/pagamento.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentAppointments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs">{new Date(a.inicio).toLocaleString("pt-BR")}</TableCell>
                        <TableCell>{a.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                        <TableCell><Badge variant="outline">{a.pagamentoStatus}</Badge></TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{a.pagamentoIdMasked}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="actions" className="mt-4 space-y-3">
              <div className="rounded-lg border p-4">
                <p className="font-medium text-sm">{isActive ? "Desativar usuário" : "Reativar usuário"}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {isActive
                    ? "Marca o usuário como inativo. Ele perde acesso ao painel até ser reativado."
                    : "Reativa o acesso do usuário ao painel."}
                </p>
                <Button
                  variant={isActive ? "destructive" : "default"}
                  className="mt-3"
                  onClick={() => setConfirmOpen(true)}
                >
                  {isActive ? "Desativar conta" : "Reativar conta"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={isActive ? "Desativar este usuário?" : "Reativar este usuário?"}
          description={isActive
            ? "O usuário perderá imediatamente acesso ao painel. Esta ação pode ser revertida."
            : "O usuário voltará a ter acesso ao painel."}
          destructive={isActive}
          loading={mutation.isPending}
          onConfirm={() => mutation.mutate(!isActive)}
          confirmLabel={isActive ? "Sim, desativar" : "Sim, reativar"}
        />
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-100 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium text-right">{value}</span>
    </div>
  );
}
