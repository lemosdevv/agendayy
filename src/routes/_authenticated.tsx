import { createFileRoute, Outlet, useRouterState, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGuard,
});

function AuthGuard() {
  const { session, loading } = useAuth();
  const { location } = useRouterState();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-warm">
        <div className="text-ink-soft">Carregando...</div>
      </div>
    );
  }

  if (!session) {
    const redirect = encodeURIComponent(location.href);
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-warm px-4">
        <div className="w-full max-w-md rounded-2xl bg-card border border-border p-8 shadow-sm text-center">
          <h1 className="font-display text-xl font-semibold text-ink">Sua sessão expirou</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Para continuar de onde você parou, faça login novamente.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/entrar" search={{ redirect } as never}>
              Entrar novamente
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
