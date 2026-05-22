// Server-side mask utilities for admin views
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}${"*".repeat(Math.max(1, user.length - visible.length))}@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export function maskId(id: string | null | undefined, keep = 6): string {
  if (!id) return "—";
  return id.length <= keep ? id : `…${id.slice(-keep)}`;
}

export const PLAN_PRICES: Record<string, number> = {
  trial: 0,
  starter: 49,
  pro: 79,
  business: 149,
  active: 79, // legacy fallback
};

export function planPrice(plan: string | null | undefined): number {
  if (!plan) return 0;
  return PLAN_PRICES[plan] ?? 0;
}
