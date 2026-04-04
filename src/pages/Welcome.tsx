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
  const {
    isAuthenticated,
    profile,
    loading
  } = useSupabaseAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const fallbackProducts: Product[] = [{
    id: 'fallback-1',
    nome: 'Produto',
    preco: 59.9,
    imagens: null
  }, {
    id: 'fallback-2',
    nome: 'Oferta',
    preco: 49.0,
    imagens: null
  }, {
    id: 'fallback-3',
    nome: 'Novidade',
    preco: 99.9,
    imagens: null
  }, {
    id: 'fallback-4',
    nome: 'Mais vendido',
    preco: 37.9,
    imagens: null
  }, {
    id: 'fallback-5',
    nome: 'Seleção',
    preco: 48.0,
    imagens: null
  }, {
    id: 'fallback-6',
    nome: 'Destaque',
    preco: 5.9,
    imagens: null
  }];
  const previewProducts = products.length > 0 ? products : fallbackProducts;
  useEffect(() => {
    const fetchProducts = async () => {
      const {
        data
      } = await supabase.from('products').select('id, nome, preco, imagens').eq('ativo', true).limit(8);
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);
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
  return <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient - dark purple to bright purple */}
      <div className="absolute inset-0" style={{
      background: 'linear-gradient(180deg, #11001e 0%, #9900f8 100%)'
    }} />
      
      {/* Subtle glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-40" style={{
      background: 'radial-gradient(ellipse at center, rgba(153,0,248,0.6) 0%, transparent 60%)'
    }} />

      {/* Content - compact layout */}
      <div className="relative flex-1 flex flex-col items-center px-4 pt-1 pb-3 gap-0 sm:px-5 sm:pb-6 sm:pt-6 justify-between my-4 sm:my-6 lg:my-8">
        {/* Top section - Logo */}
        <div className="flex flex-col items-center mt-0 sm:mt-6 mb-0 sm:mb-3">
          <img src={logo} alt="Nellor" className="w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-lg" />
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Nellor
          </h1>
        </div>

        {/* Center section - Computer Preview */}
        <div className="w-full max-w-sm sm:max-w-lg lg:max-w-2xl mx-auto flex flex-1 items-center justify-center min-h-0 py-1 sm:py-4 -mt-2 sm:mt-0">
          {/* Laptop Frame */}
          <div className="relative w-full">
            {/* Screen lid */}
            <div className="relative bg-gradient-to-b from-[#2a2a2a] via-[#1f1f1f] to-[#1a1a1a] rounded-t-2xl sm:rounded-t-3xl p-2 sm:p-4 shadow-2xl border border-[#3a3a3a]/50">
              {/* Inner bezel */}
              <div className="bg-gradient-to-b from-[#0d0d0d] to-[#1a1a1a] rounded-lg sm:rounded-xl p-1 sm:p-1.5 border border-[#333]/60">
                {/* Camera notch */}
                <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  <div className="w-1.5 sm:w-2.5 h-1.5 sm:h-2.5 bg-[#1a1a1a] rounded-full border border-[#333] flex items-center justify-center">
                    <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-[#222] rounded-full" />
                  </div>
                </div>

                {/* Screen */}
                <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-md sm:rounded-lg overflow-hidden relative h-[44vh] sm:h-[35vh] lg:h-[45vh] max-h-[320px] sm:max-h-[350px] lg:max-h-[420px]">
                  {/* Static screen reflection */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                  
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                    <div className="absolute -inset-full animate-screen-shine" style={{
                      background: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 55%, transparent 60%)',
                      transform: 'translateX(-100%)',
                    }} />
                  </div>

                  {/* Fade overlay - top */}
                  <div className="absolute top-0 left-0 right-0 h-6 sm:h-10 z-10 pointer-events-none" style={{
                    background: 'linear-gradient(to bottom, rgba(26,26,46,1) 0%, transparent 100%)'
                  }} />

                  {/* Fade overlay - bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-6 sm:h-10 z-10 pointer-events-none" style={{
                    background: 'linear-gradient(to top, rgba(22,33,62,1) 0%, transparent 100%)'
                  }} />

                  {/* Scrolling Products */}
                  <div className="animate-scroll-up">
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-3 p-2 sm:p-4">
                      {[...previewProducts, ...previewProducts, ...previewProducts].map((product, index) => <div key={`${product.id}-${index}`} className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 border border-white/10">
                            <div className="aspect-square rounded-md sm:rounded-lg overflow-hidden mb-1 sm:mb-2 bg-white/5">
                              {product.imagens?.[0] ? <img src={product.imagens[0]} alt={product.nome} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-white/30 text-xs sm:text-base">
                                  📦
                                </div>}
                            </div>
                            <p className="text-white/90 text-[8px] sm:text-xs font-medium truncate">
                              {product.nome}
                            </p>
                            <p className="text-emerald-400 text-[7px] sm:text-[11px] font-medium">
                              R$ {product.preco.toFixed(2).replace('.', ',')}
                            </p>
                          </div>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hinge */}
            <div className="relative h-2 sm:h-3 mx-4 sm:mx-10 lg:mx-20 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-b-sm shadow-inner" />
            
            {/* Keyboard base */}
            <div className="relative mx-2 sm:mx-6 lg:mx-12">
              <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] h-3 sm:h-5 rounded-b-xl shadow-lg border-x border-b border-[#3a3a3a]/30">
                {/* Trackpad hint */}
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-12 sm:w-20 h-0.5 sm:h-1 bg-[#333]/50 rounded-full" />
              </div>
            </div>
            
            {/* Diffuse shadow below laptop */}
            <div className="absolute -bottom-4 sm:-bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-4 sm:h-8 blur-xl sm:blur-2xl opacity-60" style={{
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)'
            }} />
          </div>
        </div>

        {/* Bottom section - Tagline and buttons (compact) */}
        <div className="w-full mt-0 sm:-mt-6">

          <div className="max-w-xs sm:max-w-sm mx-auto space-y-2.5">
            <Button onClick={() => navigate('/auth?modo=login')} className="w-full h-10 sm:h-11 bg-white hover:bg-white/90 text-[#11001e] font-semibold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              Entrar
            </Button>
            
            <Button onClick={() => navigate('/auth?modo=cadastro')} variant="outline" className="w-full h-10 sm:h-11 bg-white/5 border-2 border-white/40 text-white hover:bg-white/15 hover:border-white/60 font-medium text-sm sm:text-base rounded-xl transition-all duration-200">
              Criar conta
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default Welcome;