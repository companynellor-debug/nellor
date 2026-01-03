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
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(153,0,248,0.5) 0%, transparent 70%)'
        }}
      />

      {/* Content - all in one view */}
      <div className="relative flex-1 flex flex-col items-center justify-between px-6 py-6">
        {/* Top section - Logo */}
        <div className="flex flex-col items-center">
          <img src={logo} alt="Nellor" className="w-20 h-20 object-contain mb-2 drop-shadow-lg" />
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Nellor
          </h1>
        </div>

        {/* Center section - Computer Preview */}
        {products.length > 0 && (
          <div className="w-full max-w-sm mx-auto flex-1 flex items-center justify-center py-4">
            {/* Computer Frame */}
            <div className="relative w-full">
              {/* Screen bezel */}
              <div className="bg-gray-800 rounded-t-2xl p-3 pt-4">
                {/* Camera dot */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-600 rounded-full" />
                
                {/* Screen */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden relative h-48">
                  {/* Fade overlay - top */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none"
                    style={{ background: 'linear-gradient(to bottom, rgba(17,24,39,1) 0%, transparent 100%)' }}
                  />
                  
                  {/* Fade overlay - bottom */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-8 z-10 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(17,24,39,1) 0%, transparent 100%)' }}
                  />

                  {/* Scrolling Products */}
                  <div className="animate-scroll-up">
                    <div className="grid grid-cols-3 gap-2 p-3">
                      {[...products, ...products].map((product, index) => (
                        <div 
                          key={`${product.id}-${index}`}
                          className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/5"
                        >
                          <div className="aspect-square rounded-md overflow-hidden mb-1.5 bg-white/5">
                            {product.imagens?.[0] ? (
                              <img 
                                src={product.imagens[0]} 
                                alt={product.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                                📦
                              </div>
                            )}
                          </div>
                          <p className="text-white/80 text-[9px] truncate">{product.nome}</p>
                          <p className="text-emerald-400/80 text-[8px]">
                            R$ {product.preco.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Keyboard base */}
              <div className="bg-gray-700 h-3 rounded-b-sm mx-6" />
              <div className="bg-gray-600 h-1.5 rounded-b-xl mx-12" />
            </div>
          </div>
        )}

        {/* Bottom section - Tagline and buttons */}
        <div className="w-full">
          <p className="text-center text-white/70 text-sm mb-4">
            Conectando você aos melhores fornecedores.
          </p>

          <div className="max-w-sm mx-auto space-y-3">
            <Button 
              onClick={() => navigate('/auth?modo=login')}
              className="w-full h-11 bg-white hover:bg-white/90 text-[#11001e] font-medium text-base rounded-xl shadow-sm transition-all duration-200"
            >
              Entrar
            </Button>
            
            <Button 
              onClick={() => navigate('/auth?modo=cadastro')}
              variant="outline"
              className="w-full h-11 bg-transparent border-2 border-white/50 text-white hover:bg-white/10 font-medium text-base rounded-xl transition-all duration-200"
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
