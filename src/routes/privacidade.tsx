import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import {
  BRAND_NAME,
  SUPPORT_EMAIL,
  PRIVACY_EMAIL,
  PRIVACY_VERSION,
  LEGAL_EFFECTIVE_DATE,
} from "@/lib/legal-constants";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: `Política de Privacidade — ${BRAND_NAME}` },
      { name: "description", content: `Política de Privacidade da plataforma ${BRAND_NAME}.` },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPageLayout title="Política de Privacidade" version={PRIVACY_VERSION} effectiveDate={LEGAL_EFFECTIVE_DATE}>
      <p>
        Esta Política descreve como a {BRAND_NAME} coleta, utiliza, armazena e protege os dados
        pessoais dos seus usuários, em conformidade com a Lei Geral de Proteção de Dados Pessoais
        (LGPD — Lei nº 13.709/2018).
      </p>

      <h2>1. Dados que coletamos</h2>
      <ul>
        <li>Nome completo</li>
        <li>E-mail</li>
        <li>Dados de cadastro do estabelecimento</li>
        <li>Dados de assinatura e plano contratado</li>
        <li>Status de pagamento</li>
        <li>Logs técnicos da plataforma</li>
        <li>Endereço IP e user-agent (quando necessário para segurança e evidência de aceite)</li>
        <li>Dados de uso da plataforma (eventos de navegação, agendamentos criados, etc.)</li>
      </ul>

      <h2>2. Finalidades do tratamento</h2>
      <ul>
        <li>Criar e gerenciar sua conta</li>
        <li>Processar sua assinatura e cobranças recorrentes</li>
        <li>Liberar o acesso às funcionalidades contratadas</li>
        <li>Prevenir fraudes e uso indevido</li>
        <li>Melhorar a segurança e estabilidade da plataforma</li>
        <li>Prestar suporte ao usuário</li>
        <li>Cumprir obrigações legais e regulatórias</li>
      </ul>

      <h2>3. Pagamentos</h2>
      <p>
        Pagamentos são processados pelo gateway <strong>Mercado Pago</strong>. A {BRAND_NAME}{" "}
        <strong>não armazena</strong> número completo do cartão, código de segurança (CVV) ou
        quaisquer dados sensíveis do meio de pagamento. Recebemos apenas confirmações de status,
        identificadores externos e os últimos dígitos do cartão (quando disponíveis), suficientes
        para exibição ao usuário.
      </p>

      <h2>4. Compartilhamento de dados</h2>
      <p>Seus dados podem ser compartilhados com:</p>
      <ul>
        <li>Provedores de pagamento (para processar cobranças)</li>
        <li>Provedores de hospedagem e banco de dados (para operação técnica)</li>
        <li>Ferramentas estritamente necessárias para o funcionamento do serviço</li>
        <li>
          Autoridades públicas, quando exigido por lei, ordem judicial ou requisição administrativa
          legítima
        </li>
      </ul>

      <h2>5. Direitos do titular</h2>
      <p>De acordo com a LGPD, você tem direito a:</p>
      <ul>
        <li>Confirmação da existência de tratamento dos seus dados</li>
        <li>Acesso aos dados que tratamos</li>
        <li>Correção de dados incompletos, inexatos ou desatualizados</li>
        <li>Exclusão, quando aplicável e respeitada a base legal de retenção</li>
        <li>Portabilidade, quando aplicável</li>
        <li>Revogação do consentimento, quando o tratamento se basear em consentimento</li>
        <li>Informação sobre compartilhamento com terceiros</li>
      </ul>
      <p>
        Para exercer esses direitos, entre em contato por{" "}
        <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
      </p>

      <h2>6. Segurança</h2>
      <p>Adotamos medidas técnicas e organizacionais razoáveis, incluindo:</p>
      <ul>
        <li>Controle de acesso baseado em papéis e Row-Level Security no banco de dados</li>
        <li>Criptografia em trânsito (HTTPS/TLS)</li>
        <li>Segregação entre chaves públicas e secretas dos provedores</li>
        <li>Logs de segurança e auditoria de ações administrativas</li>
        <li>
          Tokenização de dados de cartão de crédito — nenhum dado sensível de cartão trafega pelos
          nossos servidores
        </li>
      </ul>

      <h2>7. Retenção</h2>
      <p>
        Mantemos seus dados pelo tempo necessário para cumprir as finalidades acima e obrigações
        legais aplicáveis. Após esse período, os dados são excluídos ou anonimizados.
      </p>

      <h2>8. Contato</h2>
      <p>
        Para dúvidas, solicitações ou exercício de direitos, entre em contato:
      </p>
      <ul>
        <li>
          Suporte geral: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </li>
        <li>
          Encarregado de Proteção de Dados (DPO): <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
        </li>
      </ul>
    </LegalPageLayout>
  );
}
