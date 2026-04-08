import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import logo from '@/assets/nellor-logo.png';
import heroImage from '@/assets/hero-v4.png';
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
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Background gradient - full bleed */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(160deg, #11001e 0%, #2d0060 40%, #7c3aed 80%, #a78bfa 100%)',
        }}
      />

      {/* Content - edge to edge, safe area aware */}
      <div className="relative flex-1 flex flex-col items-center justify-between pt-10 pb-8"
        style={{ paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)', paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)' }}>
        
        {/* Top - Logo */}
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Nellor" className="w-10 h-10 object-contain" />
          <span className="text-white text-xl font-bold tracking-tight">Nellor</span>
        </div>

        {/* Center - Hero image, flush to edges */}
        <div className="flex-1 flex items-center justify-center w-full overflow-hidden my-4">
          <div className="relative w-[85vw] max-w-[380px]">
            <img
              src={heroImage}
              alt="Nellor"
              className="w-full object-contain"
              style={{
                filter: 'drop-shadow(0 20px 50px rgba(124,58,237,0.45))',
              }}
            />
            {/* Gradient fade at the bottom to blend reflection with background */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none"
              style={{
                background: 'linear-gradient(to top, #2d0060 0%, rgba(45,0,96,0.85) 30%, rgba(45,0,96,0.4) 60%, transparent 100%)',
              }}
            />
          </div>
        </div>

        {/* Bottom - Text + Buttons */}
        <div className="w-full px-6 space-y-5">
          <div className="text-center space-y-2">
            <h2 className="text-white text-[1.65rem] font-bold leading-tight">
              Marketplace atacadista digital
            </h2>
            <p className="text-white/65 text-sm leading-relaxed">
              Conecte-se com fornecedores verificados, negocie preços e compre no atacado com segurança e praticidade.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/auth?modo=cadastro')}
              className="w-full h-12 bg-white hover:bg-white/90 text-[#11001e] font-semibold text-base rounded-2xl shadow-lg transition-all duration-200"
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
