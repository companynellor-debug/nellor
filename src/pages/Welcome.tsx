import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import logo from '@/assets/nellor-logo.png';
import heroImage from '@/assets/nellor-3d-icon.png';
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

  if (loading || (isAuthenticated && profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(160deg, #11001e 0%, #2d0060 40%, #7c3aed 80%, #a78bfa 100%)',
        }}
      />

      {/* Subtle glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.7) 0%, transparent 65%)',
        }}
      />

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-between px-6 py-10 sm:py-14">
        {/* Top - Logo */}
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Nellor" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
          <span className="text-white text-xl sm:text-2xl font-bold tracking-tight">Nellor</span>
        </div>

        {/* Center - Hero image */}
        <div className="flex-1 flex items-center justify-center w-full max-w-xs sm:max-w-sm">
          <img
            src={heroImage}
            alt="Nellor"
            className="w-full max-w-[280px] sm:max-w-[340px] object-contain drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 20px 40px rgba(124,58,237,0.4))',
            }}
          />
        </div>

        {/* Bottom - Text + Buttons */}
        <div className="w-full max-w-xs sm:max-w-sm space-y-6">
          {/* Description */}
          <div className="text-center space-y-2">
            <h2 className="text-white text-2xl sm:text-3xl font-bold leading-tight">
              Marketplace{'\n'}atacadista digital
            </h2>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed">
              Conecte-se com fornecedores verificados, negocie preços e compre no atacado com segurança e praticidade.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/auth?modo=cadastro')}
              className="w-full h-12 bg-white hover:bg-white/90 text-[#11001e] font-semibold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Criar conta
            </Button>

            <Button
              onClick={() => navigate('/auth?modo=login')}
              variant="outline"
              className="w-full h-12 bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 font-medium text-base rounded-2xl backdrop-blur-sm transition-all duration-200"
            >
              Entrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
