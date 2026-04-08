import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { syncAttributionsOnLogin } from '@/hooks/useAffiliateTracking';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(18)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-white/20"
        style={{
          width: `${4 + Math.random() * 8}px`,
          height: `${4 + Math.random() * 8}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `floatParticle ${6 + Math.random() * 8}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 5}s`,
        }}
      />
    ))}
  </div>
);

const Auth = () => {
  const [searchParams] = useSearchParams();
  const modoParam = searchParams.get('modo');
  const [isLogin, setIsLogin] = useState(modoParam !== 'cadastro');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [tipo] = useState<'cliente' | 'fornecedor'>('cliente');
  const [submitting, setSubmitting] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const {
    user,
    signIn,
    signUp,
    isAuthenticated,
    profile,
    loading,
  } = useSupabaseAuth();
  const navigate = useNavigate();

  const serviceProviderId = searchParams.get('provider') ?? searchParams.get('sp');
  const nextParam = searchParams.get('next');

  useEffect(() => {
    if (nextParam) {
      localStorage.setItem('nellor_post_auth_redirect', nextParam);
    }
    if (serviceProviderId) {
      localStorage.setItem('nellor_service_provider_ref', serviceProviderId);
      setIsLogin(false);
    }
  }, [serviceProviderId, nextParam, searchParams]);

  useEffect(() => {
    if (!loading && isAuthenticated && profile) {
      void syncAttributionsOnLogin(profile.id);

      const storedSp = localStorage.getItem('nellor_service_provider_ref');
      if (storedSp && profile.tipo === 'fornecedor') {
        void acceptServiceProviderInvite(profile.id, storedSp).finally(() => {
          localStorage.removeItem('nellor_service_provider_ref');
        });
      }

      const next = localStorage.getItem('nellor_post_auth_redirect');
      if (next && profile.tipo === 'cliente') {
        localStorage.removeItem('nellor_post_auth_redirect');
        navigate(next, { replace: true });
        return;
      }

      if (profile.tipo === 'fornecedor' && !profile.onboarding_completed) {
        navigate('/fornecedor/onboarding', { replace: true });
      } else if (profile.tipo === 'fornecedor') {
        navigate('/fornecedor/dashboard', { replace: true });
      } else if (profile.tipo === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/cliente', { replace: true });
      }
    }
  }, [isAuthenticated, profile, loading, navigate]);

  const acceptServiceProviderInvite = async (supplierId: string, spId: string) => {
    try {
      const { error } = await supabase.rpc('accept_service_provider_invite', {
        _service_provider_id: spId,
        _supplier_id: supplierId,
      });
      if (error) console.error('Error accepting service provider invite:', error);
    } catch (error) {
      console.error('Error in acceptServiceProviderInvite:', error);
    }
  };

  if (loading || (isAuthenticated && profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(263,70%,10%)] via-[hsl(263,84%,30%)] to-[hsl(263,84%,42%)]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const handleLogoClick = () => {
    setLogoClickCount(prev => {
      const newCount = prev + 1;
      if (newCount === 5) {
        setShowAdminDialog(true);
        return 0;
      }
      return newCount;
    });
    setTimeout(() => setLogoClickCount(0), 2000);
  };

  const handleAdminAccess = () => {
    if (!adminPassword) {
      toast.error('Digite a senha de administrador.');
      return;
    }
    if (adminPassword.trim() === 'admin123') {
      sessionStorage.setItem('nellor_admin_access', 'true');
      toast.success('Acesso admin liberado!');
      setShowAdminDialog(false);
      setAdminPassword('');
      if (user) {
        import('@/hooks/useActivityLog').then(({ logActivity }) => {
          logActivity(user.id, 'admin_access', 'Acesso ao painel admin via senha');
        });
      }
      navigate('/admin');
    } else {
      toast.error('Senha incorreta!');
      setAdminPassword('');
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      toast.error('Digite seu e-mail');
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
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error, redirectTo } = await signIn(email, password);
        if (!error && redirectTo) {
          navigate(redirectTo, { replace: true });
        }
      } else {
        await signUp(email, password, {
          nome: `${nome} ${sobrenome}`.trim(),
          tipo
        });
        setEmail(email);
        setIsLogin(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(263,70%,10%)] via-[hsl(263,84%,30%)] to-[hsl(263,84%,42%)] px-4 relative overflow-hidden">
      {/* Animated floating particles */}
      <FloatingParticles />

      {/* Glassmorphism card */}
      <div className="relative w-full max-w-[420px] rounded-[2.5rem] overflow-hidden shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5)] animate-scale-in">
        {/* Top purple area with logo */}
        <div className="relative bg-gradient-to-br from-[hsl(263,84%,42%)] to-[hsl(271,81%,56%)] px-8 pt-10 pb-8 flex flex-col items-center">
          <FloatingParticles />
          <div
            onClick={handleLogoClick}
            className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mb-4 cursor-pointer hover:scale-105 transition-transform shadow-lg"
          >
            <img src={logo} alt="Nellor" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isLogin ? 'Bem-vindo' : 'Criar conta'}
          </h1>
          <p className="text-white/60 text-sm mt-1 mb-4">
            {isLogin ? 'Entre na sua conta Nellor' : 'Crie sua conta gratuitamente'}
          </p>
          <p className="text-white/80 text-xs text-center leading-relaxed max-w-[280px] mb-3">
            O marketplace atacadista que conecta você aos melhores fornecedores
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Fornecedores Verificados", "Negociação Direta", "Atacado Seguro", "Sem Intermediários"].map((tag) => (
              <span key={tag} className="text-[10px] font-medium text-white/90 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Glass form area */}
        <div className="backdrop-blur-xl bg-white/80 px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="relative">
                  <span className="absolute -top-2.5 left-4 px-1.5 text-xs text-muted-foreground bg-white/90 rounded z-10">
                    Nome
                  </span>
                  <Input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    required={!isLogin}
                    className="h-12 bg-white/60 border border-border/50 text-foreground rounded-2xl px-5 focus:border-primary focus:ring-primary backdrop-blur-sm"
                  />
                </div>
                <div className="relative">
                  <span className="absolute -top-2.5 left-4 px-1.5 text-xs text-muted-foreground bg-white/90 rounded z-10">
                    Sobrenome
                  </span>
                  <Input
                    type="text"
                    value={sobrenome}
                    onChange={e => setSobrenome(e.target.value)}
                    className="h-12 bg-white/60 border border-border/50 text-foreground rounded-2xl px-5 focus:border-primary focus:ring-primary backdrop-blur-sm"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <span className="absolute -top-2.5 left-4 px-1.5 text-xs text-muted-foreground bg-white/90 rounded z-10">
                Email
              </span>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-12 bg-white/60 border border-border/50 text-foreground rounded-2xl px-5 focus:border-primary focus:ring-primary backdrop-blur-sm"
              />
            </div>

            <div className="relative">
              <span className="absolute -top-2.5 left-4 px-1.5 text-xs text-muted-foreground bg-white/90 rounded z-10">
                Senha
              </span>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-white/60 border border-border/50 text-foreground rounded-2xl px-5 focus:border-primary focus:ring-primary backdrop-blur-sm"
              />
            </div>

            {isLogin && (
              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setResetEmail(email); setResetSent(false); }}
                  className="text-xs text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {!isLogin && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  Li e concordo com os{' '}
                  <a href="/termos-de-uso" target="_blank" className="text-primary font-medium hover:underline">
                    Termos de Uso
                  </a>{' '}
                  da plataforma Nellor
                </label>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || (!isLogin && !termsAccepted)}
              className="w-full h-12 bg-[hsl(263,70%,35%)] hover:bg-[hsl(263,70%,28%)] text-white font-semibold rounded-2xl mt-2 shadow-lg text-base tracking-wide"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? 'ENTRAR' : 'CRIAR CONTA'}
            </Button>
          </form>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:text-primary/80 font-semibold uppercase text-sm tracking-wide transition-colors"
            >
              {isLogin ? 'CRIAR CONTA' : 'ENTRAR'}
            </button>
          </div>

          <div className="text-center mt-3 pb-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              ← Voltar
            </button>
          </div>
        </div>
      </div>

      {/* Admin Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Acesso Admin</DialogTitle>
            <DialogDescription>Digite a senha de administrador.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAdminAccess()} placeholder="Senha" className="rounded-full" />
            <Button onClick={handleAdminAccess} className="w-full bg-[hsl(263,84%,42%)] hover:bg-[hsl(263,70%,35%)] rounded-full">Acessar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Recuperar Senha
            </DialogTitle>
          </DialogHeader>
          {resetSent ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold text-foreground">E-mail enviado!</h3>
              <p className="text-sm text-muted-foreground">Verifique sua caixa de entrada para redefinir sua senha.</p>
              <Button onClick={() => setShowForgotPassword(false)} className="w-full bg-[hsl(263,70%,35%)] hover:bg-[hsl(263,70%,28%)] rounded-full">Voltar ao Login</Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Digite seu e-mail e enviaremos um link para redefinir sua senha.</p>
                <Input type="email" placeholder="seu@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()} className="rounded-full" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowForgotPassword(false)} className="rounded-full">Cancelar</Button>
                <Button onClick={handleForgotPassword} disabled={resetLoading} className="bg-[hsl(263,70%,35%)] hover:bg-[hsl(263,70%,28%)] rounded-full">
                  {resetLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : 'Enviar link'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Particle animation keyframes */}
      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.5; }
          50% { transform: translateY(-10px) translateX(-10px); opacity: 0.3; }
          75% { transform: translateY(-30px) translateX(5px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default Auth;
