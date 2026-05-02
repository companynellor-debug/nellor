import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Mail,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  Users,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import logo from "@/assets/nellor-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    if (newCount === 5) {
      setShowAdminDialog(true);
      setLogoClicks(0);
    }
  };

  const handleAdminLogin = () => {
    if (!adminPassword) {
      toast.error("Digite a senha!");
      return;
    }
    if (adminPassword.trim() === "admin123") {
      sessionStorage.setItem("nellor_admin_access", "true");
      toast.success("Acesso admin autorizado!");
      navigate("/admin");
    } else {
      toast.error("Senha incorreta!");
      setAdminPassword("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      sessionStorage.setItem("nellor_just_signed_up", "1");
    }
    login(formData.email, formData.password, formData.name, "cliente");
    toast.success(isSignup ? "Conta criada com sucesso!" : "Login realizado com sucesso!");
    setTimeout(() => navigate("/cliente"), 500);
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
    <>
      <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
        {/* LEFT - Brand panel (hidden on mobile) */}
        <div
          className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #1a1340 0%, #2a1d6b 50%, #4621af 100%)",
          }}
        >
          <div className="relative z-10">
            <div onClick={handleLogoClick} className="cursor-pointer inline-flex items-center gap-3 select-none">
              <img src={logo} alt="Nelor" className="h-14 w-14 object-contain" draggable={false} />
            </div>

            <h1 className="mt-12 text-5xl font-extrabold leading-tight tracking-tight">
              Seu marketplace
              <br />
              <span className="text-white/80">de negociações</span>
            </h1>
            <p className="mt-5 text-base text-white/70 max-w-md leading-relaxed">
              Conecte-se com milhares de compradores, negocie no chat e feche os melhores
              negócios todos os dias.
            </p>

            <div className="mt-12 space-y-4 max-w-md">
              <Feature icon={Users} title="Mais de 2.000+ usuários ativos" sub="Compradores negociando todos os dias." />
              <Feature icon={MessageCircle} title="Negociação direta no chat" sub="Converse, negocie e feche negócio." />
              <Feature icon={TrendingUp} title="R$5M+ movimentados por mês" sub="Resultados reais para quem vende." />
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute top-20 right-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        </div>

        {/* RIGHT - Form panel */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-20 bg-background">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div onClick={handleLogoClick} className="cursor-pointer select-none">
              <img src={logo} alt="Nelor" className="h-16 w-16 object-contain" draggable={false} />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-center">Seu marketplace</h1>
            <p className="text-2xl font-extrabold text-primary text-center">de negociações</p>
          </div>

          <div className="max-w-md w-full mx-auto">
            <h2 className="hidden lg:block text-3xl font-bold text-foreground">
              {isSignup ? "Crie sua conta!" : "Bem-vindo de volta!"}
            </h2>
            <p className="hidden lg:block mt-1 text-sm text-muted-foreground">
              {isSignup ? "Cadastre-se para começar a negociar" : "Faça login para acessar sua conta"}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {isSignup && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Nome completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Seu nome"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="pl-10 h-12 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">E-mail ou usuário</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Digite seu e-mail ou usuário"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="pl-10 pr-10 h-12 rounded-xl"
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    data-1p-ignore
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isSignup && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setResetEmail(formData.email);
                      setResetSent(false);
                    }}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-semibold"
              >
                {isSignup ? "Criar conta" : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">ou continue como</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Link
              to="/login-fornecedor"
              className="mt-4 flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-border hover:bg-muted transition-colors"
            >
              <img src={logo} alt="" className="h-5 w-5 object-contain" />
              <span className="text-sm font-semibold text-foreground">Entrar como fornecedor</span>
            </Link>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isSignup ? "Já tem uma conta? " : "Ainda não tem uma conta? "}
              <button
                onClick={() => setIsSignup(!isSignup)}
                className="font-semibold text-primary hover:underline"
              >
                {isSignup ? "Entrar" : "Criar conta"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-primary">
              🔐 Acesso Administrativo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Digite a senha de acesso ao painel admin
            </p>
            <Input
              type="password"
              placeholder="Senha administrativa"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
              className="text-center"
            />
            <Button onClick={handleAdminLogin} className="w-full">
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
              <p className="text-sm text-muted-foreground">
                Verifique seu e-mail para redefinir sua senha.
              </p>
              <Button onClick={() => setShowForgotPassword(false)} className="w-full">
                Voltar ao Login
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Digite seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowForgotPassword(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleForgotPassword} disabled={resetLoading}>
                  {resetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar link de recuperação"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const Feature = ({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof Users;
  title: string;
  sub: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-white/60">{sub}</p>
    </div>
  </div>
);

export default Login;
