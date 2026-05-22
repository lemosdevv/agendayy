import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listAuditLog } from "@/lib/admin.functions";

export const Route = createFileRoute("/_super_admin/admin/auditoria")({
  component: AuditPage,
});

function AuditPage() {
  const fetchLog = useServerFn(listAuditLog);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit", page],
    queryFn: () => fetchLog({ data: { page, pageSize } }),
  });
  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Auditoria</h1>
        <p className="text-sm text-slate-500 mt-1">Registro de todas as ações administrativas.</p>
      </header>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Alvo</TableHead>
              <TableHead>Autor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 4 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
              ))
            ) : data?.rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-500">Sem registros.</TableCell></TableRow>
            ) : (
              data?.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{new Date(r.createdAt).toLocaleString("pt-BR")}</TableCell>
                  <TableCell><Badge variant="outline">{r.action}</Badge></TableCell>
                  <TableCell className="text-xs font-mono">{r.targetType}:{r.targetId?.slice(0, 8) ?? "—"}</TableCell>
                  <TableCell className="text-xs">{r.actor.fullName} <span className="text-slate-400">{r.actor.email}</span></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-500">{data ? `${data.total} eventos` : ""}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="text-slate-600">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      </div>
    </div>
  );
}
