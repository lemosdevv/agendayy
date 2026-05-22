import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import logoAgenday from "@/assets/logo.png";
import heroIllustration from "@/assets/illustrations/hero.svg";
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Frown,
  Instagram,
  LayoutDashboard,
  Link2,
  Menu,
  MessageCircle,
  Repeat,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agenday — Agenda online para profissionais de beleza" },
      {
        name: "description",
        content:
          "Receba agendamentos online, envie lembretes automáticos e organize seus horários sem depender do WhatsApp o dia inteiro. Teste grátis por 15 dias.",
      },
      { property: "og:title", content: "Agenday — Sua agenda de beleza organizada e automática" },
      {
        property: "og:description",
        content:
          "Menos mensagens, menos faltas e mais controle. Agenda online feita para manicures, lash designers, cabeleireiras e salões.",
      },
      { property: "og:url", content: "https://agenday.lovable.app/" },
    ],
    links: [
      { rel: "canonical", href: "https://agenday.lovable.app/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map(([q, a]) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }),
      },
    ],
  }),
  component: LandingPage,
});

const navItems = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Para quem é", href: "#para-quem" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
];

const trustItems = ["15 dias grátis", "Sem cartão de crédito", "Cancele quando quiser"];

const pains = [
  { icon: MessageCircle, text: "WhatsApp lotado de mensagem pra marcar horário" },
  { icon: Frown, text: "Cliente esquece e some no dia do atendimento" },
  { icon: Clock, text: "Você se perde nos encaixes e nos horários vagos" },
  { icon: Repeat, text: "Precisa responder a mesma pergunta toda hora" },
  { icon: CalendarDays, text: "Agenda na cabeça, no caderno ou em três lugares" },
  { icon: ShieldCheck, text: "Falta de profissionalismo na hora do primeiro contato" },
];

const solutions = [
  {
    icon: Link2,
    title: "Seu link de agendamento",
    description:
      "Coloque na bio do Instagram e envie no WhatsApp. A cliente escolhe o horário sozinha, em segundos.",
  },
  {
    icon: CalendarCheck2,
    title: "Agenda aberta 24 horas",
    description:
      "Receba marcações enquanto atende, dorme ou descansa. Só horários realmente livres aparecem disponíveis.",
  },
  {
    icon: BellRing,
    title: "Lembretes automáticos",
    description:
      "Confirmação e lembrete na hora certa para reduzir faltas e esquecimentos sem você precisar mandar mensagem.",
  },
  {
    icon: LayoutDashboard,
    title: "Painel simples e visual",
    description:
      "Veja o dia, a semana, os clientes e a receita em uma tela limpa, pensada para quem não é da tecnologia.",
  },
];

const steps = [
  {
    title: "Cadastre seus serviços e horários",
    description:
      "Adicione preços, duração e os dias em que você atende. Leva poucos minutos.",
  },
  {
    title: "Envie seu link para as clientes",
    description:
      "Coloque na bio do Instagram, no status do WhatsApp ou mande direto para a cliente.",
  },
  {
    title: "Receba agendamentos sozinha",
    description:
      "Seu painel se preenche automaticamente. Você só confirma, atende e cobra.",
  },
];

const benefits = [
  { icon: Zap, title: "Configura em minutos", description: "Sem manual de 50 páginas. Você abre, cadastra serviços e já compartilha o link." },
  { icon: Sparkles, title: "Aparência profissional", description: "Sua página de agendamento tem seu nome, sua marca e suas cores." },
  { icon: Users, title: "Para quem atende sozinha ou em equipe", description: "Funciona igual bem para autônoma e para salão com vários profissionais." },
  { icon: Instagram, title: "Pensado para Instagram", description: "O link foi feito para bio e direct. A cliente abre no celular e agenda em 30s." },
  { icon: ShieldCheck, title: "Reduz faltas", description: "Lembretes e confirmações na hora certa diminuem o famoso 'esqueci'." },
  { icon: CalendarDays, title: "Histórico de cada cliente", description: "Saiba quando veio, o que fez e há quanto tempo não retorna." },
  { icon: MessageCircle, title: "Continua com WhatsApp", description: "Você não precisa abandonar o WhatsApp — só para de marcar manualmente por lá." },
  { icon: BellRing, title: "Controle total dos horários", description: "Bloqueie almoço, folga, encaixe ou um dia inteiro com um clique." },
];

const audience = [
  ["Manicure", "Esmaltação, alongamento, manutenção e remoção com durações certas."],
  ["Lash designer", "Volume, fio a fio, manutenção e retoque sem confusão de agenda."],
  ["Cabeleireira", "Corte, coloração, escova e progressiva com tempos diferentes."],
  ["Sobrancelhista", "Design, henna e brow lamination com intervalos respeitados."],
  ["Esteticista", "Limpeza de pele, drenagem, peeling e pacotes recorrentes."],
  ["Depiladora", "Áreas separadas, retorno programado e clientes fiéis no histórico."],
  ["Estúdio de beleza", "Vários serviços e profissionais em uma agenda única."],
  ["Salão com equipe", "Cada profissional com sua agenda, sob o mesmo link da casa."],
];

const testimonials = [
  {
    name: "Camila R.",
    role: "Lash designer · São Paulo",
    quote:
      "Em uma semana parei de perder horário com mensagem. As clientes amaram poder marcar sozinhas pelo Instagram.",
  },
  {
    name: "Juliana M.",
    role: "Salão de beleza · Curitiba",
    quote:
      "Diminuímos faltas pela metade depois dos lembretes automáticos. A equipe inteira usa todo dia.",
  },
  {
    name: "Bia F.",
    role: "Manicure autônoma · BH",
    quote:
      "Eu tinha medo de ser difícil, mas configurei sozinha em uma tarde. Hoje minha agenda fecha sem eu responder mensagem.",
  },
];

const plans = [
  {
    name: "Start",
    price: "R$ 29,99",
    period: "/mês",
    description: "Para quem atende sozinha e quer começar a profissionalizar a agenda.",
    professionals: "1 profissional",
    features: [
      "Link público de agendamento",
      "Cadastro ilimitado de serviços",
      "Agenda online 24h",
      "Clientes com histórico",
      "Página com sua marca",
    ],
    highlighted: false,
  },
  {
    name: "Profissional",
    price: "R$ 49,99",
    period: "/mês",
    description: "Para quem quer crescer com lembretes, equipe pequena e mais controle.",
    professionals: "Até 5 profissionais",
    features: [
      "Tudo do Start",
      "Até 5 profissionais",
      "Lembretes e confirmações",
      "Templates de mensagem",
      "Dashboard de operação",
    ],
    highlighted: true,
  },
  {
    name: "Studio",
    price: "R$ 109,99",
    period: "/mês",
    description: "Para salões, clínicas e equipes com mais movimento.",
    professionals: "10+ profissionais",
    features: [
      "Tudo do Profissional",
      "10+ profissionais",
      "Unidades e equipe",
      "Relatórios e visão geral",
      "Controle avançado",
    ],
    highlighted: false,
  },
];

const faq: [string, string][] = [
  ["Para quais profissionais de beleza o Agenday serve?", "Funciona para manicures, lash designers, cabeleireiras, designers de sobrancelhas, esteticistas, depiladoras, clínicas, estúdios e salões com equipe."],
  ["Minhas clientes precisam baixar aplicativo ou criar conta?", "Não. Elas só clicam no seu link, escolhem serviço, profissional e horário. Funciona direto no navegador do celular."],
  ["Posso continuar usando o WhatsApp?", "Sim, e recomendamos. O Agenday tira o trabalho de marcar horário pelo WhatsApp, mas você continua atendendo e conversando por lá normalmente."],
  ["Consigo controlar quais horários ficam disponíveis?", "Sim. Você define dias, horários de almoço, folgas e pode bloquear encaixes ou um dia inteiro a qualquer momento."],
  ["A ferramenta envia lembretes para as clientes?", "Sim. O Agenday tem estrutura de lembretes e confirmações para reduzir esquecimentos e faltas."],
  ["Serve para quem atende sozinha?", "Serve. O plano Start foi pensado exatamente para a profissional autônoma que quer organizar a agenda sem complicação."],
  ["Serve para salão com equipe?", "Sim. Cada profissional tem sua agenda, e o salão tem um link único para o cliente escolher quem prefere."],
  ["Posso cadastrar serviços com durações diferentes?", "Sim. Cada serviço tem preço, duração e descrição próprias, e o sistema bloqueia o tempo certo na agenda."],
  ["Preciso de cartão de crédito para testar?", "Não. Você cria a conta, testa por 15 dias e só escolhe um plano se quiser continuar."],
  ["Quanto tempo leva para configurar?", "A maioria das profissionais consegue colocar tudo no ar em menos de uma hora. É pensado para quem não é da tecnologia."],
];

function LandingPage() {
  const [open, setOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-ink flex flex-col lg:block">
      {/* HERO */}
      <div className="relative overflow-hidden bg-surface-warm order-1 lg:order-none">

        <BlurDecor />

        <header className="relative z-50">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
            <a href="#top" className="flex items-center" aria-label="Agenday">
              <img src={logoAgenday} alt="Agenday" className="h-[72px] w-[72px] object-contain" />
            </a>

            <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegação principal">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-ink-soft transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-4 focus-visible:ring-offset-surface-warm rounded-md"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <Link
                to="/cadastro"
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-900 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
              >
                Teste grátis por 15 dias
              </Link>
            </div>

            <button
              className="grid h-11 w-11 place-items-center rounded-xl border border-brand-100 bg-white text-ink lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {open && (
            <div className="px-5 pb-4 lg:hidden">
              <nav className="grid gap-1 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-brand-100">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-ink-soft hover:bg-brand-50 hover:text-ink"
                  >
                    {item.label}
                  </a>
                ))}
                <Link
                  to="/cadastro"
                  className="mt-1 rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Teste grátis por 15 dias
                </Link>
              </nav>
            </div>
          )}
        </header>

        <section id="top" className="relative px-5 pb-12 pt-8 lg:px-8 lg:pb-32 lg:pt-16">
          <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-brand-700 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Feito para profissionais de beleza
              </div>

              <h1 className="mt-6 max-w-2xl text-[2.5rem] font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[4rem]">
                Sua agenda de beleza{" "}
                <span className="text-brand-600">organizada</span>, sem depender do WhatsApp o dia inteiro.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">
                Receba agendamentos online, envie lembretes automáticos e mostre seus horários
                disponíveis em um link só — pensado para quem atende sozinha ou em equipe.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/cadastro"
                  className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 text-base font-semibold text-white shadow-lg shadow-ink/15 transition duration-200 hover:-translate-y-0.5 hover:bg-brand-900 hover:shadow-xl hover:shadow-ink/20 active:translate-y-0 active:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 sm:text-lg"
                >
                  Teste grátis por 15 dias
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                </Link>
              </div>

              <p className="mt-4 text-sm font-medium text-ink-soft">
                Sem cartão de crédito · Comece em menos de 1 minuto
              </p>

              <ul className="mt-5 hidden flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-ink-soft sm:flex">
                {trustItems.map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative hidden lg:block">
              <img
                src={heroIllustration}
                alt="Profissional de beleza organizando agendamentos"
                className="relative z-10 mx-auto w-full max-w-lg drop-shadow-xl"
                loading="eager"
              />
              <div className="absolute -inset-8 -z-0 rounded-[3rem] bg-gradient-to-br from-brand-100/60 via-transparent to-brand-200/40 blur-2xl" />
            </div>
          </div>
        </section>
      </div>

      {/* DORES */}
      <section className="hidden lg:block bg-white px-5 py-12 lg:px-8 lg:py-24">

        <SectionHeader
          eyebrow="A rotina hoje"
          title="Você reconhece alguma dessas situações?"
          description="Toda profissional de beleza que cresce passa por isso. O problema não é falta de organização — é falta de ferramenta certa."
        />

        <div className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pains.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.text}
                className={`flex items-start gap-4 rounded-2xl border border-brand-100 bg-surface-warm p-5 transition hover:border-brand-200 ${i >= 3 ? "hidden sm:flex" : ""}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 ring-1 ring-brand-100">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-[15px] leading-6 text-ink">{p.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section id="funcionalidades" className="bg-surface-warm px-5 py-12 lg:px-8 lg:py-24 order-3 lg:order-none">
        <SectionHeader
          eyebrow="A solução"
          title="Tudo o que sua agenda precisa em um lugar só."
          description="Um link, um painel e lembretes automáticos. Sem planilha, sem caderno, sem ficar respondendo mensagem o dia todo."
        />

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-2">
          {solutions.map((s, i) => {
            const Icon = s.icon;
            return (
              <article
                key={s.title}
                className={`group rounded-3xl border border-brand-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5 ${i >= 2 ? "hidden md:block" : ""}`}
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-ink">{s.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-ink-soft">{s.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* COMO FUNCIONA - 3 passos */}
      <section id="como-funciona" className="bg-white px-5 py-12 lg:px-8 lg:py-24 order-5 lg:order-none">
        <SectionHeader
          eyebrow="Como funciona"
          title="Em 3 passos sua agenda já trabalha por você."
          description="Sem instalação, sem manual técnico. Você abre, configura e compartilha."
        />

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-3xl border border-brand-100 bg-surface-warm p-7 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-900/5"
            >
              <span className="inline-flex h-10 items-center rounded-full bg-brand-600 px-3 font-display text-sm font-semibold text-white">
                Passo {i + 1}
              </span>
              <h3 className="mt-6 text-xl font-semibold text-ink">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-ink-soft">{s.description}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/cadastro"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 text-base font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-brand-900"
            >
              Teste grátis por 15 dias
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/cadastro"
              className="hidden sm:inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-brand-200 bg-white px-8 py-4 text-base font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-brand-50"
            >
              Teste grátis
            </Link>
          </div>
          <p className="text-sm font-medium text-ink-soft">
            Sem cartão de crédito · Comece em menos de 1 minuto
          </p>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="bg-surface-warm px-5 py-12 lg:px-8 lg:py-24 order-2 lg:order-none">
        <SectionHeader
          eyebrow="Benefícios"
          title="O que muda na sua rotina."
          description="Menos tempo no celular respondendo mensagem. Mais tempo atendendo, descansando ou cuidando do seu negócio."
        />

        <div className="mx-auto mt-14 grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <article
                key={b.title}
                className={`rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5 ${i >= 4 ? "hidden lg:block" : ""}`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-semibold text-ink">{b.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{b.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* PROVA SOCIAL */}
      <section className="bg-white px-5 py-12 lg:px-8 lg:py-24 order-6 lg:order-none">

        <SectionHeader
          eyebrow="Quem usa, conta"
          title="Profissionais que pararam de marcar horário pelo WhatsApp."
          description="A diferença sentida nas primeiras semanas: mais previsibilidade, menos falta e clientes mais satisfeitas."
        />

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure
              key={t.name}
              className={`rounded-3xl border border-brand-100 bg-surface-warm p-7 shadow-sm ${i >= 1 ? "hidden md:block" : ""}`}
            >
              <div className="flex gap-1 text-brand-600" aria-label="5 estrelas">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-[15px] leading-7 text-ink">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 border-t border-brand-100 pt-4 text-sm">
                <div className="font-semibold text-ink">{t.name}</div>
                <div className="text-ink-soft">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* PARA QUEM É */}
      <section id="para-quem" className="hidden lg:block bg-surface-warm px-5 py-12 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Para quem é"
          title="Feito para diferentes rotinas da beleza."
          description="Do atendimento individual em casa ao salão com equipe — o Agenday se adapta ao seu jeito de trabalhar."
        />

        <div className="mx-auto mt-14 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audience.map(([title, description], i) => (
            <article
              key={title}
              className={`rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5 ${i >= 4 ? "hidden sm:block" : ""}`}
            >
              <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-soft">{description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="bg-white px-5 py-12 lg:px-8 lg:py-24 order-4 lg:order-none">
        <SectionHeader
          eyebrow="Planos"
          title="Comece com 15 dias grátis, sem cartão."
          description="Escolha o plano ideal para o tamanho da sua operação. Mude ou cancele quando quiser."
        />

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-3xl border p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/10 ${
                plan.highlighted
                  ? "border-brand-600 bg-gradient-to-b from-brand-50/60 to-white ring-4 ring-brand-100 lg:scale-[1.04] lg:shadow-lg lg:shadow-brand-900/10"
                  : "border-brand-100 bg-white"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-md shadow-brand-900/20">
                  Mais popular
                </span>
              )}

              <h3 className="font-display text-2xl font-bold text-ink">{plan.name}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-ink-soft">{plan.description}</p>

              <div className="mt-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  15 dias grátis
                </span>
              </div>

              <p className="mt-5 font-display text-4xl font-bold text-ink">
                {plan.price}
                <span className="text-base font-medium text-ink-soft">{plan.period}</span>
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-700">{plan.professionals}</p>

              <ul className="mt-6 grid gap-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/cadastro"
                className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
                  plan.highlighted
                    ? "bg-ink text-white shadow-md shadow-ink/15 hover:-translate-y-0.5 hover:bg-brand-900 hover:shadow-lg active:translate-y-0 active:shadow-sm"
                    : "border border-brand-200 bg-white text-ink hover:border-brand-300 hover:bg-brand-50 active:bg-brand-100"
                }`}
              >
                Começar com {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-surface-warm px-5 py-12 lg:px-8 lg:py-24 order-9 lg:order-none">
        <SectionHeader
          eyebrow="FAQ"
          title="Tirando as dúvidas mais comuns."
          description="Se ainda ficar alguma pergunta, é só falar com a gente."
        />

        <div className="mx-auto mt-12 grid max-w-3xl gap-3">
          {faq.map(([q, a], i) => (
            <details
              key={q}
              className={`group rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition open:border-brand-200 open:shadow-md ${i >= 5 ? "hidden lg:block" : ""}`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                <span>{q}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-ink-soft transition group-open:rotate-180 group-open:text-brand-600" />
              </summary>
              <p className="mt-4 text-sm leading-6 text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-white px-5 py-12 lg:px-8 lg:py-24 order-10 lg:order-none">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-10 text-white shadow-2xl shadow-brand-900/20 lg:p-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="font-display text-4xl font-semibold leading-[1.1] lg:text-5xl">
                Pronta para parar de marcar horário pelo WhatsApp?
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/80">
                Teste por 15 dias, sem cartão de crédito. Configure em uma tarde e
                comece a receber agendamentos sozinha.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/cadastro"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-ink shadow-xl transition hover:-translate-y-0.5 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700 sm:text-lg"
                >
                  Teste grátis por 15 dias
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/cadastro"
                  className="hidden sm:inline-flex min-h-14 items-center justify-center rounded-full border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/15"
                >
                  Teste grátis
                </Link>
              </div>

              <p className="mt-4 text-sm text-white/80">
                Sem cartão de crédito · Comece em menos de 1 minuto
              </p>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
                {trustItems.map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden lg:block">
              <MiniAgendaCard />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-brand-100 bg-surface-warm px-5 py-14 lg:px-8 order-11 lg:order-none">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <img src={logoAgenday} alt="Agenday" className="h-[42px] w-[42px] object-contain" />
            <p className="mt-4 max-w-md text-sm leading-6 text-ink-soft">
              Agenda online para profissionais de beleza que querem mais organização,
              presença digital e tempo de volta no dia.
            </p>
          </div>

          <FooterGroup
            title="Produto"
            links={[
              ["Funcionalidades", "#funcionalidades"],
              ["Como funciona", "#como-funciona"],
              ["Para quem é", "#para-quem"],
              ["Planos", "#planos"],
            ]}
          />
          <div className="hidden lg:block">
            <FooterGroup
              title="Suporte"
              links={[
                ["FAQ", "#faq"],
                ["Contato", "#"],
                ["Central de ajuda", "#"],
              ]}
            />
          </div>
          <div className="hidden lg:block">
            <FooterGroup
              title="Conta"
              links={[
                ["Criar conta", "/"],
                ["Termos", "#"],
                ["Privacidade", "#"],
              ]}
            />
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-brand-100 pt-6 text-sm text-ink-soft">
          © {new Date().getFullYear()} Agenday. Todos os direitos reservados.
        </div>
      </footer>
    </main>
  );
}

/* ---------- componentes auxiliares ---------- */

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700 shadow-sm ring-1 ring-brand-100">
        {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      <p className="mt-5 text-base leading-7 text-ink-soft sm:text-lg sm:leading-8">{description}</p>
    </div>
  );
}

function BlurDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-brand-100/80 blur-3xl" />
      <div className="absolute right-[-10rem] top-[-4rem] h-[34rem] w-[34rem] rounded-full bg-brand-200/50 blur-3xl" />
      <div className="absolute bottom-[-16rem] left-[20%] h-[28rem] w-[28rem] rounded-full bg-brand-100/60 blur-3xl" />
    </div>
  );
}

function FooterGroup({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="font-semibold text-ink">{title}</h3>
      <div className="mt-4 grid gap-3">
        {links.map(([label, href]) =>
          href.startsWith("/") ? (
            <Link
              key={label}
              to={href}
              className="text-sm text-ink-soft transition hover:text-ink"
            >
              {label}
            </Link>
          ) : (
            <a
              key={label}
              href={href}
              className="text-sm text-ink-soft transition hover:text-ink"
            >
              {label}
            </a>
          )
        )}
      </div>
    </div>
  );
}

/* Mock visual da agenda para o hero (sem assets externos) */
function HeroMockup() {
  const slots = [
    { time: "09:00", service: "Alongamento de cílios", client: "Marina S.", status: "confirmado" },
    { time: "10:30", service: "Design + henna", client: "Júlia P.", status: "novo" },
    { time: "13:00", service: "Manicure + pedicure", client: "Bia R.", status: "confirmado" },
    { time: "15:30", service: "Disponível", client: "—", status: "livre" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-200/60 to-brand-100/40 blur-2xl" />

      {/* card principal */}
      <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-2xl shadow-brand-900/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Hoje · Terça
            </div>
            <div className="mt-0.5 font-display text-lg font-semibold text-ink">
              Sua agenda
            </div>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            <CalendarCheck2 className="h-4 w-4" />
          </span>
        </div>

        <ul className="mt-5 space-y-2.5">
          {slots.map((s) => (
            <li
              key={s.time}
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                s.status === "livre"
                  ? "border-dashed border-brand-200 bg-brand-50/40"
                  : "border-brand-100 bg-white"
              }`}
            >
              <span className="w-12 font-display text-sm font-semibold text-ink">{s.time}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-ink">{s.service}</div>
                <div className="text-xs text-ink-soft">{s.client}</div>
              </div>
              {s.status === "confirmado" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  <Check className="h-3 w-3" /> Confirmado
                </span>
              )}
              {s.status === "novo" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100">
                  <Sparkles className="h-3 w-3" /> Novo
                </span>
              )}
              {s.status === "livre" && (
                <span className="text-[11px] font-medium text-brand-600">Livre</span>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-brand-50/60 p-3 text-xs">
          <span className="text-ink-soft">Faltas hoje</span>
          <span className="font-semibold text-emerald-700">0</span>
        </div>
      </div>

      {/* mini card flutuante */}
      <div className="absolute -bottom-6 -left-4 hidden rotate-[-3deg] rounded-2xl border border-brand-100 bg-white p-3 shadow-xl shadow-brand-900/10 sm:flex sm:items-center sm:gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
          <BellRing className="h-4 w-4" />
        </span>
        <div className="text-xs">
          <div className="font-semibold text-ink">Lembrete enviado</div>
          <div className="text-ink-soft">Marina · amanhã 09:00</div>
        </div>
      </div>

      <div className="absolute -right-4 -top-4 hidden rotate-[4deg] rounded-2xl border border-brand-100 bg-white p-3 shadow-xl shadow-brand-900/10 sm:flex sm:items-center sm:gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Link2 className="h-4 w-4" />
        </span>
        <div className="text-xs">
          <div className="font-semibold text-ink">+3 agendamentos</div>
          <div className="text-ink-soft">via link do Instagram</div>
        </div>
      </div>
    </div>
  );
}

function MiniAgendaCard() {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur">
      <div className="text-xs font-semibold uppercase tracking-wider text-white/70">
        Próximos 7 dias
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <div key={i} className="text-center text-[11px] font-semibold text-white/60">
            {d}
          </div>
        ))}
        {Array.from({ length: 21 }).map((_, i) => {
          const filled = [0, 2, 3, 5, 7, 8, 10, 12, 13, 16, 18, 20].includes(i);
          return (
            <div
              key={i}
              className={`aspect-square rounded-md ${
                filled ? "bg-white" : "bg-white/15"
              }`}
            />
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="text-white/70">Ocupação</span>
        <span className="font-display text-xl font-semibold text-white">82%</span>
      </div>
    </div>
  );
}
