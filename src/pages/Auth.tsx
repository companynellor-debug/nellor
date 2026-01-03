import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { Loader2 } from 'lucide-react';
import { syncAttributionsOnLogin } from '@/hooks/useAffiliateTracking';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const modoParam = searchParams.get('modo');
  const [isLogin, setIsLogin] = useState(modoParam !== 'cadastro');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [tipo, setTipo] = useState<'cliente' | 'fornecedor'>('cliente');
  const [submitting, setSubmitting] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const {
    signIn,
    signUp,
    isAuthenticated,
    profile,
    loading,
  } = useSupabaseAuth();
  const navigate = useNavigate();
  
  // Service provider referral + post-auth redirect
  const serviceProviderId = searchParams.get('provider') ?? searchParams.get('sp');
  const nextParam = searchParams.get('next');

  useEffect(() => {
    if (nextParam) {
      localStorage.setItem('nellor_post_auth_redirect', nextParam);
    }
    if (serviceProviderId) {
      localStorage.setItem('nellor_service_provider_ref', serviceProviderId);
      setTipo('fornecedor');
      setIsLogin(false);
    }
    const tipoParam = searchParams.get('tipo');
    if (tipoParam === 'fornecedor') {
      setTipo('fornecedor');
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

      if (error) {
        console.error('Error accepting service provider invite:', error);
      }
    } catch (error) {
      console.error('Error in acceptServiceProviderInvite:', error);
    }
  };

  if (loading || (isAuthenticated && profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9]">
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

  const handleAdminAccess = async () => {
    try {
      if (!adminPassword) {
        toast.error('Digite a senha de administrador.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-grant-role', {
        body: { password: adminPassword },
      });

      if (error || !data?.ok) {
        toast.error('Senha incorreta ou acesso negado.');
        return;
      }

      toast.success('Acesso admin liberado!');
      setShowAdminDialog(false);
      setAdminPassword('');
      navigate('/admin');
    } catch (e: any) {
      console.error('Admin access error:', e);
      toast.error('Erro ao validar acesso admin.');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] px-4 bg-secondary">
      <div className="relative w-full max-w-sm h-[640px] rounded-[36px] overflow-hidden shadow-2xl bg-white">
        {/* Top purple wave area */}
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9]">
          <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ height: '120px' }}>
            <path fill="#7C3AED" fillOpacity="0.8" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,176C1248,149,1344,107,1392,85.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" />
          </svg>

          {/* Confetti dots */}
          <div className="absolute top-[18%] left-[10%] w-2.5 h-2.5 rounded-full bg-white/40" />
          <div className="absolute top-[25%] right-[12%] w-2 h-2 rounded-full bg-yellow-300" />
          <div className="absolute top-[35%] left-[20%] w-2 h-2 rounded-full bg-pink-400" />
          <div className="absolute top-[12%] right-[28%] w-1.5 h-1.5 rounded-full bg-blue-300" />

          {/* Logo + title */}
          <div className="relative flex flex-col items-center justify-center pt-10">
            <div onClick={handleLogoClick} className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 cursor-pointer hover:scale-105 transition-transform shadow-md bg-primary-foreground">
              <img src={logo} alt="Nellor" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isLogin ? 'Bem-vindo' : 'Criar conta'}
            </h1>
          </div>
        </div>

        {/* Bottom white form area */}
        <div className="absolute inset-x-0 bottom-0 top-[35%] bg-white pt-8 px-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="relative">
                  <span className="absolute -top-2.5 left-4 px-1 text-xs text-gray-500 bg-white">
                    Nome
                  </span>
                  <Input type="text" value={nome} onChange={e => setNome(e.target.value)} required={!isLogin} className="h-11 bg-white border border-gray-200 text-gray-800 rounded-full px-5 focus:border-purple-400 focus:ring-purple-400" />
                </div>

                <div className="relative">
                  <span className="absolute -top-2.5 left-4 px-1 text-xs text-gray-500 bg-white">
                    Sobrenome
                  </span>
                  <Input type="text" value={sobrenome} onChange={e => setSobrenome(e.target.value)} className="h-11 bg-white border border-gray-200 text-gray-800 rounded-full px-5 focus:border-purple-400 focus:ring-purple-400" />
                </div>
              </>
            )}

            <div className="relative">
              <span className="absolute -top-2.5 left-4 px-1 text-xs text-gray-500 bg-white z-10">
                Email
              </span>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-11 bg-white border border-gray-200 text-gray-800 rounded-full px-5 focus:border-purple-400 focus:ring-purple-400" />
            </div>

            <div className="relative">
              <span className="absolute -top-2.5 left-4 px-1 text-xs text-gray-500 bg-white z-10">
                Senha
              </span>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="h-11 bg-white border border-gray-200 text-gray-800 rounded-full px-5 focus:border-purple-400 focus:ring-purple-400" />
            </div>

            {/* Account Type (only for signup - only Cliente and Fornecedor) */}
            {!isLogin && (
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setTipo('cliente')} className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${tipo === 'cliente' ? 'bg-[#6D28D9] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  Cliente
                </button>
                <button type="button" onClick={() => setTipo('fornecedor')} className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${tipo === 'fornecedor' ? 'bg-[#6D28D9] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  Fornecedor
                </button>
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full h-11 bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-semibold rounded-full mt-4 shadow-md">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? 'ENTRAR' : 'CRIAR CONTA'}
            </Button>
          </form>

          {/* Toggle login/signup */}
          <div className="text-center mt-5">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-gray-600 hover:text-purple-600 font-medium uppercase text-sm tracking-wide">
              {isLogin ? 'CRIAR CONTA' : 'ENTRAR'}
            </button>
          </div>

          {/* Back to welcome */}
          <div className="text-center mt-3">
            <button type="button" onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 text-sm">
              ← Voltar
            </button>
          </div>
        </div>

        {/* Extra confetti on very bottom */}
        <div className="absolute bottom-6 left-6 w-2 h-2 rounded-full bg-purple-300" />
        <div className="absolute bottom-10 right-8 w-2 h-2 rounded-full bg-yellow-300" />
        <div className="absolute bottom-4 right-1/2 w-1.5 h-1.5 rounded-full bg-pink-400" />
      </div>

      {/* Admin Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Acesso Admin</DialogTitle>
            <DialogDescription>
              Digite a senha de administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAdminAccess()} placeholder="Senha" className="rounded-full" />
            <Button onClick={handleAdminAccess} className="w-full bg-[#6D28D9] hover:bg-[#5B21B6] rounded-full">
              Acessar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
