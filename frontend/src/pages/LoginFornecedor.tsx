import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, CheckCircle } from "lucide-react";

const LoginFornecedor = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useSupabaseAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    cnpj: "",
    whatsapp: "",
    address: "",
    pixKey: "",
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await signUp(formData.email, formData.password, {
          nome: formData.companyName,
          tipo: 'fornecedor',
          document: formData.cnpj,
          telefone: formData.whatsapp,
          pix_key: formData.pixKey,
          endereco_principal: { address: formData.address }
        });
        if (error) { toast.error(error.message); setLoading(false); return; }
        toast.success("Conta criada com sucesso! Redirecionando para onboarding...");
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) { toast.error("Erro ao fazer login: " + error.message); setLoading(false); return; }
        toast.success("Login realizado com sucesso!");
      }
    } catch (error: any) {
      toast.error("Erro: " + error.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      toast.error("Digite seu e-mail");
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (error: any) {
      toast.error("Erro ao enviar: " + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent via-secondary to-primary p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link to="/"><h1 className="text-3xl font-heading font-bold text-primary mb-2">nellor</h1></Link>
          <p className="text-muted-foreground">{isSignup ? "Cadastre sua empresa" : "Área do Fornecedor"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Nome da empresa</label>
                <Input type="text" placeholder="Sua empresa" value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CNPJ</label>
                <Input type="text" placeholder="00.000.000/0000-00" value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp</label>
                <Input type="text" placeholder="(00) 00000-0000" value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Endereço</label>
                <Input type="text" placeholder="Rua, número, bairro, cidade - UF" value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Chave PIX para receber pagamentos</label>
                <Input type="text" placeholder="CPF, CNPJ, Email ou Telefone" value={formData.pixKey}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })} required />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">E-mail corporativo</label>
            <Input type="email" placeholder="empresa@email.com" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Senha</label>
            <Input type="password" placeholder="••••••••" value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
          </div>

          {!isSignup && (
            <div className="text-right">
              <button type="button" onClick={() => { setShowForgotPassword(true); setResetEmail(formData.email); setResetSent(false); }}
                className="text-sm text-primary hover:underline">
                Esqueci minha senha
              </button>
            </div>
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSignup ? "Cadastrando..." : "Entrando..."}</> : isSignup ? "Cadastrar empresa" : "Entrar como fornecedor"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsSignup(!isSignup)} className="text-sm text-primary hover:underline">
            {isSignup ? "Já é fornecedor? Entrar" : "Primeira vez? Cadastrar empresa"}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t text-center">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">Entrar como cliente →</Link>
        </div>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Recuperar Senha
            </DialogTitle>
          </DialogHeader>
          {resetSent ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold">E-mail enviado!</h3>
              <p className="text-sm text-muted-foreground">Verifique seu e-mail para redefinir sua senha.</p>
              <Button onClick={() => setShowForgotPassword(false)} className="w-full">Voltar ao Login</Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Digite seu e-mail e enviaremos um link para redefinir sua senha.</p>
                <Input type="email" placeholder="seu@email.com" value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowForgotPassword(false)}>Cancelar</Button>
                <Button onClick={handleForgotPassword} disabled={resetLoading}>
                  {resetLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : "Enviar link de recuperação"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginFornecedor;
