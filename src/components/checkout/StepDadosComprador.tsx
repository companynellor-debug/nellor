import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSupabaseAddresses, Address } from "@/hooks/useSupabaseAddresses";
import { supabase } from "@/integrations/supabase/client";
import { User, MapPin, Plus, Loader2 } from "lucide-react";
import { z } from "zod";

const buyerSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  documento: z.string().min(11, "CPF/CNPJ inválido").max(18, "CPF/CNPJ inválido"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
});

export interface BuyerData {
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  endereco: Address | null;
}

interface StepDadosCompradorProps {
  onNext: (data: BuyerData) => void;
  initialData?: BuyerData;
}

interface SupabaseProfile {
  nome: string;
  email: string;
  telefone: string | null;
  document: string | null;
}

export const StepDadosComprador = ({ onNext, initialData }: StepDadosCompradorProps) => {
  const { addresses, loading: addressesLoading } = useSupabaseAddresses();
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    documento: initialData?.documento || "",
    email: initialData?.email || "",
    telefone: initialData?.telefone || "",
  });
  
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    initialData?.endereco?.id || null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch profile from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('nome, email, telefone, document')
            .eq('id', user.id)
            .single();
          
          if (data) {
            setProfile(data as SupabaseProfile);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  // Pre-fill from profile
  useEffect(() => {
    if (profile && !initialData) {
      setFormData((prev) => ({
        ...prev,
        nome: profile.nome || prev.nome,
        email: profile.email || prev.email,
        telefone: profile.telefone || prev.telefone,
        documento: profile.document || prev.documento,
      }));
    }
  }, [profile, initialData]);

  // Auto-select default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else {
        setSelectedAddressId(addresses[0].id);
      }
    }
  }, [addresses, selectedAddressId]);

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      // CPF format
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .slice(0, 14);
    } else {
      // CNPJ format
      return numbers
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})/, "$1-$2")
        .slice(0, 18);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 14);
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === "documento") {
      formattedValue = formatDocument(value);
    } else if (field === "telefone") {
      formattedValue = formatPhone(value);
    }
    
    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = () => {
    // Validate form
    const result = buyerSchema.safeParse({
      ...formData,
      documento: formData.documento.replace(/\D/g, ""),
      telefone: formData.telefone.replace(/\D/g, ""),
    });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    // Validate address selection
    if (!selectedAddressId) {
      setErrors((prev) => ({ ...prev, endereco: "Selecione um endereço de entrega" }));
      return;
    }

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    
    onNext({
      ...formData,
      endereco: selectedAddress || null,
    });
  };

  const loading = profileLoading || addressesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Data */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                placeholder="Seu nome completo"
                className={errors.nome ? "border-destructive" : ""}
              />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento">CPF ou CNPJ *</Label>
              <Input
                id="documento"
                value={formData.documento}
                onChange={(e) => handleInputChange("documento", e.target.value)}
                placeholder="000.000.000-00"
                className={errors.documento ? "border-destructive" : ""}
              />
              {errors.documento && (
                <p className="text-xs text-destructive">{errors.documento}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="seu@email.com"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleInputChange("telefone", e.target.value)}
                placeholder="(00) 00000-0000"
                className={errors.telefone ? "border-destructive" : ""}
              />
              {errors.telefone && (
                <p className="text-xs text-destructive">{errors.telefone}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Selection */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Endereço de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Você ainda não tem endereços cadastrados.
              </p>
              <Button
                variant="outline"
                onClick={() => window.open("/cliente/enderecos", "_blank")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Endereço
              </Button>
            </div>
          ) : (
            <RadioGroup
              value={selectedAddressId || ""}
              onValueChange={setSelectedAddressId}
              className="space-y-3"
            >
              {addresses.map((address) => (
                <label
                  key={address.id}
                  htmlFor={address.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedAddressId === address.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{address.label}</span>
                      {address.is_default && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {address.street}, {address.number}
                      {address.complement && ` - ${address.complement}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.neighborhood} - {address.city}/{address.state}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CEP: {address.zip_code}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          )}
          {errors.endereco && (
            <p className="text-xs text-destructive mt-2">{errors.endereco}</p>
          )}
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Button
        onClick={handleSubmit}
        className="w-full h-14 text-lg font-semibold"
        disabled={addresses.length === 0}
      >
        Continuar para Pagamento
      </Button>
    </div>
  );
};
