# Plano: Correções críticas para deploy

Vou corrigir os 3 bloqueadores identificados na análise anterior.

## 1. robots.txt — URL antiga

`public/robots.txt` aponta para `https://agendeei.lovable.app/sitemap.xml`. Atualizar para `https://agenday.lovable.app/sitemap.xml`.

## 2. Google OAuth — habilitar login/cadastro com Google

- Rodar `supabase--configure_social_auth` com `providers: ["google"]` (mantendo email habilitado, sem desabilitar).
- Adicionar botão "Continuar com Google" em `src/routes/entrar.tsx` e `src/routes/cadastro.tsx` usando `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app" })` via `@/integrations/lovable/index` (gerado pelo configure_social_auth).
- No cadastro com Google, o aceite de termos será registrado no primeiro login autenticado (chamando `recordTermsAcceptance` após retorno bem-sucedido), já que não há checkbox no fluxo OAuth — alternativa: exigir aceite prévio do checkbox antes de habilitar o botão Google. **Vou usar essa segunda opção** (checkbox obrigatório antes do Google) para manter consistência legal.

## 3. og:image e URL publicada

- `src/routes/__root.tsx`: trocar og:image de URL de preview por um asset estável servido do domínio publicado (`/og-default.png` referenciado como `https://agenday.lovable.app/og-default.png`). Vou reaproveitar `src/assets/logo.png` copiando para `public/og-default.png` (1200x630 ideal — se o logo não estiver nessa proporção, mantenho o que existe e marco como melhoria futura).
- **URL publicada (`agendeei.lovable.app` → `agenday.lovable.app`)**: isso é uma ação manual do usuário em **Publish → Settings → Slug**. Não há como alterar via código. Vou deixar instrução clara no fim.

## Arquivos a alterar

- `public/robots.txt` — atualizar URL do sitemap
- `src/routes/entrar.tsx` — botão Google + handler
- `src/routes/cadastro.tsx` — botão Google + handler (com gate no checkbox de termos)
- `src/routes/__root.tsx` — og:image estável
- `public/og-default.png` — copiar de assets (se viável) ou deixar TODO

## Ações de tooling

- `supabase--configure_social_auth({ providers: ["google"] })` — habilita Google OAuth gerenciado pela Lovable Cloud (sem precisar de credenciais do usuário).

## Ação manual do usuário (não posso fazer por código)

- Renomear o slug publicado de `agendeei` para `agenday` em **Publish → Settings**.
