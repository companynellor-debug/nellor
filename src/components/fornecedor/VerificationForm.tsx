import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  CreditCard, 
  MapPin, 
  Key, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Loader2,
  Save
} from "lucide-react";
import { useIdentityVerification } from "@/hooks/useIdentityVerification";
import { toast } from "sonner";

export function VerificationForm() {
  const { data, statusLabel, save, lastError } = useIdentityVerification();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: data.fullName || "",
    document: data.document || "",
    birthDate: data.birthDate || "",
    address: data.address || "",
    pixKey: data.pixKey || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCPF = (value: string) => {
    const nums = value.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
  };

  const formatCNPJ = (value: string) => {
    const nums = value.replace(/\D/g, '').slice(0, 14);
    if (nums.length <= 2) return nums;
    if (nums.length <= 5) return `${nums.slice(0, 2)}.${nums.slice(2)}`;
    if (nums.length <= 8) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5)}`;
    if (nums.length <= 12) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8)}`;
    return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8, 12)}-${nums.slice(12)}`;
  };

  const handleDocumentChange = (value: string) => {
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 11) {
      handleChange('document', formatCPF(value));
    } else {
      handleChange('document', formatCNPJ(value));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    // Simula delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const success = save(formData);
    
    if (success) {
      toast.success("Dados enviados para análise!");
    } else if (lastError) {
      toast.error(lastError);
    }
    
    setLoading(false);
  };

  const getStatusIcon = () => {
    if (data.status === 'verified') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (data.status === 'review') return <Clock className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const getStatusBadge = () => {
    if (data.status === 'verified') return <Badge className="bg-green-100 text-green-800">Verificado</Badge>;
    if (data.status === 'review') return <Badge className="bg-yellow-100 text-yellow-800">Em Análise</Badge>;
    return <Badge className="bg-red-100 text-red-800">Não Verificado</Badge>;
  };

  return (
    <Card className="border-2">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getStatusIcon()}
            Verificação de Identidade
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {data.status === 'verified' ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-800 mb-2">Conta Verificada!</h3>
            <p className="text-muted-foreground">
              Sua conta está verificada e você pode vender e solicitar saques normalmente.
            </p>
          </div>
        ) : data.status === 'review' ? (
          <div className="text-center py-8">
            <Clock className="h-16 w-16 text-yellow-600 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold text-yellow-800 mb-2">Em Análise</h3>
            <p className="text-muted-foreground">
              Seus documentos estão sendo analisados. Isso pode levar até 24 horas.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Dados Pessoais</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Endereço</span>
              </TabsTrigger>
              <TabsTrigger value="bank" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Dados Bancários</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  placeholder="Seu nome completo"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">CPF ou CNPJ</Label>
                <Input
                  id="document"
                  placeholder="000.000.000-00"
                  value={formData.document}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro, cidade - UF"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Informe o endereço completo com CEP
                </p>
              </div>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pixKey" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Chave Pix
                </Label>
                <Input
                  id="pixKey"
                  placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
                  value={formData.pixKey}
                  onChange={(e) => handleChange('pixKey', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Esta chave será usada para receber seus saques
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <h4 className="font-medium text-sm mb-2">💡 Dica</h4>
                <p className="text-xs text-muted-foreground">
                  Use sua chave Pix CPF ou CNPJ para maior segurança. 
                  Certifique-se de que a chave está correta, pois será usada para todos os saques.
                </p>
              </div>
            </TabsContent>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button onClick={handleSubmit} disabled={loading} className="min-w-[200px]">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enviar para Análise
              </Button>
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
