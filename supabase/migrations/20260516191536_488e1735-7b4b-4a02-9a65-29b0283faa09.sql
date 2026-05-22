
CREATE TYPE public.agendamento_status AS ENUM ('pendente','confirmado','concluido','cancelado','faltou');

CREATE TABLE public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  servico_id uuid NOT NULL REFERENCES public.servicos(id) ON DELETE RESTRICT,
  profissional_id uuid NOT NULL REFERENCES public.profissionais(id) ON DELETE RESTRICT,
  unidade_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  status public.agendamento_status NOT NULL DEFAULT 'pendente',
  preco numeric(10,2) NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agendamentos_horario_valido CHECK (fim > inicio)
);

CREATE INDEX idx_agendamentos_tenant_inicio ON public.agendamentos(tenant_id, inicio);
CREATE INDEX idx_agendamentos_prof_inicio ON public.agendamentos(profissional_id, inicio);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_agendamentos_updated BEFORE UPDATE ON public.agendamentos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger anti-conflito de horários para o mesmo profissional
CREATE OR REPLACE FUNCTION public.check_agendamento_conflito()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('cancelado','faltou') THEN
    RETURN NEW;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.profissional_id = NEW.profissional_id
      AND a.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND a.status NOT IN ('cancelado','faltou')
      AND tstzrange(a.inicio, a.fim, '[)') && tstzrange(NEW.inicio, NEW.fim, '[)')
  ) THEN
    RAISE EXCEPTION 'Conflito de horário: o profissional já tem agendamento nesse intervalo.';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_agendamentos_conflito
BEFORE INSERT OR UPDATE OF inicio, fim, profissional_id, status ON public.agendamentos
FOR EACH ROW EXECUTE FUNCTION public.check_agendamento_conflito();

-- RLS
CREATE POLICY "select_tenant_agendamentos" ON public.agendamentos
  FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY "manage_agendamentos" ON public.agendamentos
  FOR ALL USING (public.can_manage(tenant_id)) WITH CHECK (public.can_manage(tenant_id));
