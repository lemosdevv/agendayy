
-- Helper: updated_at trigger function (re-create if not exists)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- UNIDADES
CREATE TABLE public.unidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  endereco text,
  telefone text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_unidades_tenant ON public.unidades(tenant_id);
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;

-- SERVICOS
CREATE TABLE public.servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  duracao_min integer NOT NULL DEFAULT 60 CHECK (duracao_min > 0),
  preco numeric(10,2) NOT NULL DEFAULT 0 CHECK (preco >= 0),
  cor text NOT NULL DEFAULT '#FF81AE',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_servicos_tenant ON public.servicos(tenant_id);
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

-- PROFISSIONAIS
CREATE TABLE public.profissionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome text NOT NULL,
  email text,
  telefone text,
  cor text NOT NULL DEFAULT '#FF81AE',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_profissionais_tenant ON public.profissionais(tenant_id);
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;

-- CLIENTES
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  telefone text,
  email text,
  data_nascimento date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clientes_tenant ON public.clientes(tenant_id);
CREATE INDEX idx_clientes_nome ON public.clientes(tenant_id, nome);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- RELACOES N:N
CREATE TABLE public.profissional_servicos (
  profissional_id uuid NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  servico_id uuid NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  PRIMARY KEY (profissional_id, servico_id)
);
ALTER TABLE public.profissional_servicos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profissional_unidades (
  profissional_id uuid NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  unidade_id uuid NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  PRIMARY KEY (profissional_id, unidade_id)
);
ALTER TABLE public.profissional_unidades ENABLE ROW LEVEL SECURITY;

-- TRIGGERS updated_at
CREATE TRIGGER trg_unidades_updated BEFORE UPDATE ON public.unidades FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_servicos_updated BEFORE UPDATE ON public.servicos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profissionais_updated BEFORE UPDATE ON public.profissionais FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- HELPER: pode gerenciar (owner ou manager)
CREATE OR REPLACE FUNCTION public.can_manage(_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND tenant_id = _tenant_id
      AND role IN ('owner','manager')
  );
$$;

-- RLS POLICIES — padrão: SELECT para qualquer membro do tenant; mutação só para owner/manager
-- unidades
CREATE POLICY "select_tenant_unidades" ON public.unidades FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "manage_unidades" ON public.unidades FOR ALL USING (public.can_manage(tenant_id)) WITH CHECK (public.can_manage(tenant_id));

-- servicos
CREATE POLICY "select_tenant_servicos" ON public.servicos FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "manage_servicos" ON public.servicos FOR ALL USING (public.can_manage(tenant_id)) WITH CHECK (public.can_manage(tenant_id));

-- profissionais
CREATE POLICY "select_tenant_profissionais" ON public.profissionais FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "manage_profissionais" ON public.profissionais FOR ALL USING (public.can_manage(tenant_id)) WITH CHECK (public.can_manage(tenant_id));

-- clientes
CREATE POLICY "select_tenant_clientes" ON public.clientes FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "manage_clientes" ON public.clientes FOR ALL USING (public.can_manage(tenant_id)) WITH CHECK (public.can_manage(tenant_id));

-- relacoes
CREATE POLICY "select_tenant_prof_serv" ON public.profissional_servicos FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "manage_prof_serv" ON public.profissional_servicos FOR ALL USING (public.can_manage(tenant_id)) WITH CHECK (public.can_manage(tenant_id));

CREATE POLICY "select_tenant_prof_unid" ON public.profissional_unidades FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "manage_prof_unid" ON public.profissional_unidades FOR ALL USING (public.can_manage(tenant_id)) WITH CHECK (public.can_manage(tenant_id));
