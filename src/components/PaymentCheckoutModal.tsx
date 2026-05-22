import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import { Loader2, QrCode, CreditCard, Copy, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import {
  getMpPublicKey,
  subscribeWithCardToken,
  createPixPayment,
} from "@/lib/plan-billing.functions";

type PlanId = "start" | "profissional" | "studio";

interface Props {
  open: boolean;
  onClose: () => void;
  plan: PlanId | null;
  planLabel: string;
  planAmount: number;
  onSuccess?: () => void;
}

let mpInitialized = false;

interface CardBrickProps {
  amount: number;
  payerEmail?: string;
  instanceKey: string | number;
  onToken: (p: { cardToken: string; payerEmail: string }) => Promise<void> | void;
  onBrickError: (msg: string) => void;
  onBrickReady: () => void;
}

// Memoized wrapper: stable props prevent MP Brick re-init failures.
const CardPaymentBrick = ({ amount, payerEmail, onToken, onBrickError, onBrickReady }: CardBrickProps) => {
  const initialization = useMemo(
    () => ({ amount, ...(payerEmail ? { payer: { email: payerEmail } } : {}) }),
    [amount, payerEmail],
  );
  const customization = useMemo(
    () => ({
      paymentMethods: { maxInstallments: 1 },
      visual: { hideFormTitle: true, style: { theme: "default" as const } },
    }),
    [],
  );
  return (
    <CardPayment
      initialization={initialization}
      customization={customization}
      onReady={() => onBrickReady()}
      onSubmit={async (param) => {
        const cardToken = (param as { token?: string }).token;
        const payerEmailRes =
          (param as { payer?: { email?: string } }).payer?.email ?? payerEmail ?? "";
        if (!cardToken || !payerEmailRes) {
          toast.error("Token do cartão inválido");
          return;
        }
        await onToken({ cardToken, payerEmail: payerEmailRes });
      }}
      onError={(err) => {
        console.error("MP Brick error:", err);
        onBrickError(
          "Não foi possível carregar o formulário de cartão. Verifique sua conexão e tente novamente.",
        );
      }}
    />
  );
};

export function PaymentCheckoutModal({ open, onClose, plan, planLabel, planAmount, onSuccess }: Props) {
  const fetchPublicKey = useServerFn(getMpPublicKey);
  const subscribeFn = useServerFn(subscribeWithCardToken);
  const pixFn = useServerFn(createPixPayment);
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [tab, setTab] = useState<"card" | "pix">("card");
  const [brickReady, setBrickReady] = useState(false);
  const [brickError, setBrickError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [showTestCards, setShowTestCards] = useState(false);
  // Bumped on every modal open + on manual retry so the Brick fully remounts
  // (the MP SDK reuses an internal DOM container id and chokes on remount).
  const instanceRef = useRef(0);
  const [instanceKey, setInstanceKey] = useState(0);

  // Pix state
  const [pixEmail, setPixEmail] = useState("");
  const [pixLoading, setPixLoading] = useState(false);
  const [pixResult, setPixResult] = useState<{ qrBase64: string | null; qrCode: string | null; ticketUrl: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  // Card state (the brick gets the email itself)
  const [cardLoading, setCardLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    instanceRef.current += 1;
    setInstanceKey(instanceRef.current);
    setBrickReady(false);
    setBrickError(null);
    setInitError(null);

    if (mpInitialized) {
      setReady(true);
      return;
    }
    fetchPublicKey()
      .then(({ publicKey }) => {
        console.info("[MP] public key prefix:", publicKey.slice(0, 8));
        setIsTestMode(publicKey.startsWith("TEST-"));
        initMercadoPago(publicKey, { locale: "pt-BR" });
        mpInitialized = true;
        setReady(true);
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Erro ao carregar Mercado Pago";
        setInitError(msg);
        toast.error(msg);
      });
  }, [open, fetchPublicKey]);

  // Timeout fallback: surface a clear error if the brick never finishes loading
  useEffect(() => {
    if (!ready || tab !== "card" || brickReady || brickError) return;
    const t = setTimeout(() => {
      setBrickError(
        "O formulário do Mercado Pago não carregou. Verifique se a chave pública (MERCADO_PAGO_PUBLIC_KEY) e o access token (MERCADO_PAGO_ACCESS_TOKEN) são do mesmo aplicativo no Mercado Pago — ambos de produção ou ambos de teste.",
      );
    }, 10000);
    return () => clearTimeout(t);
  }, [ready, tab, brickReady, brickError, instanceKey]);

  // Reset when closing
  useEffect(() => {
    if (!open) {
      setPixResult(null);
      setPixEmail("");
      setTab("card");
      setBrickReady(false);
      setBrickError(null);
    }
  }, [open]);

  if (!plan) return null;

  const userEmail = user?.email ?? undefined;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assinar {planLabel}</DialogTitle>
          <DialogDescription>
            R$ {planAmount.toFixed(2).replace(".", ",")}/mês — pagamento processado pelo Mercado Pago.
          </DialogDescription>
        </DialogHeader>

        {initError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Não foi possível iniciar o pagamento</p>
              <p className="opacity-80 mt-1">{initError}</p>
            </div>
          </div>
        ) : !ready ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "card" | "pix")} className="mt-2">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="card" className="gap-2">
                <CreditCard className="w-4 h-4" /> Cartão (mensal)
              </TabsTrigger>
              <TabsTrigger value="pix" className="gap-2">
                <QrCode className="w-4 h-4" /> Pix (1 mês)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="mt-4">
              {isTestMode && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <button
                    type="button"
                    onClick={() => setShowTestCards((v) => !v)}
                    className="flex items-center gap-2 font-medium w-full text-left"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Modo de teste — clique para ver cartões de teste do Mercado Pago
                  </button>
                  {showTestCards && (
                    <div className="mt-2 space-y-1 font-mono leading-relaxed">
                      <div><strong>Mastercard:</strong> 5031 4332 1540 6351</div>
                      <div><strong>Visa:</strong> 4235 6477 2802 5682</div>
                      <div><strong>Elo:</strong> 5067 7667 8388 8311</div>
                      <div className="font-sans pt-1">
                        <strong>CVV:</strong> 123 · <strong>Validade:</strong> 11/30
                      </div>
                      <div className="font-sans">
                        <strong>Nome:</strong> APRO (aprovado) · OTHE (recusado) · CONT (pendente)
                      </div>
                      <div className="font-sans"><strong>CPF:</strong> 12345678909</div>
                    </div>
                  )}
                </div>
              )}
              {cardLoading && (
                <div className="flex items-center gap-2 text-sm text-ink-soft mb-3">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processando assinatura…
                </div>
              )}

              {brickError ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>{brickError}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setBrickError(null);
                      setBrickReady(false);
                      instanceRef.current += 1;
                      setInstanceKey(instanceRef.current);
                    }}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <>
                  {!brickReady && (
                    <div className="flex items-center gap-2 text-sm text-ink-soft mb-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando formulário de pagamento…
                    </div>
                  )}
                  {/* key forces full unmount/remount so the MP SDK can re-init its container cleanly */}
                  <div key={`card-brick-${instanceKey}`}>
                    <CardPaymentBrick
                      instanceKey={instanceKey}
                      amount={planAmount}
                      payerEmail={userEmail}
                      onBrickReady={() => setBrickReady(true)}
                      onBrickError={(msg) => setBrickError(msg)}
                      onToken={async ({ cardToken, payerEmail }) => {
                        setCardLoading(true);
                        try {
                          const res = await subscribeFn({
                            data: { plan, cardToken, payerEmail },
                          });
                          if (res.status === "authorized") {
                            toast.success("Assinatura ativada com sucesso!");
                            onSuccess?.();
                            onClose();
                          } else {
                            toast.info(`Assinatura ${res.status}. Aguardando confirmação.`);
                            onClose();
                          }
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Erro ao assinar");
                        } finally {
                          setCardLoading(false);
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="pix" className="mt-4 space-y-4">
              {!pixResult ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pix-email">E-mail do pagador</Label>
                    <Input
                      id="pix-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={pixEmail}
                      onChange={(e) => setPixEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={pixLoading || !pixEmail.includes("@")}
                    onClick={async () => {
                      setPixLoading(true);
                      try {
                        const res = await pixFn({ data: { plan, payerEmail: pixEmail } });
                        setPixResult(res);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Erro ao gerar Pix");
                      } finally {
                        setPixLoading(false);
                      }
                    }}
                  >
                    {pixLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Gerar QR Code Pix
                  </Button>
                </>
              ) : (
                <div className="space-y-3 text-center">
                  {pixResult.qrBase64 && (
                    <img
                      src={`data:image/png;base64,${pixResult.qrBase64}`}
                      alt="QR Code Pix"
                      className="w-56 h-56 mx-auto rounded-lg border border-border bg-white p-2"
                    />
                  )}
                  {pixResult.qrCode && (
                    <div className="text-left">
                      <Label className="text-xs text-ink-soft">Pix copia-e-cola</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={pixResult.qrCode} readOnly className="font-mono text-xs" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(pixResult.qrCode!);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-ink-soft">
                    Após o pagamento, seu plano será ativado automaticamente em alguns segundos.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
