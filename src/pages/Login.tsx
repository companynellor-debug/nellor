import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, CheckCircle } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [logoClicks, setLogoClicks] = useState(0);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (newCount === 5) { setShowAdminDialog(true); setLogoClicks(0); }
  };

  const handleAdminLogin = () => {
    if (!adminPassword) { toast.error("Digite a senha!"); return; }
    if (adminPassword.trim() === 'admin123') {
      sessionStorage.setItem('nellor_admin_access', 'true');
      toast.success("Acesso admin autorizado!");
      navigate("/admin");
    } else {
      toast.error("Senha incorreta!");
      setAdminPassword("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(formData.email, formData.password, formData.name, 'cliente');
    toast.success(isSignup ? "Conta criada com sucesso!" : "Login realizado com sucesso!");
    setTimeout(() => navigate("/cliente"), 500);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) { toast.error("Digite seu e-mail"); return; }
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
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
        <Card className="w-full max-w-md p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div onClick={handleLogoClick} className="cursor-pointer">
              <h1 className="text-3xl font-heading font-bold text-primary mb-2">nellor</h1>
            </div>
            <p className="text-muted-foreground">{isSignup ? "Crie sua conta de cliente" : "Entre na sua conta"}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium mb-2">Nome completo</label>
                <Input type="text" placeholder="Seu nome" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">E-mail</label>
              <Input type="email" placeholder="seu@email.com" value={formData.email}
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

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              {isSignup ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsSignup(!isSignup)} className="text-sm text-primary hover:underline">
              {isSignup ? "Já tem uma conta? Entrar" : "Não tem conta? Criar conta"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t text-center">
            <Link to="/login-fornecedor" className="text-sm text-muted-foreground hover:text-primary">Entrar como fornecedor →</Link>
          </div>
        </Card>
      </div>

      {/* Admin Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              🔐 Acesso Administrativo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">Digite a senha de acesso ao painel admin</p>
            <Input type="password" placeholder="Senha administrativa" value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()} className="text-center" />
            <Button onClick={handleAdminLogin}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700">
              Acessar Painel Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
};

export default Login;
