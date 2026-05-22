import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: number | string | null | undefined;
  icon: LucideIcon;
  loading?: boolean;
  color?: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate" | "indigo" | "teal";
  format?: "number" | "currency";
};

const COLORS: Record<NonNullable<Props["color"]>, string> = {
  blue: "bg-blue-100 text-blue-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  violet: "bg-violet-100 text-violet-700",
  slate: "bg-slate-200 text-slate-700",
  indigo: "bg-indigo-100 text-indigo-700",
  teal: "bg-teal-100 text-teal-700",
};

export function MetricCard({ label, value, icon: Icon, loading, color = "blue", format = "number" }: Props) {
  const display =
    value == null ? "—" :
    format === "currency"
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(value))
      : new Intl.NumberFormat("pt-BR").format(Number(value));
  return (
    <Card className="p-5 flex items-start justify-between gap-4 hover:shadow-sm transition">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</p>
        {loading ? <Skeleton className="h-9 w-24 mt-2" /> : (
          <p className="text-3xl font-semibold text-slate-900 mt-1 tabular-nums">{display}</p>
        )}
      </div>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", COLORS[color])}>
        <Icon className="w-5 h-5" />
      </div>
    </Card>
  );
}
