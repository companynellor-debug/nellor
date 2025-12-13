import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [tipo, setTipo] = useState<'cliente' | 'fornecedor'>('cliente');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  
  const { signIn, signUp, isAuthenticated, profile, loading } = useSupabaseAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && profile) {
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

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(280,100%,25%)] via-[hsl(280,88%,36%)] to-[hsl(280,100%,40%)]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(280,100%,25%)] via-[hsl(280,88%,36%)] to-[hsl(280,100%,40%)]">
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
    if (adminPassword === "admin123") {
      setShowAdminDialog(false);
      setAdminPassword("");
      navigate("/admin");
    } else {
      alert("Senha incorreta!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, {
          nome: `${nome} ${sobrenome}`.trim(),
          tipo: tipo
        });
        setEmail(email);
        setIsLogin(true);
      }
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setSubmitting(false);
    }
  };

  // Floating dots component
  const FloatingDots = () => (
    <>
      {/* Colored dots */}
      <div className="absolute top-[15%] left-[8%] w-3 h-3 rounded-full bg-purple-300 animate-pulse" />
      <div className="absolute top-[25%] right-[12%] w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-[40%] left-[5%] w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[60%] right-[8%] w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
      <div className="absolute top-[75%] left-[10%] w-2 h-2 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0.7s' }} />
      <div className="absolute top-[85%] right-[15%] w-3 h-3 rounded-full bg-purple-200 animate-bounce" style={{ animationDelay: '1.2s' }} />
      <div className="absolute bottom-[20%] left-[20%] w-2 h-2 rounded-full bg-orange-300 animate-pulse" style={{ animationDelay: '0.4s' }} />
      <div className="absolute bottom-[35%] right-[25%] w-2.5 h-2.5 rounded-full bg-yellow-300 animate-bounce" style={{ animationDelay: '0.8s' }} />
    </>
  );

  // Wave SVG component
  const WaveBackground = () => (
    <div className="absolute top-0 left-0 right-0 overflow-hidden">
      <svg 
        viewBox="0 0 1440 320" 
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(280, 88%, 45%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(280, 100%, 50%)" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path 
          fill="url(#waveGradient)"
          d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,176C1248,149,1344,107,1392,85.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
        />
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[hsl(280,100%,25%)] via-[hsl(280,88%,36%)] to-[hsl(280,100%,40%)]">
      {/* Wave background */}
      <WaveBackground />
      
      {/* Floating dots */}
      <FloatingDots />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div 
            className="w-20 h-20 mx-auto mb-4 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
            onClick={handleLogoClick}
          >
            <img 
              src={logo} 
              alt="Nellor" 
              className="w-14 h-14 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isLogin ? 'Bem-vindo' : 'Criar Conta'}
          </h1>
        </div>

        {/* Form */}
        <div className="w-full max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* First Name */}
                <div className="relative">
                  <label className="text-white/60 text-xs absolute -top-2 left-4 bg-transparent px-1">
                    Nome
                  </label>
                  <Input
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required={!isLogin}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full px-5 focus:border-white/50 focus:ring-0"
                  />
                </div>

                {/* Last Name */}
                <div className="relative">
                  <label className="text-white/60 text-xs absolute -top-2 left-4 bg-transparent px-1">
                    Sobrenome
                  </label>
                  <Input
                    type="text"
                    placeholder="Seu sobrenome"
                    value={sobrenome}
                    onChange={(e) => setSobrenome(e.target.value)}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full px-5 focus:border-white/50 focus:ring-0"
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div className="relative">
              <label className="text-white/60 text-xs absolute -top-2 left-4 bg-transparent px-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full px-5 focus:border-white/50 focus:ring-0"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="text-white/60 text-xs absolute -top-2 left-4 bg-transparent px-1">
                Senha
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full px-5 pr-16 focus:border-white/50 focus:ring-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-xs uppercase font-medium"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Account Type Selection (only for signup) */}
            {!isLogin && (
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setTipo('cliente')}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                    tipo === 'cliente'
                      ? 'bg-white text-primary'
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  }`}
                >
                  Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('fornecedor')}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                    tipo === 'fornecedor'
                      ? 'bg-white text-primary'
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  }`}
                >
                  Fornecedor
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-[hsl(280,88%,30%)] hover:bg-[hsl(280,88%,25%)] text-white font-semibold rounded-full mt-6 shadow-lg"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? 'ENTRAR' : 'CRIAR CONTA'
              )}
            </Button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-white/80 hover:text-white font-medium uppercase text-sm tracking-wide transition-colors"
            >
              {isLogin ? 'CRIAR CONTA' : 'ENTRAR'}
            </button>
          </div>

          {/* Back to home */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-white/50 hover:text-white/80 text-sm transition-colors"
            >
              ← Voltar para home
            </button>
          </div>
        </div>
      </div>

      {/* Admin Access Dialog */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="bg-[hsl(280,88%,30%)] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Acesso Admin</DialogTitle>
            <DialogDescription className="text-white/60">
              Digite a senha de administrador para acessar o painel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminAccess()}
              placeholder="Digite a senha"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
            <Button 
              onClick={handleAdminAccess} 
              className="w-full bg-white text-primary hover:bg-white/90"
            >
              Acessar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
