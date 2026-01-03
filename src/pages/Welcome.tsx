import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import logo from '@/assets/logo.png';
import { Loader2 } from 'lucide-react';

const Welcome = () => {
  const { isAuthenticated, profile, loading } = useSupabaseAuth();
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (isAuthenticated && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] px-4">
      {/* Confetti dots decorativos */}
      <div className="fixed top-[10%] left-[8%] w-3 h-3 rounded-full bg-white/30 animate-pulse" />
      <div className="fixed top-[15%] right-[12%] w-2.5 h-2.5 rounded-full bg-yellow-300/80" />
      <div className="fixed top-[25%] left-[15%] w-2 h-2 rounded-full bg-pink-400/70" />
      <div className="fixed bottom-[20%] right-[10%] w-3 h-3 rounded-full bg-white/25" />
      <div className="fixed bottom-[30%] left-[5%] w-2 h-2 rounded-full bg-blue-300/60" />
      <div className="fixed top-[40%] right-[5%] w-2 h-2 rounded-full bg-pink-300/50" />

      <div className="w-full max-w-sm text-center space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-28 h-28 rounded-3xl bg-white/95 flex items-center justify-center shadow-2xl">
            <img src={logo} alt="Nellor" className="w-16 h-16 object-contain" />
          </div>
          
          {/* Nome da plataforma */}
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Nellor
          </h1>
          
          {/* Frase curta e neutra */}
          <p className="text-white/90 text-lg">
            Sua plataforma de compras simplificada
          </p>
        </div>

        {/* Botões */}
        <div className="space-y-4 pt-8">
          <Button 
            onClick={() => navigate('/auth?modo=login')}
            className="w-full h-14 bg-white text-[#7C3AED] hover:bg-white/90 font-semibold text-lg rounded-full shadow-lg"
          >
            Entrar
          </Button>
          
          <Button 
            onClick={() => navigate('/auth?modo=cadastro')}
            variant="outline"
            className="w-full h-14 bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold text-lg rounded-full"
          >
            Criar conta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
