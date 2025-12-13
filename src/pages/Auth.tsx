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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#7C3AED]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (isAuthenticated && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#7C3AED]">
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

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Purple top section with wave */}
      <div className="absolute top-0 left-0 right-0 h-[55%] bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9]">
        {/* Wave overlay (darker purple blob) */}
        <svg 
          className="absolute bottom-0 left-0 right-0 w-full"
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
          style={{ height: '180px' }}
        >
          <path 
            fill="#6D28D9"
            fillOpacity="0.6"
            d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,90.7C672,85,768,107,864,128C960,149,1056,171,1152,165.3C1248,160,1344,128,1392,112L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
        </svg>
        
        {/* Floating colored dots */}
        <div className="absolute top-[10%] left-[5%] w-2.5 h-2.5 rounded-full bg-white/30" />
        <div className="absolute top-[20%] right-[10%] w-2 h-2 rounded-full bg-orange-400" />
        <div className="absolute top-[35%] left-[8%] w-2 h-2 rounded-full bg-yellow-400" />
        <div className="absolute top-[15%] right-[25%] w-1.5 h-1.5 rounded-full bg-purple-300" />
      </div>
      
      {/* White bottom section */}
      <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-white">
        {/* Dots on white section */}
        <div className="absolute top-[15%] left-[6%] w-2 h-2 rounded-full bg-pink-400" />
        <div className="absolute top-[25%] right-[8%] w-2 h-2 rounded-full bg-blue-400" />
        <div className="absolute bottom-[25%] left-[12%] w-2.5 h-2.5 rounded-full bg-purple-300" />
        <div className="absolute bottom-[15%] right-[15%] w-2 h-2 rounded-full bg-orange-300" />
        <div className="absolute bottom-[30%] right-[30%] w-1.5 h-1.5 rounded-full bg-yellow-400" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-16 px-6">
        {/* Logo */}
        <div 
          className="w-20 h-20 bg-[#5B21B6] rounded-2xl flex items-center justify-center mb-4 cursor-pointer hover:scale-105 transition-transform shadow-lg"
          onClick={handleLogoClick}
        >
          <img 
            src={logo} 
            alt="Nellor" 
            className="w-12 h-12 object-contain"
          />
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-12">
          {isLogin ? 'welcome' : 'Sign Up'}
        </h1>

        {/* Form Card */}
        <div className="w-full max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                {/* First Name */}
                <div className="relative">
                  <span className="absolute -top-2.5 left-4 px-1 text-xs text-gray-500 bg-white">
                    First Name
                  </span>
                  <Input
                    type="text"
                    placeholder=""
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required={!isLogin}
                    className="h-12 bg-white border border-gray-200 text-gray-800 rounded-full px-5 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>

                {/* Last Name */}
                <div className="relative">
                  <span className="absolute -top-2.5 left-4 px-1 text-xs text-gray-500 bg-white">
                    Last Name
                  </span>
                  <Input
                    type="text"
                    placeholder=""
                    value={sobrenome}
                    onChange={(e) => setSobrenome(e.target.value)}
                    className="h-12 bg-white border border-gray-200 text-gray-800 rounded-full px-5 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div className="relative">
              <span className="absolute -top-2.5 left-4 px-1 text-xs text-gray-500 bg-white z-10">
                Email
              </span>
              <Input
                type="email"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-white border border-gray-200 text-gray-800 rounded-full px-5 focus:border-purple-400 focus:ring-purple-400"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <span className="absolute -top-2.5 left-4 px-1 text-xs text-gray-500 bg-white z-10">
                Password
              </span>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-white border border-gray-200 text-gray-800 rounded-full px-5 pr-16 focus:border-purple-400 focus:ring-purple-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-purple-500 hover:text-purple-700 text-xs uppercase font-semibold tracking-wide"
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>

            {/* Account Type (only for signup) */}
            {!isLogin && (
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTipo('cliente')}
                  className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                    tipo === 'cliente'
                      ? 'bg-[#6D28D9] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('fornecedor')}
                  className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                    tipo === 'fornecedor'
                      ? 'bg-[#6D28D9] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              className="w-full h-12 bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-semibold rounded-full mt-4 shadow-md"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? 'SIGN IN' : 'SIGN UP'
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="text-center mt-5">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-600 hover:text-purple-600 font-medium uppercase text-sm tracking-wide"
            >
              {isLogin ? 'SIGN UP' : 'SIGN IN'}
            </button>
          </div>

          {/* Back to home */}
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ← Voltar para home
            </button>
          </div>
        </div>
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
            <Input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminAccess()}
              placeholder="Senha"
              className="rounded-full"
            />
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
