// Política de senha do Agenday.
// Mínimo 8 caracteres com pelo menos uma letra e um número.
// HIBP (Have I Been Pwned) é validado no servidor pelo Supabase Auth.

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES_TEXT =
  "Mínimo 8 caracteres, com pelo menos uma letra e um número.";

export function validatePassword(password: string): string | null {
  if (typeof password !== "string") return "Senha inválida.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (password.length > 72) {
    // bcrypt trunca em 72 bytes; evitar senhas que dão falsa sensação de segurança.
    return "A senha deve ter no máximo 72 caracteres.";
  }
  if (!/[A-Za-zÀ-ÿ]/.test(password)) {
    return "A senha deve conter pelo menos uma letra.";
  }
  if (!/[0-9]/.test(password)) {
    return "A senha deve conter pelo menos um número.";
  }
  return null;
}

/**
 * Converte erros do Supabase Auth em mensagens genéricas em PT-BR.
 * Nunca expõe se o e-mail existe ou não (evita user enumeration).
 */
export function genericAuthErrorMessage(rawMessage: string | undefined): string {
  const msg = (rawMessage ?? "").toLowerCase();
  if (msg.includes("pwned") || msg.includes("compromised") || msg.includes("breach")) {
    return "Essa senha apareceu em vazamentos públicos. Escolha outra mais segura.";
  }
  if (msg.includes("weak") || msg.includes("password should") || msg.includes("password is too")) {
    return "Senha muito fraca. Use ao menos 8 caracteres com letras e números.";
  }
  if (msg.includes("rate") || msg.includes("too many")) {
    return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  }
  if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  }
  // Default: mensagem genérica para login (não diz se é email ou senha errados).
  return "E-mail ou senha incorretos.";
}
