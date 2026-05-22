import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, MapPin, Clock, Palette, MessageCircle, User, Check, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { completeOnboarding } from "@/lib/onboarding.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  onlyDigits,
  maskPhoneBR,
  maskCNPJ,
  maskCPF,
  isValidPhoneBR,
  isValidCNPJ,
  isValidCPF,
} from "@/lib/br-validators";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Configurar negócio — Agenday" }] }),
  component: OnboardingPage,
});

const BUSINESS_TYPES = [
  { value: "lash_designer", label: "Lash Designer" },
  { value: "nail_designer", label: "Nail Designer" },
  { value: "manicure", label: "Manicure" },
  { value: "sobrancelhas", label: "Sobrancelhas" },
  { value: "estetica", label: "Estética" },
  { value: "salao_beleza", label: "Salão de Beleza" },
  { value: "studio_beleza", label: "Studio de Beleza" },
  { value: "cabeleireiro", label: "Cabeleireiro" },
  { value: "outro", label: "Outro" },
] as const;

type BusinessType = (typeof BUSINESS_TYPES)[number]["value"];

const WEEK_DAYS = [
  { value: "seg", label: "Segunda-feira" },
  { value: "ter", label: "Terça-feira" },
  { value: "qua", label: "Quarta-feira" },
  { value: "qui", label: "Quinta-feira" },
  { value: "sex", label: "Sexta-feira" },
  { value: "sab", label: "Sábado" },
  { value: "dom", label: "Domingo" },
] as const;

const PROFESSIONALS_OPTIONS = [
  "Somente eu",
  "2 a 3 profissionais",
  "4 a 6 profissionais",
  "7 ou mais profissionais",
];

const BR_STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const STEPS = [
  { id: 1, title: "Sobre a sua empresa", icon: Building2 },
  { id: 2, title: "Endereço da sua empresa", icon: MapPin },
  { id: 3, title: "Expediente de atendimento", icon: Clock },
  { id: 4, title: "Design", icon: Palette },
  { id: 5, title: "WhatsApp Automático", icon: MessageCircle },
  { id: 6, title: "Dados pessoais", icon: User },
] as const;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormState = {
  // Step 1
  businessType: BusinessType;
  name: string;
  whatsapp: string;
  professionalsCount: string;
  cnpj: string;
  instagram: string;
  // Step 2
  address: string;
  city: string;
  state: string;
  // Step 3
  workingDays: string[];
  workingHours: string;
  // Step 4
  logoUrl: string;
  // Step 5
  reminder24h: boolean;
  reminder1h: boolean;
  followup30d: boolean;
  followup60d: boolean;
  followup90d: boolean;
  notifyNew: boolean;
  notifyCancel: boolean;
  // Step 6
  fullName: string;
  ownerWhatsapp: string;
  email: string;
  cpf: string;
};

type FieldKey = keyof FormState;
type Errors = Partial<Record<FieldKey, string>>;

function validateField(key: FieldKey, value: unknown, form: FormState): string | undefined {
  const reqMsg = "Este campo é obrigatório";
  switch (key) {
    case "name":
      return !String(value ?? "").trim() ? reqMsg : undefined;
    case "whatsapp": {
      const v = String(value ?? "").trim();
      if (!v) return reqMsg;
      return isValidPhoneBR(v) ? undefined : "Digite um número de celular válido";
    }
    case "cnpj": {
      const v = String(value ?? "").trim();
      if (!v) return undefined; // opcional
      return isValidCNPJ(v) ? undefined : "Digite um CNPJ válido";
    }
    case "professionalsCount":
      return !String(value ?? "").trim() ? reqMsg : undefined;
    case "address":
    case "city":
    case "state":
    case "workingHours":
    case "fullName":
      return !String(value ?? "").trim() ? reqMsg : undefined;
    case "workingDays":
      return Array.isArray(value) && value.length > 0 ? undefined : "Selecione ao menos um dia";
    case "ownerWhatsapp": {
      const v = String(value ?? "").trim();
      if (!v) return reqMsg;
      return isValidPhoneBR(v) ? undefined : "Digite um número de celular válido";
    }
    case "email": {
      const v = String(value ?? "").trim();
      if (!v) return reqMsg;
      return EMAIL_RE.test(v) ? undefined : "Digite um e-mail válido";
    }
    case "cpf": {
      const v = String(value ?? "").trim();
      if (!v) return reqMsg;
      return isValidCPF(v) ? undefined : "Digite um CPF válido";
    }
    default:
      return undefined;
  }
  void form;
}

const STEP_FIELDS: Record<number, FieldKey[]> = {
  1: ["name", "whatsapp", "professionalsCount", "cnpj"],
  2: ["address", "city", "state"],
  3: ["workingDays", "workingHours"],
  4: [],
  5: [],
  6: ["fullName", "ownerWhatsapp", "email", "cpf"],
};

function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const completeOnboardingFn = useServerFn(completeOnboarding);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const [form, setForm] = useState<FormState>({
    businessType: "lash_designer",
    name: "",
    whatsapp: "",
    professionalsCount: PROFESSIONALS_OPTIONS[0],
    cnpj: "",
    instagram: "",
    address: "",
    city: "",
    state: "SP",
    workingDays: ["seg"],
    workingHours: "",
    logoUrl: "",
    reminder24h: true,
    reminder1h: false,
    followup30d: true,
    followup60d: false,
    followup90d: false,
    notifyNew: true,
    notifyCancel: false,
    fullName: "",
    ownerWhatsapp: "",
    email: user?.email ?? "",
    cpf: "",
  });

  useEffect(() => {
    if (profile?.onboarded) navigate({ to: "/app" });
  }, [profile, navigate]);

  useEffect(() => {
    if (user?.email && !form.email) {
      setForm((f) => ({ ...f, email: user.email ?? "" }));
    }
  }, [user, form.email]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      // Revalida em tempo real só se já havia erro (após blur/submit)
      const next = { ...prev };
      const msg = validateField(key as FieldKey, val, { ...form, [key]: val });
      if (msg) next[key as FieldKey] = msg;
      else delete next[key as FieldKey];
      return next;
    });
  };

  const handleBlur = (key: FieldKey) => {
    const msg = validateField(key, (form as Record<FieldKey, unknown>)[key], form);
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[key] = msg;
      else delete next[key];
      return next;
    });
  };

  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      workingDays: f.workingDays.includes(day)
        ? f.workingDays.filter((d) => d !== day)
        : [...f.workingDays, day],
    }));
  };

  const stepValid = useMemo(() => {
    const fields = STEP_FIELDS[step] ?? [];
    return fields.every((k) => !validateField(k, (form as Record<FieldKey, unknown>)[k], form));
  }, [step, form]);

  const validateStepAndFocus = (): boolean => {
    const fields = STEP_FIELDS[step] ?? [];
    const newErrors: Errors = { ...errors };
    let firstInvalid: FieldKey | null = null;
    for (const k of fields) {
      const msg = validateField(k, (form as Record<FieldKey, unknown>)[k], form);
      if (msg) {
        newErrors[k] = msg;
        if (!firstInvalid) firstInvalid = k;
      } else {
        delete newErrors[k];
      }
    }
    setErrors(newErrors);
    if (firstInvalid) {
      const el = document.querySelector<HTMLElement>(`[data-field="${firstInvalid}"]`);
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validateStepAndFocus()) {
      toast.error("Verifique os campos destacados.");
      return;
    }
    setStep((s) => Math.min(6, s + 1));
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = async () => {
    if (!user) return;
    if (!validateStepAndFocus()) {
      toast.error("Verifique os campos destacados.");
      return;
    }
    setLoading(true);
    const baseSlug = slugify(form.name) || `negocio-${user.id.slice(0, 6)}`;
    try {
      await completeOnboardingFn({
        data: {
          name: form.name,
          slug: baseSlug,
          businessType: form.businessType,
          whatsapp: onlyDigits(form.whatsapp),
          professionalsCount: form.professionalsCount,
          cnpj: form.cnpj ? onlyDigits(form.cnpj) : null,
          instagram: form.instagram || null,
          address: form.address,
          city: form.city,
          state: form.state,
          workingDays: form.workingDays,
          workingHours: form.workingHours,
          logoUrl: form.logoUrl || null,
          whatsappSettings: {
            reminder24h: form.reminder24h,
            reminder1h: form.reminder1h,
            followup30d: form.followup30d,
            followup60d: form.followup60d,
            followup90d: form.followup90d,
            notifyNew: form.notifyNew,
            notifyCancel: form.notifyCancel,
          },
          fullName: form.fullName,
          ownerWhatsapp: onlyDigits(form.ownerWhatsapp),
          email: form.email,
          cpf: onlyDigits(form.cpf),
        },
      });
      await refreshProfile();
      setDone(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível configurar o negócio.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return <SuccessScreen onContinue={() => navigate({ to: "/app" })} />;
  }

  const StepIcon = STEPS[step - 1].icon;

  const stepProps: StepProps = { form, set, errors, onBlur: handleBlur };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-warm to-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <span className="font-display text-2xl font-semibold text-brand-700">Agenday</span>
          <span className="text-xs md:text-sm text-ink-soft font-medium">
            Etapa {step} de 6
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink">
            Seja bem-vindo!
          </h1>
          <p className="text-ink-soft mt-2">Vamos configurar sua nova conta.</p>
        </div>

        <Stepper currentStep={step} onStepClick={(s) => s < step && setStep(s)} />

        <section className="mt-8 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 md:px-10 py-6 md:py-8 border-b border-border/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl md:text-2xl font-semibold leading-tight">
                {STEPS[step - 1].title}
              </h2>
              <p className="text-xs md:text-sm text-ink-soft">
                Etapa {step} de 6 — leva menos de 2 minutos
              </p>
            </div>
          </div>

          <div className="px-6 md:px-10 py-8 md:py-10">
            {step === 1 && <Step1 {...stepProps} />}
            {step === 2 && <Step2 {...stepProps} />}
            {step === 3 && <Step3 {...stepProps} toggleDay={toggleDay} />}
            {step === 4 && <Step4 {...stepProps} />}
            {step === 5 && <Step5 {...stepProps} />}
            {step === 6 && <Step6 {...stepProps} />}
          </div>

          <div className="px-6 md:px-10 py-5 border-t border-border/60 bg-muted/30 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prev}
              disabled={step === 1 || loading}
              className="sm:w-auto w-full"
            >
              <ArrowLeft className="w-4 h-4" /> Anterior
            </Button>
            {step < 6 ? (
              <Button type="button" onClick={next} className="sm:w-auto w-full" disabled={loading || !stepValid}>
                Próximo <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleFinish} disabled={loading || !stepValid} className="sm:w-auto w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {loading ? "Finalizando..." : "Finalizar"}
              </Button>
            )}
          </div>
        </section>

        <p className="text-center text-xs text-ink-soft mt-6">
          Ao prosseguir você aceita nossos <a className="underline hover:text-brand-700" href="#">Termos de Uso</a> e as
          nossas <a className="underline hover:text-brand-700" href="#">Políticas de Privacidade</a>.
        </p>
      </main>
    </div>
  );
}

/* ---------------- Stepper ---------------- */
function Stepper({ currentStep, onStepClick }: { currentStep: number; onStepClick: (s: number) => void }) {
  return (
    <ol className="flex items-center justify-between gap-1 md:gap-2 max-w-3xl mx-auto">
      {STEPS.map((s, i) => {
        const isDone = s.id < currentStep;
        const isActive = s.id === currentStep;
        return (
          <li key={s.id} className="flex-1 flex items-center">
            <button
              type="button"
              onClick={() => onStepClick(s.id)}
              disabled={s.id > currentStep}
              className="flex flex-col items-center gap-2 group disabled:cursor-not-allowed"
            >
              <span
                className={cn(
                  "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all",
                  isDone && "bg-brand-600 border-brand-600 text-white",
                  isActive && "bg-card border-brand-600 text-brand-700 ring-4 ring-brand-100",
                  !isDone && !isActive && "bg-card border-border text-ink-soft",
                )}
              >
                {isDone ? <Check className="w-4 h-4" /> : s.id}
              </span>
              <span
                className={cn(
                  "hidden md:block text-[11px] font-medium text-center max-w-[110px] leading-tight",
                  isActive ? "text-ink" : "text-ink-soft",
                )}
              >
                {s.title}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "flex-1 h-0.5 mx-1 md:mx-2 rounded-full transition-colors",
                  s.id < currentStep ? "bg-brand-600" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------- Field wrapper ---------------- */
function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-ink">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

const errorInputCls = (hasError?: string) =>
  hasError ? "border-destructive focus-visible:ring-destructive" : "";

type StepProps = {
  form: FormState;
  set: <K extends keyof FormState>(key: K, val: FormState[K]) => void;
  errors: Errors;
  onBlur: (key: FieldKey) => void;
};

function Step1({ form, set, errors, onBlur }: StepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Qual é o principal segmento da sua empresa?" required>
        <Select value={form.businessType} onValueChange={(v) => set("businessType", v as BusinessType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map((b) => (
              <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Qual é o nome da empresa?" required error={errors.name}>
        <Input
          data-field="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          onBlur={() => onBlur("name")}
          placeholder="Nome da empresa"
          className={errorInputCls(errors.name)}
        />
      </Field>

      <Field label="Qual é o WhatsApp da empresa?" required error={errors.whatsapp}>
        <Input
          data-field="whatsapp"
          inputMode="numeric"
          value={form.whatsapp}
          onChange={(e) => set("whatsapp", maskPhoneBR(e.target.value))}
          onBlur={() => onBlur("whatsapp")}
          placeholder="(11) 99999-9999"
          maxLength={16}
          className={errorInputCls(errors.whatsapp)}
        />
      </Field>

      <Field label="Quantos profissionais atendem por agendamento?" required>
        <Select value={form.professionalsCount} onValueChange={(v) => set("professionalsCount", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PROFESSIONALS_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="CNPJ" hint="Não obrigatório" error={errors.cnpj}>
        <Input
          data-field="cnpj"
          inputMode="numeric"
          value={form.cnpj}
          onChange={(e) => set("cnpj", maskCNPJ(e.target.value))}
          onBlur={() => onBlur("cnpj")}
          placeholder="00.000.000/0000-00"
          maxLength={18}
          className={errorInputCls(errors.cnpj)}
        />
      </Field>

      <Field label="Qual Instagram da sua empresa?">
        <Input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@suaempresa" />
      </Field>
    </div>
  );
}

function Step2({ form, set, errors, onBlur }: StepProps) {
  return (
    <div className="space-y-5">
      <Field label="Qual é o endereço da sua empresa?" required error={errors.address}>
        <Input
          data-field="address"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          onBlur={() => onBlur("address")}
          placeholder="Rua, número, complemento"
          className={errorInputCls(errors.address)}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-5">
        <Field label="Qual é a cidade?" required error={errors.city}>
          <Input
            data-field="city"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            onBlur={() => onBlur("city")}
            placeholder="Cidade"
            className={errorInputCls(errors.city)}
          />
        </Field>
        <Field label="Qual é o estado?" required>
          <Select value={form.state} onValueChange={(v) => set("state", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BR_STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}

function Step3({
  form,
  set,
  errors,
  onBlur,
  toggleDay,
}: StepProps & { toggleDay: (d: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-ink mb-3 block">
          Quais os dias de funcionamento? <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {WEEK_DAYS.map((d) => {
            const active = form.workingDays.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={cn(
                  "px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left flex items-center gap-2",
                  active
                    ? "border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-100"
                    : "border-border hover:border-brand-300 hover:bg-brand-50/40 text-ink-soft",
                )}
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                    active ? "bg-brand-600 border-brand-600 text-white" : "border-border",
                  )}
                >
                  {active && <Check className="w-3 h-3" />}
                </span>
                {d.label}
              </button>
            );
          })}
        </div>
        {errors.workingDays && (
          <p className="text-xs font-medium text-destructive mt-2">{errors.workingDays}</p>
        )}
      </div>

      <Field label="Quais os horários de funcionamento?" required hint="Você pode informar mais de um turno." error={errors.workingHours}>
        <Textarea
          data-field="workingHours"
          value={form.workingHours}
          onChange={(e) => set("workingHours", e.target.value)}
          onBlur={() => onBlur("workingHours")}
          placeholder="Exemplo: das 8h às 12h e das 13h às 19h"
          rows={3}
          className={errorInputCls(errors.workingHours)}
        />
      </Field>
    </div>
  );
}

function Step4({ set }: StepProps) {
  const [fileName, setFileName] = useState<string>("");
  return (
    <div className="space-y-5">
      <Field label="Logotipo / Logomarca" hint="PNG, JPG ou SVG. Recomendado: 512×512px.">
        <label className="flex flex-col items-center justify-center gap-3 px-6 py-10 border-2 border-dashed border-border rounded-2xl bg-muted/20 cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-ink">
              {fileName || "Clique para enviar sua logomarca"}
            </p>
            <p className="text-xs text-ink-soft mt-1">ou arraste e solte aqui</p>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setFileName(file.name);
                const reader = new FileReader();
                reader.onload = () => set("logoUrl", String(reader.result || ""));
                reader.readAsDataURL(file);
              }
            }}
          />
        </label>
      </Field>
    </div>
  );
}

function Step5({ form, set }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-success/10 border border-success/30 px-4 py-3">
        <p className="text-sm text-ink">
          <span className="font-semibold text-success">Você possui 100 créditos grátis</span> para usar em seu período de teste. Após o período de teste, o valor do crédito é de <span className="font-semibold">R$ 0,12</span>.
        </p>
      </div>

      <SettingGroup title="Deseja habilitar o envio automático de lembretes para seus clientes via WhatsApp?">
        <SwitchOption checked={form.reminder24h} onChange={(v) => set("reminder24h", v)} label="Lembrete 24 horas antes" />
        <SwitchOption checked={form.reminder1h} onChange={(v) => set("reminder1h", v)} label="Lembrete 1 hora antes" />
      </SettingGroup>

      <SettingGroup title="Deseja habilitar o envio automático de um convite de agendamento para incentivar o retorno dos clientes?">
        <SwitchOption checked={form.followup30d} onChange={(v) => set("followup30d", v)} label="Após 30 dias do último atendimento" />
        <SwitchOption checked={form.followup60d} onChange={(v) => set("followup60d", v)} label="Após 60 dias do último atendimento" />
        <SwitchOption checked={form.followup90d} onChange={(v) => set("followup90d", v)} label="Após 90 dias do último atendimento" />
      </SettingGroup>

      <SettingGroup title="Selecione quais notificações você deseja receber em seu WhatsApp sobre a gestão dos agendamentos">
        <SwitchOption checked={form.notifyNew} onChange={(v) => set("notifyNew", v)} label="Novo agendamento" />
        <SwitchOption checked={form.notifyCancel} onChange={(v) => set("notifyCancel", v)} label="Cancelamento de agendamento" />
      </SettingGroup>
    </div>
  );
}

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink">{title}</p>
      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SwitchOption({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
      <span className="text-sm text-ink">{label}</span>
    </label>
  );
}

function Step6({ form, set, errors, onBlur }: StepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Qual é o seu nome completo?" required error={errors.fullName}>
        <Input
          data-field="fullName"
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          onBlur={() => onBlur("fullName")}
          placeholder="Nome completo"
          className={errorInputCls(errors.fullName)}
        />
      </Field>
      <Field label="Qual é o seu número de WhatsApp?" required error={errors.ownerWhatsapp}>
        <Input
          data-field="ownerWhatsapp"
          inputMode="numeric"
          value={form.ownerWhatsapp}
          onChange={(e) => set("ownerWhatsapp", maskPhoneBR(e.target.value))}
          onBlur={() => onBlur("ownerWhatsapp")}
          placeholder="(11) 99999-9999"
          maxLength={16}
          className={errorInputCls(errors.ownerWhatsapp)}
        />
      </Field>
      <Field label="Qual é o seu e-mail?" required error={errors.email}>
        <Input
          data-field="email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          onBlur={() => onBlur("email")}
          placeholder="voce@email.com"
          className={errorInputCls(errors.email)}
        />
      </Field>
      <Field label="Qual é o seu CPF?" required error={errors.cpf}>
        <Input
          data-field="cpf"
          inputMode="numeric"
          value={form.cpf}
          onChange={(e) => set("cpf", maskCPF(e.target.value))}
          onBlur={() => onBlur("cpf")}
          placeholder="000.000.000-00"
          maxLength={14}
          className={errorInputCls(errors.cpf)}
        />
      </Field>
    </div>
  );
}

/* ---------------- Success ---------------- */
function SuccessScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-warm to-background flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center bg-card border border-border rounded-3xl shadow-sm p-10">
        <div className="w-20 h-20 rounded-full bg-brand-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-600/30">
          <Check className="w-10 h-10" strokeWidth={3} />
        </div>
        <h1 className="font-display text-2xl font-semibold text-brand-700 mt-6">Muito bem!</h1>
        <p className="text-ink-soft text-sm mt-2">
          Seu negócio está configurado. Você já pode acessar seu painel.
        </p>
        <Button onClick={onContinue} className="mt-6 w-full">
          Ir para o painel <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
