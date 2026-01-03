import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import logo from '@/assets/logo.png';
import { Loader2 } from 'lucide-react';
const Welcome = () => {
  const {
    isAuthenticated,
    profile,
    loading
  } = useSupabaseAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && isAuthenticated && profile) {
      if (profile.tipo === 'fornecedor' && !profile.onboarding_completed) {
        navigate('/fornecedor/onboarding', {
          replace: true
        });
      } else if (profile.tipo === 'fornecedor') {
        navigate('/fornecedor/dashboard', {
          replace: true
        });
      } else if (profile.tipo === 'admin') {
        navigate('/admin', {
          replace: true
        });
      } else {
        navigate('/cliente', {
          replace: true
        });
      }
    }
  }, [isAuthenticated, profile, loading, navigate]);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
      </div>;
  }
  if (isAuthenticated && profile) {
    return <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
      </div>;
  }
  return <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient - blue/purple at top fading to white at bottom */}
      <div className="absolute inset-0" style={{
      background: 'linear-gradient(180deg, #4F6AF5 0%, #6366F1 30%, #818CF8 50%, #C7D2FE 70%, #EEF2FF 85%, #FFFFFF 100%)'
    }} />
      
      {/* Subtle glow effect at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] opacity-40" style={{
      background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, transparent 70%)'
    }} />

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo area - centered in upper portion */}
        <div className="flex flex-col items-center mb-auto mt-[18vh]">
          {/* Logo - large, no background */}
          <img alt="Nellor" className="w-40 h-40 object-contain mb-6 drop-shadow-lg" src="/lovable-uploads/24eae625-b3ee-4ef7-97e1-1cb80ad22261.png" />
          
          {/* Platform name */}
          <h1 className="text-4xl font-semibold text-white tracking-tight">
            Nellor
          </h1>
        </div>
      </div>

      {/* Bottom section with tagline and buttons */}
      <div className="relative px-6 pb-12 pt-8">
        {/* Tagline */}
        <p className="text-center text-gray-600 text-base mb-8">
          Conectando você aos melhores fornecedores.
        </p>

        {/* Buttons */}
        <div className="max-w-sm mx-auto space-y-3">
          <Button onClick={() => navigate('/auth?modo=login')} className="w-full h-12 bg-[#4F6AF5] hover:bg-[#4338CA] text-white font-medium text-base rounded-xl shadow-sm transition-all duration-200">
            Entrar
          </Button>
          
          <Button onClick={() => navigate('/auth?modo=cadastro')} variant="outline" className="w-full h-12 bg-transparent border-2 border-[#4F6AF5] text-[#4F6AF5] hover:bg-[#4F6AF5]/5 font-medium text-base rounded-xl transition-all duration-200">
            Criar conta
          </Button>
        </div>
      </div>
    </div>;
};
export default Welcome;