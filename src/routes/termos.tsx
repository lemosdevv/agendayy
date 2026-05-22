import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import {
  BRAND_NAME,
  SUPPORT_EMAIL,
  LEGAL_VENUE,
  SAAS_DESCRIPTION,
  TERMS_VERSION,
  LEGAL_EFFECTIVE_DATE,
} from "@/lib/legal-constants";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: `Termos de Uso — ${BRAND_NAME}` },
      { name: "description", content: `Termos de Uso da plataforma ${BRAND_NAME}.` },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPageLayout title="Termos de Uso" version={TERMS_VERSION} effectiveDate={LEGAL_EFFECTIVE_DATE}>
      <h2>1. Aceitação dos Termos</h2>
      <p>
        Ao criar uma conta, acessar ou utilizar a plataforma {BRAND_NAME}, o usuário declara que leu,
        compreendeu e concorda com estes Termos de Uso e com a Política de Privacidade.
      </p>
      <p>
        Caso não concorde com qualquer condição aqui prevista, o usuário não deverá utilizar a
        plataforma.
      </p>

      <h2>2. Sobre a Plataforma</h2>
      <p>
        A {BRAND_NAME} é uma plataforma SaaS que oferece {SAAS_DESCRIPTION} mediante assinatura
        mensal.
      </p>
      <p>
        A plataforma poderá receber atualizações, melhorias, correções, alterações de
        funcionalidades e ajustes técnicos a qualquer momento, visando segurança, estabilidade e
        melhoria da experiência do usuário.
      </p>

      <h2>3. Cadastro e Conta do Usuário</h2>
      <p>
        Para utilizar a plataforma, o usuário deverá criar uma conta informando dados verdadeiros,
        completos e atualizados.
      </p>
      <p>
        O usuário é responsável por manter a confidencialidade de suas credenciais de acesso,
        incluindo login e senha.
      </p>
      <p>
        O usuário concorda em notificar imediatamente a {BRAND_NAME} caso identifique uso não
        autorizado de sua conta.
      </p>
      <p>
        A {BRAND_NAME} poderá suspender ou encerrar contas que apresentem informações falsas, uso
        indevido, fraude, tentativa de violação de segurança ou descumprimento destes Termos.
      </p>

      <h2>4. Assinatura e Cobrança Recorrente</h2>
      <p>
        O acesso às funcionalidades pagas da plataforma depende da contratação de uma assinatura
        mensal.
      </p>
      <p>
        Ao contratar um plano pago, o usuário autoriza a cobrança recorrente mensal no método de
        pagamento informado, de acordo com o valor e as condições apresentadas no momento da
        contratação.
      </p>
      <p>
        As cobranças são processadas por provedor externo de pagamento, atualmente Mercado Pago,
        podendo ser substituído ou complementado por outro provedor no futuro.
      </p>
      <p>
        A {BRAND_NAME} não armazena número completo de cartão, código de segurança ou dados
        sensíveis do cartão do usuário. O processamento do pagamento é realizado pelo gateway de
        pagamento contratado.
      </p>

      <h2>5. Falha de Pagamento</h2>
      <p>
        Caso uma cobrança seja recusada, expirada, contestada, cancelada ou não aprovada, a
        assinatura poderá permanecer pendente, ser suspensa ou cancelada.
      </p>
      <p>
        A {BRAND_NAME} poderá tentar realizar nova cobrança, solicitar atualização do método de
        pagamento ou limitar o acesso às funcionalidades pagas até a regularização.
      </p>

      <h2>6. Cancelamento</h2>
      <p>
        O usuário poderá cancelar sua assinatura conforme as opções disponíveis na plataforma ou
        entrando em contato pelo suporte em <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
      <p>
        Após o cancelamento, o acesso às funcionalidades pagas poderá permanecer ativo até o fim do
        período já pago, salvo disposição diferente informada no momento do cancelamento.
      </p>
      <p>
        O cancelamento impede cobranças futuras, mas não gera automaticamente reembolso de períodos
        já utilizados.
      </p>

      <h2>7. Reembolsos</h2>
      <p>
        Pedidos de reembolso serão analisados conforme a legislação aplicável, as regras comerciais
        da {BRAND_NAME} e as condições do plano contratado.
      </p>
      <p>
        Para solicitar análise de reembolso, o usuário deverá entrar em contato pelo e-mail{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, informando dados da conta, data da
        cobrança e motivo da solicitação.
      </p>

      <h2>8. Uso Permitido</h2>
      <p>
        O usuário concorda em utilizar a plataforma apenas para fins lícitos e de acordo com estes
        Termos.
      </p>
      <p>É proibido:</p>
      <ul>
        <li>Utilizar a plataforma para atividades ilegais, fraudulentas ou abusivas.</li>
        <li>Tentar acessar contas, sistemas, servidores ou dados de terceiros sem autorização.</li>
        <li>Realizar engenharia reversa, cópia, exploração indevida ou tentativa de invasão.</li>
        <li>Interferir na estabilidade, disponibilidade ou segurança da plataforma.</li>
        <li>Utilizar automações abusivas, scraping não autorizado ou sobrecarga proposital.</li>
        <li>Compartilhar acesso de forma indevida quando o plano não permitir.</li>
      </ul>

      <h2>9. Suspensão ou Encerramento de Acesso</h2>
      <p>A {BRAND_NAME} poderá suspender ou encerrar o acesso do usuário caso identifique:</p>
      <ul>
        <li>Violação destes Termos.</li>
        <li>Suspeita de fraude.</li>
        <li>Tentativa de burlar pagamento.</li>
        <li>Uso abusivo da plataforma.</li>
        <li>Risco à segurança do sistema, de outros usuários ou da empresa.</li>
      </ul>

      <h2>10. Disponibilidade da Plataforma</h2>
      <p>
        A {BRAND_NAME} buscará manter a plataforma disponível e funcional, mas não garante
        disponibilidade ininterrupta.
      </p>
      <p>
        Poderão ocorrer interrupções por manutenção, atualizações, falhas técnicas, instabilidades
        de terceiros, indisponibilidade de provedores de pagamento, serviços de hospedagem ou
        eventos fora do controle razoável da empresa.
      </p>

      <h2>11. Propriedade Intelectual</h2>
      <p>
        Todos os direitos sobre a plataforma, incluindo marca, layout, código, funcionalidades,
        textos, imagens, bancos de dados, fluxos e demais elementos, pertencem à {BRAND_NAME} ou aos
        seus licenciadores.
      </p>
      <p>
        O uso da plataforma não concede ao usuário qualquer direito de propriedade intelectual,
        exceto o direito limitado de utilização conforme o plano contratado.
      </p>

      <h2>12. Dados e Privacidade</h2>
      <p>
        O tratamento de dados pessoais será realizado conforme a Política de Privacidade da{" "}
        {BRAND_NAME} e a legislação aplicável, incluindo a Lei Geral de Proteção de Dados Pessoais —
        LGPD.
      </p>
      <p>
        Ao utilizar a plataforma, o usuário declara estar ciente de que determinados dados poderão
        ser tratados para criação de conta, autenticação, cobrança, suporte, segurança, prevenção a
        fraude, cumprimento legal e melhoria dos serviços.
      </p>

      <h2>13. Segurança</h2>
      <p>
        A {BRAND_NAME} adota medidas técnicas e organizacionais razoáveis para proteger a plataforma
        e os dados dos usuários.
      </p>
      <p>
        O usuário também é responsável por proteger suas credenciais, utilizar senhas fortes, evitar
        compartilhamento de acesso e manter seus dispositivos seguros.
      </p>

      <h2>14. Integrações com Terceiros</h2>
      <p>
        A plataforma poderá utilizar serviços de terceiros, incluindo gateway de pagamento,
        hospedagem, banco de dados, autenticação, análise, comunicação e suporte.
      </p>
      <p>
        A disponibilidade e funcionamento desses serviços podem estar sujeitos aos termos, políticas
        e condições dos respectivos terceiros.
      </p>

      <h2>15. Limitação de Responsabilidade</h2>
      <p>
        Na máxima extensão permitida pela legislação aplicável, a {BRAND_NAME} não será responsável
        por perdas indiretas, lucros cessantes, interrupções de negócio, perda de dados causada por
        ação do usuário, falhas de terceiros ou uso indevido da plataforma.
      </p>
      <p>
        Nada nestes Termos exclui direitos que não possam ser limitados pela legislação aplicável.
      </p>

      <h2>16. Alterações dos Termos</h2>
      <p>A {BRAND_NAME} poderá atualizar estes Termos periodicamente.</p>
      <p>
        Quando houver alterações relevantes, a plataforma poderá solicitar novo aceite do usuário ou
        comunicar a alteração por meio adequado.
      </p>
      <p>
        O uso contínuo da plataforma após a atualização dos Termos representa concordância com a
        nova versão.
      </p>

      <h2>17. Comunicação e Suporte</h2>
      <p>
        O usuário poderá entrar em contato com a {BRAND_NAME} pelo e-mail{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
      <p>
        Comunicações importantes poderão ser enviadas por e-mail, notificações dentro da plataforma
        ou outros canais informados pelo usuário.
      </p>

      <h2>18. Legislação Aplicável</h2>
      <p>Estes Termos serão regidos pelas leis da República Federativa do Brasil.</p>
      <p>
        Eventuais controvérsias serão resolvidas preferencialmente de forma amigável. Não sendo
        possível, será eleito o foro da comarca de {LEGAL_VENUE}, salvo quando a legislação
        aplicável determinar outro foro obrigatório.
      </p>
    </LegalPageLayout>
  );
}
