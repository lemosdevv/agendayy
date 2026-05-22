import { createFileRoute, redirect } from "@tanstack/react-router";
import { decodeState, exchangeCodeForTokens } from "@/lib/google-calendar.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/google/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        const redirectTo = (msg: string, ok = false) =>
          new Response(null, {
            status: 302,
            headers: {
              Location: `/app/configuracoes?google=${ok ? "ok" : "erro"}&msg=${encodeURIComponent(msg)}`,
            },
          });

        if (error) return redirectTo(error);
        if (!code || !state) return redirectTo("missing_code_or_state");

        const decoded = decodeState(state);
        if (!decoded) return redirectTo("invalid_state");

        try {
          const tokens = await exchangeCodeForTokens(code);
          if (!tokens.refresh_token) {
            return redirectTo("sem_refresh_token_revogue_acesso_e_tente_novamente");
          }
          const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
          await supabaseAdmin.from("google_calendar_tokens").upsert(
            {
              user_id: decoded.userId,
              tenant_id: decoded.tenantId,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expiry,
              calendar_id: "primary",
            },
            { onConflict: "user_id" },
          );
          return redirectTo("conectado", true);
        } catch (e) {
          console.error("Google OAuth callback error:", e);
          return redirectTo("token_exchange_failed");
        }
      },
    },
  },
});
