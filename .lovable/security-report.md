# Relatório de Hardening de Segurança — Final

## Resumo executivo

5 fases concluídas. App passou de "funcional" para "auditável" em segurança de pagamento, autenticação e LGPD.

---

## Fase 1 — Termos + Privacidade (LGPD)

**Arquivos:**
- `src/lib/legal-constants.ts` — `TERMS_VERSION`, `PRIVACY_VERSION`
- `src/lib/legal.functions.ts` — `recordTermsAcceptance` (server fn)
- `src/components/LegalPageLayout.tsx`
- `src/routes/termos.tsx`, `src/routes/privacidade.tsx`
- `src/routes/cadastro.tsx` (checkbox obrigatório)

**Tabela nova:** `terms_acceptances` (user_id, terms_version, privacy_version, ip_address, user_agent). RLS: usuário lê só o próprio; insert via service_role.

---

## Fase 2 — Webhook MP (HMAC + revalidação)

**Arquivos:**
- `src/routes/api/public/mp/webhook.ts`
- `src/routes/api/public/mp/plan-webhook.ts`

**Garantias:**
- HMAC `x-signature` validado com `timingSafeEqual`.
- Refetch obrigatório em `payments.mercadopago.com` antes de marcar `pago`.
- Validação de `transaction_amount` × valor no banco, `currency_id == "BRL"`, `external_reference`.
- Deduplicação por `external_id` (rejeita reprocesso).

---

## Fase 3 — Idempotência

**Migration:** coluna `idempotency_key` em `tenant_subscriptions` + índice único `(tenant_id, plan, idempotency_key)`.

**Arquivos:** `src/lib/plan-billing.functions.ts`
- `Idempotency-Key` header em toda chamada MP.
- Reuso de tentativa <5 min.
- `amount` lido do servidor, nunca do cliente.
- Timeout 15s via `AbortController`.
- Mensagens genéricas ao cliente.

---

## Fase 4 — Auth mais forte

**Arquivos:**
- `src/lib/password-policy.ts`
- `src/routes/entrar.tsx`, `src/routes/cadastro.tsx`

**Config:** `password_hibp_enabled: true` no Supabase Auth.

**Garantias:**
- Senha ≥8 chars, letras + números.
- Email normalizado (`trim().toLowerCase()`).
- Mensagens genéricas — sem enumeração de usuários.

---

## Fase 5 — Security logs

**Tabela nova:** `security_logs` (event_type, severity, user_id, tenant_id, ip_address, user_agent, metadata). RLS: só super_admin lê; só service_role escreve.

**Arquivos:**
- `src/lib/security-log.server.ts` — `logSecurityEvent` (best-effort, silencioso)
- `src/lib/security-log.functions.ts` — `logAuthEvent` (email SHA-256)

**Eventos instrumentados:** `auth.signin.success/failed`, `terms.accepted`, `mp.webhook.invalid_signature/duplicate/amount.mismatch`, `subscription.authorized/paid/cancelled`.

---

## Fase 6 (bônus) — RLS hardening

Migration ajustou todas as policies de `public`/`anon` para `authenticated`. `EXECUTE` revogado de `anon` em todas as funções SECURITY DEFINER e triggers.

**Linter:** 9 → 6 warnings (os 6 restantes são helpers RLS que precisam ser executáveis por `authenticated`; risco aceito, documentado em `mem://security`).

---

## Secrets em uso

| Nome | Uso |
|---|---|
| `MERCADO_PAGO_ACCESS_TOKEN` | Server-only, chamadas à API MP |
| `MERCADO_PAGO_PUBLIC_KEY` | Frontend (publicável) |
| `MERCADOPAGO_WEBHOOK_SECRET` | HMAC do webhook |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (admin client) |
| `GOOGLE_CLIENT_ID/SECRET` | OAuth Google |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business |
| `LOVABLE_API_KEY` | AI Gateway |

Nenhum secret está hardcoded no bundle.

---

## Roteiro de teste manual

1. **Cadastro:** criar conta sem marcar checkbox → botão desabilitado. Marcar → conta criada, registro em `terms_acceptances`.
2. **Login:** senha errada → "E-mail ou senha inválidos" (genérico). Verificar `security_logs` com `auth.signin.failed`.
3. **Pagamento aprovado:** assinar plano → webhook MP → status `authorized` em `tenant_subscriptions`. Log `subscription.authorized`.
4. **Pagamento duplicado:** clicar botão 2x rápido → única assinatura criada (idempotency).
5. **Webhook adulterado:** chamar webhook com `x-signature` inválido → 401, log `mp.webhook.invalid_signature`.
6. **Cancelamento:** cancelar no MP → webhook → status `cancelled`. Log `subscription.cancelled`.

---

## Riscos restantes (aceitos)

1. **Sem rate limit no backend.** Mitigação futura: Cloudflare WAF / Turnstile no login+cadastro.
2. **Lint 0029** em funções SECURITY DEFINER que precisam ser executáveis por `authenticated` para RLS funcionar.
3. **Webhooks públicos por design** em `/api/public/mp/*` — protegidos por HMAC, não por auth.
4. **2FA não implementado** — próximo passo recomendado.

---

## Próximos passos sugeridos (não feitos)

- Turnstile (CAPTCHA) em `/entrar` e `/cadastro`.
- 2FA TOTP para `owner` e `super_admin`.
- Painel `/super-admin/security-logs` para visualizar `security_logs`.
- Alerta automático (email/Slack) em eventos `severity = critical`.
