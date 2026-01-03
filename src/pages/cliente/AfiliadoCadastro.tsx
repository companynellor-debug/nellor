import { useState, useEffect } from "react";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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

  const progressPercent = ((step - 1) / 3) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ParticlesBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Seja um Afiliado</h1>
            <p className="text-xs text-muted-foreground">Etapa {step} de 3</p>
          </div>
        </div>
        <Progress value={progressPercent} className="h-1" />
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {/* Step 0: Welcome/Benefits (only if no affiliate exists) */}
        {!affiliate && step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Hero Section */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Ganhe uma Renda Extra!
                </h2>
                <p className="text-muted-foreground">
                  Indique produtos e ganhe comissões em cada venda. Simples assim!
                </p>
              </div>

              {/* Stats Preview */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 rounded-lg bg-background/80">
                  <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Comissões de até</p>
                  <p className="font-bold text-foreground">50%</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/80">
                  <TrendingUp className="h-6 w-6 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Duração</p>
                  <p className="font-bold text-foreground">4 meses</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/80">
                  <Gift className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Recorrente</p>
                  <p className="font-bold text-foreground">Sim!</p>
                </div>
              </div>
            </Card>

            {/* Benefits */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-foreground">Por que ser afiliado?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Ganhe comissões em cada venda</p>
                    <p className="text-sm text-muted-foreground">
                      Cada pessoa que comprar pelo seu link gera comissão para você
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Comissão recorrente</p>
                    <p className="text-sm text-muted-foreground">
                      Continue ganhando por até 4 meses nas compras do mesmo cliente
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Pagamento automático via Stripe</p>
                    <p className="text-sm text-muted-foreground">
                      Receba diretamente na sua conta bancária sem complicação
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Milhares de produtos</p>
                    <p className="text-sm text-muted-foreground">
                      Escolha entre diversos produtos de várias lojas
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* How it works */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 text-foreground">Como funciona?</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <p className="text-sm text-foreground">Cadastre-se como afiliado</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <p className="text-sm text-foreground">Conecte sua conta Stripe para receber</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <p className="text-sm text-foreground">Gere links e compartilhe</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <p className="text-sm text-foreground">Ganhe comissão em cada venda!</p>
                </div>
              </div>
            </Card>

            {/* Start Button */}
            <Button onClick={() => setStep(1)} size="lg" className="w-full">
              Começar Cadastro
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Suas Informações</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Precisamos de alguns dados básicos
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Usaremos este e-mail para comunicações importantes
                  </p>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleStep1Next}
              disabled={saving || !fullName.trim() || !email.trim()}
              size="lg"
              className="w-full"
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
        )}

        {/* Step 2: Document */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Documento</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Para emissão de pagamentos
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Tipo de Documento *</Label>
                  <RadioGroup
                    value={documentType}
                    onValueChange={(value) => {
                      setDocumentType(value as "cpf" | "cnpj");
                      setDocumentNumber("");
                    }}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cpf" id="cpf" />
                      <Label htmlFor="cpf" className="font-normal cursor-pointer">
                        CPF (Pessoa Física)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cnpj" id="cnpj" />
                      <Label htmlFor="cnpj" className="font-normal cursor-pointer">
                        CNPJ (Empresa)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="docNumber">
                    {documentType === "cpf" ? "CPF" : "CNPJ"} *
                  </Label>
                  <Input
                    id="docNumber"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(formatDocument(e.target.value))}
                    placeholder={documentType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                    maxLength={documentType === "cpf" ? 14 : 18}
                  />
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                size="lg"
                className="flex-1"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleStep2Next}
                disabled={saving || !documentNumber.trim()}
                size="lg"
                className="flex-1"
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
          </div>
        )}

        {/* Step 3: Stripe Connect */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#635BFF]/10 flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-[#635BFF]" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Conectar Stripe</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Último passo! Configure sua conta para receber pagamentos.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <h4 className="font-medium text-foreground mb-2">Por que Stripe?</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Pagamentos seguros e automáticos
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Transferência direto para sua conta
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Usado por milhões de empresas
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Sem taxas ocultas
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>Importante:</strong> Você será redirecionado para o Stripe para completar seu cadastro. 
                    Após a configuração, voltará automaticamente para a plataforma.
                  </p>
                </div>
              </div>

              <Button
                onClick={connectStripe}
                disabled={connectingStripe}
                size="lg"
                className="w-full bg-[#635BFF] hover:bg-[#5147E5]"
              >
                {connectingStripe ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Conectar com Stripe
                  </>
                )}
              </Button>
            </Card>

            <Button
              variant="ghost"
              onClick={() => setStep(2)}
              size="lg"
              className="w-full"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AfiliadoCadastro;
