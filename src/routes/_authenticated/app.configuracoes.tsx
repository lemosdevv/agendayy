import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, MapPin, Phone, Building2, Calendar, MessageCircle, Link2, Check, CheckCircle2, BellRing, CreditCard, Info, Eye } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useServerFn } from "@tanstack/react-start";
import { getGoogleAuthUrl, getGoogleConnection, disconnectGoogle } from "@/lib/google-calendar.functions";
import { getWhatsAppSettings, saveWhatsAppSettings } from "@/lib/whatsapp.functions";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/lib/use-tenant";
import { useAuth } from "@/lib/auth-context";
import { slugify } from "@/lib/trial";
import { PageHeader, EmptyState } from "@/components/crud/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Agenday" }] }),
  component: ConfiguracoesPage,
});

type Unidade = { id: string; nome: string; endereco: string | null; telefone: string | null; ativo: boolean; };

function ConfiguracoesPage() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Unidade | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [ativo, setAtivo] = useState(true);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["unidades", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("unidades").select("id,nome,endereco,telefone,ativo").order("nome");
      if (error) throw error;
      return data as Unidade[];
    },
  });

  const openCreate = () => { setEditing(null); setAtivo(true); setOpen(true); };
  const openEdit = (u: Unidade) => { setEditing(u); setAtivo(u.ativo); setOpen(true); };

  const upsert = useMutation({
    mutationFn: async (input: Partial<Unidade>) => {
      if (!tenantId) throw new Error("sem tenant");
      const payload = { ...input, ativo };
      if (editing) {
        const { error } = await supabase.from("unidades").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("unidades").insert({ ...payload, tenant_id: tenantId, nome: input.nome! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unidades"] });
      setOpen(false); setEditing(null);
      toast.success(editing ? "Unidade atualizada" : "Unidade criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("unidades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unidades"] });
      setDeleteId(null);
      toast.success("Unidade removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-10">
      <LinkPublicoSection />
      <section>
        <PageHeader title="Unidades" description="Locais onde você atende: salão, estúdio, atendimento em domicílio." onAdd={openCreate} addLabel="Nova unidade" />

        {isLoading ? (
          <p className="text-ink-soft text-sm">Carregando...</p>
        ) : items.length === 0 ? (
          <EmptyState title="Nenhuma unidade ainda" description="Cadastre pelo menos uma unidade para começar a receber agendamentos." actionLabel="Adicionar unidade" onAction={openCreate} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((u) => (
              <article key={u.id} className="bg-card border border-border rounded-xl p-5 hover:border-brand-200 transition">
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center w-10 h-10 rounded-lg bg-brand-50 text-brand-700 shrink-0"><Building2 className="w-5 h-5" /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold truncate">{u.nome}</h3>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEdit(u)} className="p-1.5 text-ink-soft hover:text-ink rounded-md hover:bg-muted" aria-label="Editar"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(u.id)} className="p-1.5 text-ink-soft hover:text-destructive rounded-md hover:bg-muted" aria-label="Excluir"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="mt-1 space-y-1 text-sm text-ink-soft">
                      {u.endereco && <p className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 mt-0.5" />{u.endereco}</p>}
                      {u.telefone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{u.telefone}</p>}
                    </div>
                    {!u.ativo && <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-muted text-ink-soft">Inativa</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <IntegracoesSection />
      <WhatsAppSection />



      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar unidade" : "Nova unidade"}</DialogTitle></DialogHeader>
          <form id="unidade-form" onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            upsert.mutate({
              nome: String(fd.get("nome") ?? "").trim(),
              endereco: String(fd.get("endereco") ?? "").trim() || null,
              telefone: String(fd.get("telefone") ?? "").trim() || null,
            });
          }} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="nome">Nome *</Label><Input id="nome" name="nome" required defaultValue={editing?.nome ?? ""} placeholder="Ex: Studio Centro" /></div>
            <div className="space-y-2"><Label htmlFor="endereco">Endereço</Label><Input id="endereco" name="endereco" defaultValue={editing?.endereco ?? ""} placeholder="Rua, número, bairro" /></div>
            <div className="space-y-2"><Label htmlFor="telefone">Telefone</Label><Input id="telefone" name="telefone" defaultValue={editing?.telefone ?? ""} /></div>
            <div className="flex items-center justify-between bg-muted/40 rounded-lg p-3">
              <Label htmlFor="ativo">Unidade ativa</Label>
              <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="unidade-form" disabled={upsert.isPending}>{upsert.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir unidade?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && remove.mutate(deleteId)}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function IntegracoesSection() {
  const qc = useQueryClient();
  const getUrl = useServerFn(getGoogleAuthUrl);
  const getConn = useServerFn(getGoogleConnection);
  const disconnect = useServerFn(disconnectGoogle);

  const { data: conn, isLoading } = useQuery({
    queryKey: ["google-connection"],
    queryFn: () => getConn({}),
  });

  // Mostra toast quando volta do callback do Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("google");
    if (status === "ok") {
      toast.success("Google Calendar conectado!");
      qc.invalidateQueries({ queryKey: ["google-connection"] });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (status === "erro") {
      toast.error(`Falha ao conectar Google: ${params.get("msg") ?? ""}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [qc]);

  const connect = useMutation({
    mutationFn: async () => {
      const { url } = await getUrl({});
      window.location.href = url;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const off = useMutation({
    mutationFn: () => disconnect({}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["google-connection"] });
      toast.success("Google Calendar desconectado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section>
      <PageHeader title="Integrações" description="Conecte serviços externos à sua agenda." />
      <article className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
        <span className="grid place-items-center w-10 h-10 rounded-lg bg-brand-50 text-brand-700 shrink-0">
          <Calendar className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Google Calendar</h3>
          </div>
          <p className="text-sm text-ink-soft mt-1">
            Sincronize automaticamente os agendamentos na sua agenda do Google.
          </p>
          <div className="mt-3">
            {isLoading ? (
              <p className="text-xs text-ink-soft">Carregando...</p>
            ) : conn?.connected ? (
              <Button variant="outline" size="sm" onClick={() => off.mutate()} disabled={off.isPending}>
                {off.isPending ? "Desconectando..." : "Desconectar"}
              </Button>
            ) : (
              <Button size="sm" onClick={() => connect.mutate()} disabled={connect.isPending}>
                {connect.isPending ? "Abrindo Google..." : "Conectar Google Calendar"}
              </Button>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}

function WhatsAppSection() {
  const getSettings = useServerFn(getWhatsAppSettings);
  const saveSettings = useServerFn(saveWhatsAppSettings);
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["whatsapp-settings"],
    queryFn: () => getSettings({}),
  });

  const [tplConf, setTplConf] = useState("");
  const [tplLemb, setTplLemb] = useState("");
  const [tplPag, setTplPag] = useState("");
  const [lang, setLang] = useState("");

  useEffect(() => {
    if (!settings) return;
    setTplConf(settings.template_confirmacao);
    setTplLemb(settings.template_lembrete);
    setTplPag(settings.template_pagamento);
    setLang(settings.language_code);
  }, [settings]);

  const save = useMutation({
    mutationFn: () => saveSettings({ data: {
      template_confirmacao: tplConf.trim(),
      template_lembrete: tplLemb.trim(),
      template_pagamento: tplPag.trim(),
      language_code: lang.trim(),
    }}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp-settings"] });
      toast.success("Configurações salvas");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const VARS = [
    { token: "{{1}}", label: "Nome", sample: "Maria" },
    { token: "{{2}}", label: "Data", sample: "15/06" },
    { token: "{{3}}", label: "Horário", sample: "14:30" },
    { token: "{{4}}", label: "Serviço", sample: "Corte" },
    { token: "{{5}}", label: "Profissional", sample: "Ana" },
  ];

  const TABS = [
    {
      id: "conf",
      icon: CheckCircle2,
      title: "Confirmação",
      when: "Enviada logo após o cliente agendar.",
      value: tplConf,
      set: setTplConf,
      sample: "Olá Maria! Seu agendamento de Corte com Ana no dia 15/06 às 14:30 está confirmado.",
    },
    {
      id: "lemb",
      icon: BellRing,
      title: "Lembrete",
      when: "Enviada algumas horas antes do horário marcado.",
      value: tplLemb,
      set: setTplLemb,
      sample: "Oi Maria, passando para lembrar do seu Corte amanhã às 14:30 com Ana. Te esperamos!",
    },
    {
      id: "pag",
      icon: CreditCard,
      title: "Cobrança",
      when: "Enviada quando há pagamento ou sinal a confirmar.",
      value: tplPag,
      set: setTplPag,
      sample: "Maria, segue o link para pagamento do seu Corte do dia 15/06 às 14:30.",
    },
  ];

  return (
    <section>
      <PageHeader title="Mensagens automáticas" description="Configure os textos enviados pelo WhatsApp em cada momento do agendamento." />
      <article className="bg-card border border-border rounded-xl p-5 md:p-6 space-y-5">
        <div className="flex items-start gap-2.5 bg-brand-50/60 border border-brand-100 rounded-lg p-3 text-sm text-ink-soft">
          <Info className="w-4 h-4 mt-0.5 text-brand-600 shrink-0" />
          <p>
            Use os campos abaixo para informar o <strong className="text-ink">nome do template</strong> já aprovado na sua conta do WhatsApp Business. Você verá um exemplo de como a mensagem chega ao cliente.
          </p>
        </div>

        <Tabs defaultValue="conf" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                <t.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((t) => (
            <TabsContent key={t.id} value={t.id} className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-lg bg-brand-50 text-brand-700 shrink-0">
                  <t.icon className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ink">{t.title}</h3>
                  <p className="text-sm text-ink-soft">{t.when}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`tpl-${t.id}`}>Nome do template no WhatsApp</Label>
                <Input
                  id={`tpl-${t.id}`}
                  value={t.value}
                  onChange={(e) => t.set(e.target.value)}
                  disabled={isLoading}
                  placeholder={`agendamento_${t.id === "conf" ? "confirmado" : t.id === "lemb" ? "lembrete" : "pagamento"}`}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-ink-soft">Exatamente como cadastrado no WhatsApp Business Manager.</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink-soft font-medium mb-2">
                  <Eye className="w-3.5 h-3.5" /> Pré-visualização
                </div>
                <div className="bg-[#dcf8c6] text-[#111b21] rounded-lg px-3.5 py-2.5 text-sm max-w-md shadow-sm">
                  {t.sample}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {VARS.map((v) => (
                    <span key={v.token} className="inline-flex items-center gap-1 text-xs bg-card border border-border rounded-full px-2 py-0.5 text-ink-soft">
                      <code className="font-mono text-brand-700">{v.token}</code>
                      <span>{v.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-4 border-t border-border">
          <div className="space-y-1.5 max-w-[180px]">
            <Label htmlFor="lang" className="text-xs text-ink-soft">Idioma das mensagens</Label>
            <Select value={lang} onValueChange={setLang} disabled={isLoading}>
              <SelectTrigger id="lang"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pt_BR">Português (Brasil)</SelectItem>
                <SelectItem value="en_US">English (US)</SelectItem>
                <SelectItem value="es_ES">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending || isLoading} size="lg">
            {save.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </article>
    </section>
  );
}


function LinkPublicoSection() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState("");
  const [slugDraft, setSlugDraft] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant", profile?.tenant_id],
    enabled: !!profile?.tenant_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id,name,slug")
        .eq("id", profile!.tenant_id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (tenant && !editing) {
      setNome(tenant.name);
      setSlugDraft(tenant.slug);
      setSlugTouched(false);
    }
  }, [tenant, editing]);

  const previewSlug = slugify(slugTouched ? slugDraft : slugify(nome) || tenant?.slug || "");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const currentUrl = tenant?.slug ? `${origin}/agenda/${tenant.slug}` : "";
  const previewUrl = previewSlug ? `${origin}/agenda/${previewSlug}` : "";

  const save = useMutation({
    mutationFn: async () => {
      if (!tenant) throw new Error("Sem dados");
      if (nome.trim() && nome.trim() !== tenant.name) {
        const { error } = await supabase.from("tenants").update({ name: nome.trim() }).eq("id", tenant.id);
        if (error) throw error;
      }
      const targetSlug = slugify(slugTouched ? slugDraft : nome);
      if (targetSlug && targetSlug !== tenant.slug) {
        let attempt = targetSlug;
        let suffix = 1;
        for (let i = 0; i < 5; i++) {
          const { data, error } = await supabase.rpc("update_tenant_slug", { _new_slug: attempt });
          if (!error) return data as string;
          if (!String(error.message).toLowerCase().includes("já está em uso")) throw error;
          suffix += 1;
          attempt = `${targetSlug}-${suffix}`;
        }
        throw new Error("Não foi possível encontrar um link disponível. Tente outro nome.");
      }
      return tenant.slug;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant", profile?.tenant_id] });
      qc.invalidateQueries({ queryKey: ["tenant"] });
      setEditing(false);
      toast.success("Link atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section>
      <PageHeader title="Link público" description="O link que seus clientes usam para agendar online." />
      <article className="bg-gradient-to-br from-brand-50/70 via-card to-card border border-brand-200/60 rounded-xl p-5 md:p-6">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-lg bg-brand-600 text-white shrink-0">
            <Link2 className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <p className="text-ink-soft text-sm">Carregando...</p>
            ) : !editing ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-soft font-medium">Estabelecimento</p>
                  <p className="font-semibold text-ink">{tenant?.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-soft font-medium">Link</p>
                  <p className="font-mono text-sm text-brand-700 break-all">{currentUrl}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="border-brand-200 hover:bg-brand-50">
                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar link
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome-est">Nome do estabelecimento</Label>
                  <Input
                    id="nome-est"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Studio Beleza da Maria"
                    maxLength={80}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Link personalizado</Label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-ink-soft whitespace-nowrap">{origin}/agenda/</span>
                    <Input
                      id="slug"
                      value={slugTouched ? slugDraft : slugify(nome)}
                      onChange={(e) => { setSlugTouched(true); setSlugDraft(e.target.value); }}
                      placeholder="studio-beleza-da-maria"
                      maxLength={40}
                    />
                  </div>
                  <p className="text-xs text-ink-soft">
                    Apenas letras minúsculas, números e hífen. Entre 3 e 40 caracteres.
                  </p>
                  {previewSlug && (
                    <div className={cn(
                      "text-xs px-3 py-2 rounded-lg flex items-center gap-1.5",
                      previewSlug.length >= 3 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800",
                    )}>
                      {previewSlug.length >= 3 && <Check className="w-3 h-3" />}
                      Preview: <span className="font-mono break-all">{previewUrl}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => save.mutate()} disabled={save.isPending || (slugify(slugTouched ? slugDraft : nome)).length < 3}>
                    {save.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)} disabled={save.isPending}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
