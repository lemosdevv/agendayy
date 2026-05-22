import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logoAgenday from "@/assets/logo.png";

interface Props {
  title: string;
  version: string;
  effectiveDate: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, version, effectiveDate, children }: Props) {
  return (
    <div className="min-h-screen bg-surface-warm">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <Link to="/" aria-label="Início">
            <img src={logoAgenday} alt="Agenday" className="h-10 w-auto" />
          </Link>
          <Link to="/" className="text-sm text-ink-soft hover:text-ink">
            Voltar
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <article className="bg-card border border-border rounded-2xl p-6 sm:p-10 shadow-sm">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">{title}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Versão {version} — vigente a partir de {effectiveDate}
          </p>
          <div className="mt-8 prose prose-sm sm:prose-base max-w-none prose-headings:font-display prose-headings:text-ink prose-p:text-ink-soft prose-li:text-ink-soft prose-strong:text-ink">
            {children}
          </div>
        </article>
      </main>
    </div>
  );
}
