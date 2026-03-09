import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Plus, Trash2, Home, Briefcase, Star, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSupabaseAddresses } from "@/hooks/useSupabaseAddresses";
import { formatCep, fetchAddressByCep } from "@/utils/viaCep";

const Enderecos = () => {
  const navigate = useNavigate();
  const { addresses, addAddress, deleteAddress, setDefaultAddress } = useSupabaseAddresses();
  const [showDialog, setShowDialog] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepValid, setCepValid] = useState<boolean | null>(null);
  const [cepAutoFilled, setCepAutoFilled] = useState(false);
  const [formData, setFormData] = useState({
    label: 'Casa',
    name: '',
    document: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
  });

  const resetForm = () => {
    setFormData({
      label: 'Casa', name: '', document: '', street: '', number: '',
      complement: '', neighborhood: '', city: '', state: '', zip_code: '',
    });
    setCepValid(null);
    setCepAutoFilled(false);
  };

  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    setFormData(prev => ({ ...prev, zip_code: formatted }));
    setCepValid(null);
    setCepAutoFilled(false);

    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      setCepLoading(true);
      const result = await fetchAddressByCep(clean);
      setCepLoading(false);

      if (result) {
        setFormData(prev => ({
          ...prev,
          street: result.logradouro || '',
          neighborhood: result.bairro || '',
          city: result.localidade || '',
          state: result.uf || '',
        }));
        setCepValid(true);
        setCepAutoFilled(true);
        toast.success("Endereço encontrado pelo CEP!");
      } else {
        setCepValid(false);
        setCepAutoFilled(false);
        toast.error("CEP não encontrado. Verifique o número digitado.");
      }
    }
  };

  const handleAddAddress = async () => {
    // Validate CEP
    const cleanCep = formData.zip_code.replace(/\D/g, '');
    if (cleanCep.length !== 8 || cepValid === false) {
      toast.error("CEP inválido. Verifique o número digitado.");
      return;
    }

    if (!formData.street || !formData.neighborhood || !formData.city || !formData.state) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!formData.number.trim()) {
      toast.error("Preencha o número do endereço");
      return;
    }

    try {
      await addAddress({
        label: formData.label || 'Casa',
        name: formData.name || '',
        document: formData.document || '',
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zip_code: cleanCep,
        is_default: addresses.length === 0,
      });

      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error adding address:', error);
    }
  };

  const handleDeleteAddress = (id: string) => {
    deleteAddress(id);
    toast.success("Endereço removido!");
  };

  const handleSetDefault = (id: string) => {
    setDefaultAddress(id);
    toast.success("Endereço padrão atualizado!");
  };

  const getLabelIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'trabalho': return Briefcase;
      default: return Home;
    }
  };

  const formatDisplayCep = (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8) return `${clean.slice(0, 5)}-${clean.slice(5)}`;
    return cep;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/cliente/perfil")} className="hover:bg-accent p-2 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-primary">Endereços</h1>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="space-y-4">
          {addresses.map((address) => {
            const LabelIcon = getLabelIcon(address.label);
            return (
              <Card key={address.id} className="bg-white border shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <LabelIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{address.label}</h3>
                        {address.is_default && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{address.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!address.is_default && (
                      <Button size="sm" variant="ghost" onClick={() => handleSetDefault(address.id)}>
                        Padrão
                      </Button>
                    )}
                    <button onClick={() => handleDeleteAddress(address.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{address.street}, {address.number}</p>
                  {address.complement && <p>{address.complement}</p>}
                  <p>{address.neighborhood}</p>
                  <p>{address.city} - {address.state}</p>
                  <p>CEP: {formatDisplayCep(address.zip_code)}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {addresses.length === 0 && (
          <Card className="bg-white border shadow-sm p-8 text-center">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-bold text-lg mb-2">Nenhum endereço cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione um endereço para facilitar suas compras
            </p>
            <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Endereço
            </Button>
          </Card>
        )}
      </main>

      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Endereço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Identificação</Label>
              <select
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Casa">Casa</option>
                <option value="Trabalho">Trabalho</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {/* CEP First - auto-fills the rest */}
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP* {cepLoading && <Loader2 className="h-3 w-3 inline animate-spin ml-1" />}</Label>
              <Input
                id="zipCode"
                value={formData.zip_code}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className={cepValid === false ? 'border-red-500' : cepValid === true ? 'border-green-500' : ''}
              />
              {cepValid === false && (
                <p className="text-xs text-red-500">CEP não encontrado. Verifique o número digitado.</p>
              )}
              {cepValid === true && (
                <p className="text-xs text-green-600">CEP válido ✓</p>
              )}
              {cepValid === null && (
                <p className="text-[10px] text-muted-foreground">Digite o CEP para preencher automaticamente</p>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3 space-y-2">
                <Label htmlFor="street">Rua*</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Nome da rua"
                  disabled={cepAutoFilled}
                  className={cepAutoFilled ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Nº*</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="123"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={formData.complement}
                onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                placeholder="Apto, Bloco, etc"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro*</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="Nome do bairro"
                disabled={cepAutoFilled}
                className={cepAutoFilled ? 'bg-muted' : ''}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade*</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Cidade"
                  disabled={cepAutoFilled}
                  className={cepAutoFilled ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado*</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  placeholder="UF"
                  maxLength={2}
                  disabled={cepAutoFilled}
                  className={cepAutoFilled ? 'bg-muted' : ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo (opcional)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">CPF/CNPJ (opcional)</Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleAddAddress} 
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={cepValid === false || cepLoading}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Enderecos;
