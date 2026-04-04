import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, User, Loader2, MapPin, FileText, Camera, CheckCircle, Clock, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupplierApplication, type BusinessType } from "@/hooks/useSupplierApplication";
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ, formatPhone, fetchCNPJData } from "@/utils/documentValidation";
import { fetchAddressByCep, formatCep } from "@/utils/viaCep";
import { toast } from "sonner";
import { BottomNav } from "@/components/cliente/BottomNav";

const PRODUCT_CATEGORIES = [
  "Moda e Acessórios",
  "Eletrônicos",
  "Casa e Decoração",
  "Beleza e Saúde",
  "Alimentos e Bebidas",
  "Esportes e Lazer",
  "Papelaria e Escritório",
  "Pet Shop",
  "Automotivo",
  "Artesanato",
  "Outros",
];

type Step = "form" | "documents" | "waiting" | "status";

export default function SolicitarFornecedor() {
  const navigate = useNavigate();
  const { application, isLoading, createApplication, uploadDocument, submitDocuments, canReapply, daysUntilReapply } = useSupplierApplication();

  // Determine current step based on application state
  const getCurrentStep = (): Step => {
    if (!application) return "form";
    if (application.status === "pending") return "documents";
    if (application.status === "under_review") return "waiting";
    if (application.status === "approved") return "status";
    if (application.status === "rejected") return canReapply ? "form" : "status";
    return "form";
  };

  const [step, setStep] = useState<Step>("form");
  const [businessType, setBusinessType] = useState<BusinessType>("individual");
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Document uploads
  const [docFront, setDocFront] = useState<File | null>(null);
  const [docBack, setDocBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [extraDoc, setExtraDoc] = useState<File | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setStep(getCurrentStep());
    }
  }, [application, isLoading]);

  // Auto-fetch CNPJ data
  const handleCnpjChange = async (value: string) => {
    const formatted = formatCNPJ(value);
    setCnpj(formatted);

    const nums = value.replace(/\D/g, '');
    if (nums.length === 14 && validateCNPJ(nums)) {
      setLoadingCnpj(true);
      const result = await fetchCNPJData(nums);
      setLoadingCnpj(false);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        setCompanyName(result.data.razao_social);
        setStreet(result.data.logradouro);
        setNumber(result.data.numero);
        setComplement(result.data.complemento);
        setNeighborhood(result.data.bairro);
        setCity(result.data.municipio);
        setState(result.data.uf);
        if (result.data.cep) setCep(formatCep(result.data.cep));
        toast.success("Dados do CNPJ preenchidos automaticamente!");
      }
    }
  };

  // Auto-fetch address by CEP
  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    setCep(formatted);

    const nums = value.replace(/\D/g, '');
    if (nums.length === 8) {
      setLoadingCep(true);
      const result = await fetchAddressByCep(nums);
      setLoadingCep(false);

      if (result) {
        setStreet(result.logradouro);
        setNeighborhood(result.bairro);
        setCity(result.localidade);
        setState(result.uf);
        toast.success("Endereço preenchido pelo CEP!");
      }
    }
  };

  const handleSubmitForm = async () => {
    // Validations
    if (!fullName.trim()) { toast.error("Informe seu nome completo"); return; }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) { toast.error("Informe um telefone válido com DDD"); return; }
    
    if (businessType === "individual") {
      if (!validateCPF(cpf)) { toast.error("CPF inválido. Verifique os dígitos."); return; }
    } else {
      if (!validateCNPJ(cnpj)) { toast.error("CNPJ inválido. Verifique os dígitos."); return; }
      if (!companyName.trim()) { toast.error("Razão social é obrigatória para PJ"); return; }
    }

    if (!cep.trim() || cep.replace(/\D/g, '').length !== 8) { toast.error("Informe um CEP válido"); return; }
    if (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !state.trim()) {
      toast.error("Preencha o endereço completo"); return;
    }

    setSubmitting(true);
    try {
      await createApplication.mutateAsync({
        business_type: businessType,
        full_name: fullName,
        cpf: businessType === "individual" ? cpf : null,
        cnpj: businessType === "company" ? cnpj : null,
        company_name: businessType === "company" ? companyName : null,
        phone,
        product_category: category || null,
        business_description: description || null,
        address_cep: cep.replace(/\D/g, ''),
        address_street: street,
        address_number: number,
        address_complement: complement || null,
        address_neighborhood: neighborhood,
        address_city: city,
        address_state: state,
      });
      setStep("documents");
    } catch {
      // error handled by mutation
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDocuments = async () => {
    if (!application) return;
    if (!docFront || !docBack || !selfie) {
      toast.error("Envie todos os documentos obrigatórios");
      return;
    }

    setUploadingDocs(true);
    try {
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadDocument(docFront, "doc-front"),
        uploadDocument(docBack, "doc-back"),
        uploadDocument(selfie, "selfie"),
      ]);

      let extraUrl: string | undefined;
      if (extraDoc) {
        extraUrl = await uploadDocument(extraDoc, "extra-doc");
      }

      await submitDocuments.mutateAsync({
        applicationId: application.id,
        documentFrontUrl: frontUrl,
        documentBackUrl: backUrl,
        selfieUrl: selfieUrl,
        extraDocumentUrl: extraUrl,
      });

      setStep("waiting");
    } catch {
      // error handled
    } finally {
      setUploadingDocs(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold">Quero Vender na Nellor</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5 max-w-lg space-y-5">
        {/* Progress indicator */}
        {(step === "form" || step === "documents") && (
          <div className="flex items-center gap-2">
            {["Dados", "Documentos", "Análise"].map((label, i) => {
              const isActive = (step === "form" && i === 0) || (step === "documents" && i === 1);
              const isDone = (step === "documents" && i === 0) || (step === "waiting" && i <= 1);
              return (
                <div key={label} className="flex-1">
                  <div className={`h-1.5 rounded-full transition-colors ${isDone ? "bg-primary" : isActive ? "bg-primary" : "bg-muted"}`} />
                  <p className={`text-[10px] mt-1 text-center ${isActive || isDone ? "text-primary font-medium" : "text-muted-foreground"}`}>{label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* STEP: Form */}
        {step === "form" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Dados do Vendedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Business type */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: "individual" as const, icon: User, label: "Pessoa Física" },
                  { type: "company" as const, icon: Building2, label: "Pessoa Jurídica" },
                ].map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setBusinessType(opt.type)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      businessType === opt.type
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/30"
                    }`}
                  >
                    <opt.icon className={`h-6 w-6 mx-auto mb-1 ${businessType === opt.type ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label>{businessType === "company" ? "Nome do Responsável" : "Nome Completo"}</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" />
              </div>

              {/* Document */}
              {businessType === "individual" ? (
                <div className="space-y-1.5">
                  <Label>CPF</Label>
                  <Input
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>CNPJ</Label>
                    <div className="relative">
                      <Input
                        value={cnpj}
                        onChange={(e) => handleCnpjChange(e.target.value)}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                      />
                      {loadingCnpj && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Os dados serão preenchidos automaticamente pela Receita Federal</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Razão Social</Label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Razão social da empresa" />
                  </div>
                </>
              )}

              {/* Phone */}
              <div className="space-y-1.5">
                <Label>Telefone com DDD</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              {/* Address */}
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Endereço</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>CEP</Label>
                    <div className="relative">
                      <Input
                        value={cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                      {loadingCep && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Rua</Label>
                    <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Nome da rua" />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5">
                      <Label>Número</Label>
                      <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Nº" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Complemento</Label>
                      <Input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, sala..." />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Bairro</Label>
                    <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1.5">
                      <Label>Cidade</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>UF</Label>
                      <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="UF" maxLength={2} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="pt-2 border-t space-y-3">
                <div className="space-y-1.5">
                  <Label>Categoria principal de produtos</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Descrição do seu negócio</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Conte sobre seu negócio, o que vende, diferenciais..."
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{description.length}/500</p>
                </div>
              </div>

              <Button onClick={handleSubmitForm} className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                Continuar para Documentos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP: Documents */}
        {step === "documents" && application && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Verificação de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {application.business_type === "individual"
                  ? "Envie fotos do seu documento de identidade (RG ou CNH) e uma selfie segurando o documento."
                  : "Envie o cartão CNPJ, contrato social ou certificado MEI, e o documento do responsável."}
              </p>

              {/* Doc front */}
              <FileUploadField
                label={application.business_type === "individual" ? "Frente do RG ou CNH" : "Cartão CNPJ"}
                file={docFront}
                onFileChange={setDocFront}
                required
              />

              {/* Doc back */}
              <FileUploadField
                label={application.business_type === "individual" ? "Verso do RG ou CNH" : "Contrato Social / Certificado MEI"}
                file={docBack}
                onFileChange={setDocBack}
                required
              />

              {/* Selfie */}
              <FileUploadField
                label={application.business_type === "individual" ? "Selfie segurando o documento" : "Documento do responsável legal"}
                file={selfie}
                onFileChange={setSelfie}
                icon={<Camera className="h-4 w-4" />}
                required
              />

              {/* Extra doc (optional for company) */}
              {application.business_type === "company" && (
                <FileUploadField
                  label="Documento adicional (opcional)"
                  file={extraDoc}
                  onFileChange={setExtraDoc}
                />
              )}

              <Button onClick={handleSubmitDocuments} className="w-full" disabled={uploadingDocs}>
                {uploadingDocs ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando documentos...
                  </>
                ) : (
                  "Enviar para Análise"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP: Waiting */}
        {step === "waiting" && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
                <Clock className="h-10 w-10 text-blue-600 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold">Solicitação em Análise</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Sua solicitação foi enviada e está sendo analisada pela nossa equipe. 
                O prazo estimado é de <strong>1 a 3 dias úteis</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                Você receberá uma notificação quando a análise for concluída.
              </p>
              <Button variant="outline" onClick={() => navigate("/cliente/perfil")} className="mt-4">
                Voltar ao Perfil
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP: Status (approved/rejected) */}
        {step === "status" && application && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              {application.status === "approved" ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-green-800 dark:text-green-300">Aprovado!</h2>
                  <p className="text-muted-foreground text-sm">
                    Sua conta de fornecedor foi aprovada. Complete o onboarding para começar a vender.
                  </p>
                  <Button onClick={() => navigate("/fornecedor/onboarding")}>
                    Iniciar Configuração da Loja
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                    <XCircle className="h-10 w-10 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-red-800 dark:text-red-300">Solicitação Recusada</h2>
                  {application.rejection_reason && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-left">
                      <p className="text-xs font-medium text-red-800 dark:text-red-300 mb-1">Motivo:</p>
                      <p className="text-sm text-red-700 dark:text-red-400">{application.rejection_reason}</p>
                    </div>
                  )}
                  {canReapply ? (
                    <Button onClick={() => setStep("form")}>
                      Enviar Nova Solicitação
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Você poderá enviar uma nova solicitação em <strong>{daysUntilReapply} dia(s)</strong>.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

// File upload field component
function FileUploadField({
  label,
  file,
  onFileChange,
  icon,
  required,
}: {
  label: string;
  file: File | null;
  onFileChange: (f: File | null) => void;
  icon?: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        {icon}
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <label className={`flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
        file ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
      }`}>
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="text-center">
            <CheckCircle className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-xs text-primary font-medium truncate max-w-[200px]">{file.name}</p>
            <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        ) : (
          <div className="text-center">
            <Camera className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Clique para enviar</p>
          </div>
        )}
      </label>
    </div>
  );
}
