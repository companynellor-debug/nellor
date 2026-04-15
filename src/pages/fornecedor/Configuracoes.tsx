import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Trash2, CreditCard, Truck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { useSupplierPaymentMethods } from "@/hooks/useSupplierPaymentMethods";
import { useSupplierShippingMethods } from "@/hooks/useSupplierShippingMethods";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Configuracoes = () => {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const { enabledMethods: enabledPayments, toggleMethod: togglePayment, ALL_METHODS: ALL_PAYMENTS } = useSupplierPaymentMethods();
  const { enabledMethods: enabledShipping, toggleMethod: toggleShipping, ALL_METHODS: ALL_SHIPPING } = useSupplierShippingMethods();
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-actions', {
        body: { action: 'self_delete' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await supabase.auth.signOut();
      toast.success('Conta excluída com sucesso.');
      navigate('/');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      toast.error('Erro ao excluir conta: ' + (err.message || 'Tente novamente'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold">Configurações</h1>

      

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

      {/* Delete Account */}
      <Card className="p-6 border-destructive/30">
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h3 className="font-semibold text-destructive">Excluir Conta</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Ao excluir sua conta, todos os seus dados, produtos, pedidos e informações serão permanentemente removidos. Esta ação não pode ser desfeita.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Excluindo...' : 'Excluir minha conta'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. Todos os seus dados, produtos, pedidos, avaliações e informações da loja serão permanentemente excluídos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sim, excluir minha conta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
};

export default Configuracoes;