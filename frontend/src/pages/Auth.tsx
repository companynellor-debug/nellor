import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
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
import heroLogin from "@/assets/login-hero-bag.png";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modoParam = searchParams.get("modo");
  const nextParam = searchParams.get("next");

  const { user, signIn, signUp, isAuthenticated, profile, loading } = useSupabaseAuth();

  const [isSignup, setIsSignup] = useState(modoParam === "cadastro");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    password: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [logoClicks, setLogoClicks] = useState(0);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (nextParam) localStorage.setItem("nellor_post_auth_redirect", nextParam);
  }, [nextParam]);

  useEffect(() => {
    if (!loading && isAuthenticated && profile) {
      const next = localStorage.getItem("nellor_post_auth_redirect");
      if (next && profile.tipo === "cliente") {
        localStorage.removeItem("nellor_post_auth_redirect");
        navigate(next, { replace: true });
        return;
      }
      if (profile.tipo === "fornecedor" && !profile.onboarding_completed) {
        navigate("/fornecedor/onboarding", { replace: true });
      } else if (profile.tipo === "fornecedor") {
        navigate("/fornecedor/dashboard", { replace: true });
      } else if (profile.tipo === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/cliente", { replace: true });
      }
    }
  }, [isAuthenticated, profile, loading, navigate]);

  if (loading || (isAuthenticated && profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (newCount === 5) {
      setShowAdminDialog(true);
      setLogoClicks(0);
    }
    setTimeout(() => setLogoClicks(0), 2500);
  };

  const handleAdminAccess = async () => {
    if (!adminPassword) return toast.error("Digite a senha!");
    setSubmitting(true);
    try {
      // Real Supabase admin login (admin@nellor.app + the password)
      const { error } = await supabase.auth.signInWithPassword({
        email: "admin@nellor.app",
        password: adminPassword.trim(),
      });
      if (error) {
        toast.error("Senha incorreta!");
        setAdminPassword("");
        return;
      }
      // Also fetch admin Edge Function token (for admin-support-action and other privileged ops)
      try {
        const { data: edgeData } = await supabase.functions.invoke("admin-grant-role", {
          body: { password: adminPassword.trim() },
        });
        if (edgeData?.adminToken) {
          const { storeAdminAccess } = await import("@/lib/adminAccess");
          storeAdminAccess(edgeData.adminToken);
        }
      } catch (e) {
        console.warn("[admin] grant-role edge function unavailable", e);
      }
      sessionStorage.setItem("nellor_admin_access", "true");
      toast.success("Acesso admin liberado!");
      setShowAdminDialog(false);
      setAdminPassword("");
      navigate("/admin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) return toast.error("Digite seu e-mail");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignup && !formData.email) return toast.error("Digite seu e-mail");
    if (!formData.password) return toast.error("Digite sua senha");
    if (isSignup && !termsAccepted) return toast.error("Aceite os termos para continuar");

    setSubmitting(true);
    try {
      if (isSignup) {
        await signUp(formData.email, formData.password, {
          nome: `${formData.nome} ${formData.sobrenome}`.trim(),
          tipo: "cliente",
        });
        setIsSignup(false);
      } else {
        const { error, redirectTo } = await signIn(formData.email, formData.password);
        if (!error && redirectTo) navigate(redirectTo, { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
        {/* LEFT - Brand panel (desktop) - Big Tech Style */}
        <div
          className="hidden lg:flex flex-col justify-center items-center p-16 text-white relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
          data-testid="auth-brand-panel"
        >
          <div className="relative z-10 w-full max-w-lg">
            <div
              onClick={handleLogoClick}
              className="cursor-pointer select-none mb-16"
              data-testid="auth-logo-secret"
            >
              <img src={logo} alt="Nellor" className="h-12 w-12 object-contain mb-6" draggable={false} />
              <h1 className="text-5xl font-bold tracking-tight">
                Nellor
              </h1>
            </div>

            <div className="space-y-12">
              <div>
                <h2 className="text-3xl font-semibold mb-4 leading-tight">
                  Seu marketplace<br/>de negociações B2B
                </h2>
                <p className="text-lg text-white/80 leading-relaxed">
                  Conecte-se com milhares de compradores e fornecedores. 
                  Negocie diretamente e feche os melhores negócios.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-1 h-12 bg-white/30 rounded-full"></div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Fornecedores verificados</h3>
                    <p className="text-white/70">Catálogo curado com os melhores vendedores do mercado</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-1 h-12 bg-white/30 rounded-full"></div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Negociação em tempo real</h3>
                    <p className="text-white/70">Chat integrado para fechar negócios rapidamente</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-1 h-12 bg-white/30 rounded-full"></div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Cresça seu negócio</h3>
                    <p className="text-white/70">Ferramentas completas para alavancar suas vendas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT - Form panel - Big Tech Style */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-20 bg-background min-h-screen">
          {/* Mobile branding */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div onClick={handleLogoClick} className="cursor-pointer select-none" data-testid="auth-logo-secret-mobile">
              <img src={logo} alt="Nellor" className="h-16 w-16 object-contain" draggable={false} />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-center text-foreground">Nellor</h1>
            <p className="text-lg text-primary text-center">Marketplace B2B</p>
          </div>

          <div className="max-w-md w-full mx-auto">
            <div className="mb-10">
              <h2 className="text-4xl font-bold text-foreground mb-3" data-testid="auth-title">
                {isSignup ? "Criar conta" : "Entrar"}
              </h2>
              <p className="text-base text-muted-foreground">
                {isSignup ? "Comece a negociar hoje mesmo" : "Acesse sua conta"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {isSignup && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Nome</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Seu nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                        className="pl-10 h-12 rounded-xl"
                        data-testid="auth-input-nome"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Sobrenome</label>
                    <Input
                      type="text"
                      placeholder="Sobrenome"
                      value={formData.sobrenome}
                      onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                      className="h-12 rounded-xl"
                      data-testid="auth-input-sobrenome"
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
                    autoComplete={isSignup ? "email" : "username"}
                    className="pl-10 h-12 rounded-xl"
                    data-testid="auth-input-email"
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
                    minLength={6}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    className="pl-10 pr-10 h-12 rounded-xl"
                    data-testid="auth-input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="auth-toggle-password"
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
                    data-testid="auth-forgot-password"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}

              {isSignup && (
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    className="mt-0.5"
                    data-testid="auth-terms-checkbox"
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                    Li e concordo com os{" "}
                    <a href="/termos-de-uso" target="_blank" className="text-primary font-medium hover:underline">
                      Termos de Uso
                    </a>{" "}
                    da plataforma Nellor
                  </label>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-semibold"
                data-testid="auth-submit-btn"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSignup ? (
                  "Criar conta"
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isSignup ? "Já tem uma conta? " : "Ainda não tem uma conta? "}
              <button
                onClick={() => setIsSignup(!isSignup)}
                className="font-semibold text-primary hover:underline"
                data-testid="auth-toggle-mode"
              >
                {isSignup ? "Entrar" : "Criar conta"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-primary">
              Acesso Administrativo
            </DialogTitle>
            <DialogDescription className="text-center">
              Digite a senha de acesso ao painel admin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Senha administrativa"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdminAccess()}
              className="text-center"
              data-testid="auth-admin-password"
            />
            <Button onClick={handleAdminAccess} className="w-full" data-testid="auth-admin-submit">
              Acessar Painel Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Recuperar Senha
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
    <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 ring-1 ring-white/15">
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-white/60">{sub}</p>
    </div>
  </div>
);

export default Auth;
