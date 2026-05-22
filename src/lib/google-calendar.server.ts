import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ");

export function getRedirectUri(): string {
  const explicit = process.env.PUBLIC_BASE_URL;
  if (explicit) return `${explicit.replace(/\/$/, "")}/api/public/google/callback`;
  return "https://project--9cc3364d-9527-4f85-bd61-2a6ab765f1ad.lovable.app/api/public/google/callback";
}

const STATE_TTL_MS = 10 * 60 * 1000;

function signState(payload: string): string {
  const secret = process.env.OAUTH_STATE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("OAUTH_STATE_SECRET não configurado");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function encodeState(userId: string, tenantId: string): string {
  const payload = Buffer.from(JSON.stringify({ u: userId, t: tenantId, n: Date.now() })).toString("base64url");
  const sig = signState(payload);
  return `${payload}.${sig}`;
}

export function decodeState(state: string): { userId: string; tenantId: string } | null {
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return null;
  let expected: string;
  try {
    expected = signState(payload);
  } catch {
    return null;
  }
  try {
    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof parsed.n !== "number" || Date.now() - parsed.n > STATE_TTL_MS) return null;
    return { userId: parsed.u, tenantId: parsed.t };
  } catch {
    return null;
  }
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google token exchange: ${JSON.stringify(data)}`);
  return data;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google refresh: ${JSON.stringify(data)}`);
  return data;
}

export async function getValidAccessToken(userId: string): Promise<{ token: string; calendarId: string } | null> {
  const { data } = await supabaseAdmin
    .from("google_calendar_tokens")
    .select("access_token,refresh_token,expiry,calendar_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  const expiry = new Date(data.expiry).getTime();
  if (expiry - Date.now() > 60_000) {
    return { token: data.access_token, calendarId: data.calendar_id ?? "primary" };
  }
  const refreshed = await refreshAccessToken(data.refresh_token);
  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await supabaseAdmin
    .from("google_calendar_tokens")
    .update({ access_token: refreshed.access_token, expiry: newExpiry })
    .eq("user_id", userId);
  return { token: refreshed.access_token, calendarId: data.calendar_id ?? "primary" };
}
