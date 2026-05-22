export type TrialSeverity = "ok" | "warn" | "danger" | "expired";

export type TrialInfo = {
  daysLeft: number;
  totalDays: number;
  percent: number; // 0..100 (consumido)
  severity: TrialSeverity;
  expired: boolean;
};

export const TRIAL_DAYS = 15;

export function getTrialInfo(trialStartDate: string | Date | null | undefined): TrialInfo {
  const start = trialStartDate ? new Date(trialStartDate) : new Date();
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const elapsed = Math.floor((now.getTime() - start.getTime()) / msPerDay);
  const daysLeft = Math.max(0, TRIAL_DAYS - elapsed);
  const percent = Math.min(100, Math.round((elapsed / TRIAL_DAYS) * 100));
  const expired = daysLeft <= 0;
  let severity: TrialSeverity = "ok";
  if (expired) severity = "expired";
  else if (daysLeft <= 2) severity = "danger";
  else if (daysLeft <= 7) severity = "warn";
  return { daysLeft, totalDays: TRIAL_DAYS, percent, severity, expired };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
