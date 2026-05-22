import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  onAdd,
  addLabel = "Adicionar",
}: {
  title: string;
  description?: string;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-semibold">{title}</h1>
        {description && <p className="text-ink-soft text-sm mt-1">{description}</p>}
      </div>
      {onAdd && (
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4" />
          {addLabel}
        </Button>
      )}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="text-ink-soft text-sm mt-2 max-w-md mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5">
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
