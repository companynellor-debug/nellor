import { useState, useEffect } from "react";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  DollarSign,
  TrendingUp,
  Users,
  Gift,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Wallet,
  Share2,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";

interface AffiliateData {
  id: string;
  full_name: string | null;
  email: string | null;
  document_type: string | null;
  document_number: string | null;
  registration_step: number;
  stripe_ready: boolean;
  stripe_account_id: string | null;
}

const AfiliadoCadastro = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [step, setStep] = useState(1);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [documentType, setDocumentType] = useState<"cpf" | "cnpj">("cpf");
  const [documentNumber, setDocumentNumber] = useState("");

  useEffect(() => {
    if (user) {
      fetchAffiliateData();
    }
  }, [user?.id]);

  const fetchAffiliateData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data } = await supabase
        .from("affiliates")
        .select("id, full_name, email, document_type, document_number, registration_step, stripe_ready, stripe_account_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setAffiliate(data as AffiliateData);
        // Resume from last step
        const currentStep = data.registration_step || 1;
        
        // If stripe is ready, go to complete
        if (data.stripe_ready) {
          navigate("/cliente/programa-afiliados");
          return;
        }
        
        setStep(currentStep);
        setFullName(data.full_name || "");
        setEmail(data.email || "");
        setDocumentType((data.document_type as "cpf" | "cnpj") || "cpf");
        setDocumentNumber(data.document_number || "");
      }
    } catch (error) {
      console.error("Error fetching affiliate:", error);
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateAffiliate = async (stepNumber: number, additionalData: Record<string, any> = {}) => {
    if (!user) return null;

    setSaving(true);
    try {
      const updateData = {
        user_id: user.id,
        full_name: fullName,
        email: email,
        document_type: documentType,
        document_number: documentNumber,
        registration_step: stepNumber,
        status: "pending" as const,
        terms_accepted_at: new Date().toISOString(),
        ...additionalData,
      };

      if (affiliate?.id) {
        const { data, error } = await supabase
          .from("affiliates")
          .update(updateData)
          .eq("id", affiliate.id)
          .select()
          .single();

        if (error) throw error;
        setAffiliate(data as AffiliateData);
        return data;
      } else {
        const { data, error } = await supabase
          .from("affiliates")
          .insert(updateData)
          .select()
          .single();

        if (error) throw error;
        setAffiliate(data as AffiliateData);
        return data;
      }
    } catch (error: any) {
      console.error("Error saving affiliate:", error);
      toast.error("Erro ao salvar dados");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleStep1Next = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email inválido");
      return;
    }

    const result = await createOrUpdateAffiliate(2);
    if (result) {
      setStep(2);
    }
  };

  const handleStep2Next = async () => {
    if (!documentNumber.trim()) {
      toast.error("Informe o número do documento");
      return;
    }

    // Basic validation
    const cleanDoc = documentNumber.replace(/\D/g, "");
    if (documentType === "cpf" && cleanDoc.length !== 11) {
      toast.error("CPF deve ter 11 dígitos");
      return;
    }
    if (documentType === "cnpj" && cleanDoc.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos");
      return;
    }

    const result = await createOrUpdateAffiliate(3);
    if (result) {
      setStep(3);
    }
  };

  const connectStripe = async () => {
    if (!affiliate) return;

    setConnectingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-onboarding", {
        body: {
          user_id: user?.id,
          account_type: "affiliate",
          affiliate_id: affiliate.id,
        },
      });

      if (error) throw error;
      if (data?.url) {
        // Update step before redirect
        await createOrUpdateAffiliate(4);
        window.location.href = data.url;
      } else {
        throw new Error("No onboarding URL returned");
      }
    } catch (error: any) {
      console.error("Error connecting Stripe:", error);
      toast.error("Erro ao conectar Stripe");
    } finally {
      setConnectingStripe(false);
    }
  };

  const formatDocument = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (documentType === "cpf") {
      return clean
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
        .slice(0, 14);
    } else {
      return clean
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
        .slice(0, 18);
    }
  };

  const progressPercent = ((step) / 3) * 100;

  const steps = [
    { number: 1, label: "Dados", icon: Users },
    { number: 2, label: "Documento", icon: CreditCard },
    { number: 3, label: "Stripe", icon: Wallet },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <ParticlesBackground />

      {/* Header com gradiente estilo Shopee */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground">
        <header className="sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-primary-foreground hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Seja um Afiliado</h1>
              <p className="text-xs opacity-80">Ganhe dinheiro indicando produtos</p>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0">
              {step}/3
            </Badge>
          </div>
        </header>

        {/* Steps indicator */}
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            {steps.map((s, idx) => (
              <div key={s.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      step >= s.number
                        ? "bg-white text-primary"
                        : "bg-white/20 text-primary-foreground"
                    }`}
                  >
                    {step > s.number ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <s.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs mt-1 opacity-80">{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-2 mt-[-12px] ${
                      step > s.number ? "bg-white" : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 relative z-10 -mt-4">
        {/* Welcome/Benefits (only if no affiliate exists and step 1) */}
        {!affiliate && step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Hero Card */}
            <Card className="p-6 bg-gradient-to-br from-background to-muted/30 border-border shadow-lg rounded-2xl">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Ganhe uma Renda Extra!
                </h2>
                <p className="text-muted-foreground text-sm">
                  Indique produtos e ganhe comissões em cada venda
                </p>
              </div>

              {/* Stats Preview */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-lg font-bold text-foreground">50%</p>
                  <p className="text-xs text-muted-foreground">de comissão</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-lg font-bold text-foreground">4 meses</p>
                  <p className="text-xs text-muted-foreground">recorrência</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Gift className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-lg font-bold text-foreground">1000+</p>
                  <p className="text-xs text-muted-foreground">produtos</p>
                </div>
              </div>

              <Button onClick={() => setStep(1)} size="lg" className="w-full rounded-xl">
                Começar Agora
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Card>

            {/* Benefits List */}
            <Card className="p-5 rounded-2xl border-border">
              <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Por que ser afiliado?
              </h3>
              <div className="space-y-3">
                {[
                  { title: "Ganhe comissões em cada venda", desc: "Cada compra pelo seu link gera comissão" },
                  { title: "Comissão recorrente", desc: "Continue ganhando por até 4 meses" },
                  { title: "Pagamento automático via Stripe", desc: "Direto na sua conta bancária" },
                  { title: "Milhares de produtos", desc: "Escolha entre diversos produtos" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* How it works */}
            <Card className="p-5 rounded-2xl border-border">
              <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Como funciona?
              </h3>
              <div className="space-y-3">
                {[
                  "Cadastre-se como afiliado",
                  "Conecte sua conta Stripe",
                  "Gere links e compartilhe",
                  "Ganhe comissão em cada venda!",
                ].map((text, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Step 1: Basic Info - quando já tem affiliate ou clicou começar */}
        {(affiliate || step === 1) && step === 1 && affiliate && (
          <Card className="p-6 rounded-2xl border-border shadow-lg animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Suas Informações</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Precisamos de alguns dados básicos
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium">Nome Completo *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="mt-1.5 rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Usaremos este e-mail para comunicações importantes
                </p>
              </div>
            </div>

            <Button
              onClick={handleStep1Next}
              disabled={saving || !fullName.trim() || !email.trim()}
              size="lg"
              className="w-full mt-6 rounded-xl"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Continuar
                  <ChevronRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </Card>
        )}

        {/* Step 1 for new users who clicked "Começar" */}
        {!affiliate && step === 1 && (
          <></>
        )}

        {/* Step 2: Document */}
        {step === 2 && (
          <Card className="p-6 rounded-2xl border-border shadow-lg animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Documento</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Para emissão de pagamentos
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Tipo de Documento *</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentType("cpf");
                      setDocumentNumber("");
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      documentType === "cpf"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="font-medium text-sm">CPF</p>
                    <p className="text-xs text-muted-foreground">Pessoa Física</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentType("cnpj");
                      setDocumentNumber("");
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      documentType === "cnpj"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Briefcase className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="font-medium text-sm">CNPJ</p>
                    <p className="text-xs text-muted-foreground">Empresa</p>
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="docNumber" className="text-sm font-medium">
                  {documentType === "cpf" ? "CPF" : "CNPJ"} *
                </Label>
                <Input
                  id="docNumber"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(formatDocument(e.target.value))}
                  placeholder={documentType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                  maxLength={documentType === "cpf" ? 14 : 18}
                  className="mt-1.5 rounded-xl text-center text-lg tracking-wider"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                size="lg"
                className="flex-1 rounded-xl"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleStep2Next}
                disabled={saving || !documentNumber.trim()}
                size="lg"
                className="flex-1 rounded-xl"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continuar
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Stripe Connect */}
        {step === 3 && (
          <Card className="p-6 rounded-2xl border-border shadow-lg animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#635BFF]/20 to-[#635BFF]/5 flex items-center justify-center">
                <Wallet className="h-8 w-8 text-[#635BFF]" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Conectar Stripe</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Último passo! Configure sua conta para receber pagamentos.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Por que Stripe?
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Pagamentos seguros",
                    "Transferência rápida",
                    "Milhões de usuários",
                    "Sem taxas ocultas",
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Importante:</strong> Você será redirecionado para o Stripe. 
                  Após a configuração, voltará automaticamente.
                </p>
              </div>
            </div>

            <Button
              onClick={connectStripe}
              disabled={connectingStripe}
              size="lg"
              className="w-full bg-[#635BFF] hover:bg-[#5147E5] rounded-xl"
            >
              {connectingStripe ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Wallet className="h-5 w-5 mr-2" />
                  Conectar com Stripe
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setStep(2)}
              size="lg"
              className="w-full mt-3"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AfiliadoCadastro;
