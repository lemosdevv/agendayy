import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { encodeState, getValidAccessToken } from "./google-calendar.server";

export const getGoogleAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error("GOOGLE_CLIENT_ID não configurado");
    const { getRedirectUri } = await import("./google-calendar.server");
    const { userId, supabase } = context;
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", userId).maybeSingle();
    if (!profile?.tenant_id) throw new Error("Usuário sem tenant");
    const state = encodeState(userId, profile.tenant_id);
    const SCOPES = [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ].join(" ");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: getRedirectUri(),
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
  });

export const getGoogleConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data } = await supabase
      .from("google_calendar_tokens")
      .select("user_id,calendar_id,updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    return { connected: !!data, calendar_id: data?.calendar_id ?? null, updated_at: data?.updated_at ?? null };
  });

export const disconnectGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    await supabase.from("google_calendar_tokens").delete().eq("user_id", userId);
    return { ok: true };
  });

export const syncAgendamentoToGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ agendamento_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const auth = await getValidAccessToken(userId);
    if (!auth) return { ok: false, reason: "not_connected" as const };

    const { data: ag, error } = await supabase
      .from("agendamentos")
      .select("id,inicio,fim,observacoes,google_event_id,cliente:clientes(nome,email),servico:servicos(nome),profissional:profissionais(nome)")
      .eq("id", data.agendamento_id)
      .maybeSingle();
    if (error) throw error;
    if (!ag) throw new Error("Agendamento não encontrado");

    const cliente = ag.cliente as { nome: string; email: string | null } | null;
    const servico = (ag.servico as { nome: string } | null)?.nome ?? "Agendamento";
    const profissional = (ag.profissional as { nome: string } | null)?.nome ?? "";

    const eventBody = {
      summary: `${servico} — ${cliente?.nome ?? ""}`,
      description: `Profissional: ${profissional}${ag.observacoes ? `\n\nObs: ${ag.observacoes}` : ""}`,
      start: { dateTime: ag.inicio, timeZone: "America/Sao_Paulo" },
      end: { dateTime: ag.fim, timeZone: "America/Sao_Paulo" },
      ...(cliente?.email ? { attendees: [{ email: cliente.email, displayName: cliente.nome }] } : {}),
    };

    const isUpdate = !!ag.google_event_id;
    const url = isUpdate
      ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(auth.calendarId)}/events/${ag.google_event_id}`
      : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(auth.calendarId)}/events`;
    const res = await fetch(url, {
      method: isUpdate ? "PATCH" : "POST",
      headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(eventBody),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(`Google Calendar: ${JSON.stringify(result)}`);

    if (!isUpdate) {
      await supabase.from("agendamentos").update({ google_event_id: result.id }).eq("id", ag.id);
    }
    return { ok: true, eventId: result.id as string, htmlLink: result.htmlLink as string };
  });
