import { useAuth } from "@/lib/auth-context";

export function useTenantId(): string | null {
  const { profile } = useAuth();
  return profile?.tenant_id ?? null;
}
