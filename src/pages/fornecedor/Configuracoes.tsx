import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Trash2, CreditCard, Truck, Store, Lock } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { useSupplierPaymentMethods } from "@/hooks/useSupplierPaymentMethods";
import { useSupplierShippingMethods } from "@/hooks/useSupplierShippingMethods";
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

interface FormState {
  storeName: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  newPassword: string;
}

const Configuracoes = () => {
  const { user, profile } = useSupabaseAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { enabledMethods: enabledPayments, toggleMethod: togglePayment, ALL_METHODS: ALL_PAYMENTS } =
    useSupplierPaymentMethods();
  const { enabledMethods: enabledShipping, toggleMethod: toggleShipping, ALL_METHODS: ALL_SHIPPING } =
    useSupplierShippingMethods();

  const [form, setForm] = useState<FormState>({
    storeName: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
    newPassword: "",
  });

  // Load real profile data
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("nome, email, telefone, endereco_principal, descricao_loja")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        if (cancelled) return;
        const addr = (data?.endereco_principal as any) || {};
        const addrText = addr.street
          ? [
              `${addr.street}${addr.number ? ", " + addr.number : ""}`,
              addr.neighborhood,
              addr.city && addr.state ? `${addr.city} - ${addr.state}` : addr.city || addr.state,
              addr.zip_code,
            ]
              .filter(Boolean)
              .join(", ")
          : "";
        setForm({
          storeName: data?.nome || "",
          email: data?.email || user.email || "",
          phone: data?.telefone || "",
          address: addrText,
          bio: data?.descricao_loja || "",
          newPassword: "",
        });
      } catch (err: any) {
        console.error("Load profile error:", err);
        toast.error("Erro ao carregar dados da loja");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nome: form.storeName,
          telefone: form.phone,
          descricao_loja: form.bio,
        })
        .eq("id", user.id);
      if (error) throw error;

      if (form.newPassword.trim().length > 0) {
        if (form.newPassword.length < 6) {
          toast.error("A senha precisa ter pelo menos 6 caracteres");
          setSaving(false);
          return;
        }
        const { error: pwErr } = await supabase.auth.updateUser({ password: form.newPassword });
        if (pwErr) throw pwErr;
        setForm((f) => ({ ...f, newPassword: "" }));
      }

      toast.success("Configurações salvas com sucesso!");
    } catch (err: any) {
      console.error("Save settings error:", err);
      toast.error("Erro ao salvar: " + (err.message || "tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-actions", {
        body: { action: "self_delete" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await supabase.auth.signOut();
      toast.success("Conta excluída com sucesso.");
      navigate("/");
    } catch (err: any) {
      console.error("Error deleting account:", err);
      toast.error("Erro ao excluir conta: " + (err.message || "Tente novamente"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Store className="h-6 w-6 text-primary" />
        <h1 className="text-2xl sm:text-3xl font-bold">Configurações da Loja</h1>
      </div>

      <Card className="p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Store className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Informações da loja</h3>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <Label>Nome da Loja</Label>
              <Input
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                placeholder="Nome da sua loja"
              />
            </div>

            <div>
              <Label>E-mail</Label>
              <Input value={form.email} disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground mt-1">
                Para alterar o e-mail entre em contato com o suporte.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Telefone / WhatsApp</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label>Endereço Comercial</Label>
                <Input value={form.address} disabled className="bg-muted/50" />
                <p className="text-xs text-muted-foreground mt-1">
                  Editável em "Editar Loja".
                </p>
              </div>
            </div>

            <div>
              <Label>Descrição da Loja</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Conte um pouco sobre sua loja"
                rows={3}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Security */}
      <Card className="p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Segurança</h3>
        </div>
        <div>
          <Label>Alterar Senha</Label>
          <Input
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            placeholder="Nova senha (mín. 6 caracteres)"
            autoComplete="new-password"
            data-1p-ignore
          />
          <p className="text-xs text-muted-foreground mt-1">
            Deixe em branco para manter a senha atual.
          </p>
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving || loading} className="w-full md:w-auto rounded-xl">
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Salvando..." : "Salvar alterações"}
      </Button>

      {/* Payment Methods */}
      <Card className="p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Métodos de Pagamento Aceitos</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Selecione quais formas de pagamento você aceita. Os clientes verão apenas estas opções ao
          negociar.
        </p>
        <div className="space-y-3">
          {ALL_PAYMENTS.map((m) => (
            <label key={m.value} className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={enabledPayments.includes(m.value)}
                onCheckedChange={(checked) =>
                  togglePayment.mutate({ method: m.value, enabled: !!checked })
                }
              />
              <span className="text-sm">{m.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Shipping Methods */}
      <Card className="p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Formas de Envio</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Selecione quais formas de envio você oferece aos seus clientes.
        </p>
        <div className="space-y-3">
          {ALL_SHIPPING.map((m) => (
            <label key={m.value} className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={enabledShipping.includes(m.value)}
                onCheckedChange={(checked) =>
                  toggleShipping.mutate({ method: m.value, enabled: !!checked })
                }
              />
              <span className="text-sm">{m.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Delete Account */}
      <Card className="p-6 rounded-2xl border-destructive/30">
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h3 className="font-semibold text-destructive">Excluir Conta</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Ao excluir sua conta, todos os seus dados, produtos, pedidos e informações serão
          permanentemente removidos. Esta ação não pode ser desfeita.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? "Excluindo..." : "Excluir minha conta"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. Todos os seus dados, produtos, pedidos, avaliações e
                informações da loja serão permanentemente excluídos.
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
