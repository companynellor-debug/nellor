import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import logo from '@/assets/nellor-logo-3d.png';
import heroImage from '@/assets/hero-welcome.png';

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

      {/* Content - safe area aware with proper bottom padding */}
      <div className="relative flex-1 flex flex-col items-center justify-between pt-10 px-6"
        style={{
          paddingLeft: 'max(env(safe-area-inset-left), 1.5rem)',
          paddingRight: 'max(env(safe-area-inset-right), 1.5rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2.5rem)',
        }}>
        
        {/* Top - Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img src={logo} alt="Nellor" className="w-10 h-10 object-contain" />
          <span className="text-white text-xl font-bold tracking-tight">Nellor</span>
        </div>

        {/* Center - Hero image */}
        <div className="flex-1 flex items-center justify-center w-full overflow-hidden my-4 min-h-0">
          <img
            src={heroImage}
            alt="Nellor"
            className="w-[75vw] max-w-[340px] max-h-[40vh] object-contain"
            style={{
              filter: 'drop-shadow(0 20px 50px rgba(124,58,237,0.45))',
            }}
          />
        </div>

        {/* Bottom - Text + Buttons */}
        <div className="w-full max-w-md space-y-5 shrink-0">
          <div className="text-center space-y-2">
            <h2 className="text-white text-[1.65rem] font-bold leading-tight pb-2">
              Marketplace atacadista digital
            </h2>
            <p className="text-white/65 text-sm leading-relaxed">
              Conecte-se com fornecedores verificados, negocie preços e compre no atacado com segurança e praticidade.
            </p>
          </div>

          <div className="space-y-3 pb-2">
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
