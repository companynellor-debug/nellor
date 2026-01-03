import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import logo from '@/assets/nellor-logo.png';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  nome: string;
  preco: number;
  imagens: string[] | null;
}

const Welcome = () => {
  const { isAuthenticated, profile, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, nome, preco, imagens')
        .eq('ativo', true)
        .limit(8);
      
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
      </div>
    );
  }

  if (isAuthenticated && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient - dark purple to bright purple */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #11001e 0%, #9900f8 100%)'
        }}
      />
      
      {/* Subtle glow effect */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-40"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(153,0,248,0.6) 0%, transparent 60%)'
        }}
      />

      {/* Content - compact layout */}
      <div className="relative flex-1 flex flex-col items-center px-4 pt-4 sm:pt-6 pb-3 sm:px-5 sm:pb-6">
        {/* Top section - Logo */}
        <div className="flex flex-col items-center mt-4 sm:mt-6 mb-2 sm:mb-3">
          <img src={logo} alt="Nellor" className="w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-lg mt-6 sm:mt-8" />
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Nellor
          </h1>
        </div>

        {/* Center section - Computer Preview */}
        {products.length > 0 && (
          <div className="w-full max-w-sm sm:max-w-lg lg:max-w-2xl mx-auto flex-1 flex items-center justify-center min-h-0 py-3 sm:py-4">
            {/* Computer Frame */}
            <div className="relative w-full">
              {/* Screen bezel */}
              <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-t-xl sm:rounded-t-3xl p-1.5 sm:p-3 pt-2.5 sm:pt-4 shadow-2xl">
                {/* Camera dot */}
                <div className="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 w-1 sm:w-2 h-1 sm:h-2 bg-gray-500 rounded-full" />
                
                {/* Screen */}
                <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-lg sm:rounded-xl overflow-hidden relative h-[42vh] sm:h-[35vh] lg:h-[45vh] max-h-[300px] sm:max-h-[350px] lg:max-h-[420px]">
                  {/* Screen reflection */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                  
                  {/* Fade overlay - top */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-6 sm:h-10 z-10 pointer-events-none"
                    style={{ background: 'linear-gradient(to bottom, rgba(26,26,46,1) 0%, transparent 100%)' }}
                  />
                  
                  {/* Fade overlay - bottom */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-6 sm:h-10 z-10 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(22,33,62,1) 0%, transparent 100%)' }}
                  />

                  {/* Scrolling Products */}
                  <div className="animate-scroll-up">
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-3 p-2 sm:p-4">
                      {[...products, ...products, ...products].map((product, index) => (
                        <div 
                          key={`${product.id}-${index}`}
                          className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 border border-white/10"
                        >
                          <div className="aspect-square rounded-md sm:rounded-lg overflow-hidden mb-1 sm:mb-2 bg-white/5">
                            {product.imagens?.[0] ? (
                              <img 
                                src={product.imagens[0]} 
                                alt={product.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/30 text-xs sm:text-base">
                                📦
                              </div>
                            )}
                          </div>
                          <p className="text-white/90 text-[8px] sm:text-xs font-medium truncate">{product.nome}</p>
                          <p className="text-emerald-400 text-[7px] sm:text-[11px] font-medium">
                            R$ {product.preco.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Keyboard base */}
              <div className="bg-gradient-to-b from-gray-600 to-gray-700 h-1.5 sm:h-3 mx-3 sm:mx-8 lg:mx-16" />
              <div className="bg-gray-700 h-0.5 sm:h-1.5 rounded-b-lg mx-6 sm:mx-16 lg:mx-32 shadow-lg" />
            </div>
          </div>
        )}

        {/* Bottom section - Tagline and buttons (compact) */}
        <div className="w-full -mt-4 sm:-mt-6">
          <p className="text-center text-white/60 text-xs sm:text-sm mb-3 sm:mb-4">
            Conectando você aos melhores fornecedores.
          </p>

          <div className="max-w-xs sm:max-w-sm mx-auto space-y-2.5">
            <Button 
              onClick={() => navigate('/auth?modo=login')}
              className="w-full h-10 sm:h-11 bg-white hover:bg-white/90 text-[#11001e] font-semibold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Entrar
            </Button>
            
            <Button 
              onClick={() => navigate('/auth?modo=cadastro')}
              variant="outline"
              className="w-full h-10 sm:h-11 bg-white/5 border-2 border-white/40 text-white hover:bg-white/15 hover:border-white/60 font-medium text-sm sm:text-base rounded-xl transition-all duration-200"
            >
              Criar conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
