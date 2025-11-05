import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { toast } from "sonner";

const Configuracoes = () => {
  const [formData, setFormData] = useState({
    storeName: 'Minha Loja Premium',
    pixKey: '11999999999',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    phone: '(11) 99999-9999',
    whatsapp: '(11) 99999-9999',
    password: '',
  });

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <Label>Nome da Loja</Label>
            <Input
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="Nome da sua loja"
            />
          </div>

          <div>
            <Label>Chave Pix (para receber pagamentos)</Label>
            <Input
              value={formData.pixKey}
              onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
              placeholder="CPF, CNPJ, Email ou Telefone"
            />
          </div>

          <div>
            <Label>Endereço Comercial</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Endereço completo"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <Label>Alterar Senha</Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Digite uma nova senha"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Deixe em branco para manter a senha atual
            </p>
          </div>

          <Button onClick={handleSave} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Configuracoes;
