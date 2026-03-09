import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Store, Package, CheckCircle2, Upload, Camera, Loader2, DollarSign, TrendingUp, Bell, MessageSquare, Sparkles } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logo from "@/assets/logo.png";

// Floating dots decoration
const FloatingDots = () => <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[10%] left-[5%] w-3 h-3 bg-yellow-400 rounded-full opacity-80 animate-pulse" />
    <div className="absolute top-[15%] right-[10%] w-4 h-4 bg-pink-400 rounded-full opacity-70 animate-pulse" style={{
    animationDelay: '0.5s'
  }} />
    <div className="absolute top-[25%] left-[15%] w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse" style={{
    animationDelay: '1s'
  }} />
    <div className="absolute bottom-[30%] right-[8%] w-3 h-3 bg-green-400 rounded-full opacity-70 animate-pulse" style={{
    animationDelay: '0.3s'
  }} />
    <div className="absolute bottom-[20%] left-[10%] w-2 h-2 bg-purple-300 rounded-full opacity-80 animate-pulse" style={{
    animationDelay: '0.7s'
  }} />
    <div className="absolute top-[40%] right-[5%] w-2 h-2 bg-orange-400 rounded-full opacity-60 animate-pulse" style={{
    animationDelay: '1.2s'
  }} />
  </div>;

// Wave background
const WaveBackground = () => <div className="absolute top-0 left-0 right-0 h-[45%] overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-violet-500 to-purple-700" />
    <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none" style={{
    height: '80px'
  }}>
      <defs>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path fill="white" d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,75 1440,60 L1440,120 L0,120 Z" />
    </svg>
  </div>;
const Onboarding = () => {
  const navigate = useNavigate();
  const {
    completeOnboarding,
    profile,
    user
  } = useSupabaseAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [storeData, setStoreData] = useState({
    storeName: "",
    bio: "",
    avatar: "",
    banner: ""
  });
  const [firstProduct, setFirstProduct] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    stock: ""
  });

  // Carregar categorias do Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      const {
        data,
        error
      } = await supabase.from('categories').select('*').order('nome');
      if (error) {
        console.error('Erro ao carregar categorias:', error);
        return;
      }
      setCategories(data || []);
    };
    fetchCategories();
  }, []);
  const steps = [{
    title: "Bem-vindo à Plataforma!",
    icon: Sparkles,
    description: "Vamos configurar sua loja em alguns passos simples",
    content: <div className="space-y-4">
          {[{
        icon: Package,
        title: "Produtos",
        desc: "Adicione e gerencie seus produtos facilmente",
        color: "bg-purple-500"
      }, {
        icon: DollarSign,
        title: "Financeiro",
        desc: "Acompanhe suas vendas e receitas",
        color: "bg-green-500"
      }, {
        icon: TrendingUp,
        title: "Dashboard",
        desc: "Visualize suas métricas em tempo real",
        color: "bg-blue-500"
      }, {
        icon: Bell,
        title: "Notificações",
        desc: "Receba alertas sobre novos pedidos",
        color: "bg-orange-500"
      }, {
        icon: MessageSquare,
        title: "Chat",
        desc: "Converse diretamente com seus clientes",
        color: "bg-pink-500"
      }].map((item, idx) => <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`p-3 ${item.color} rounded-xl`}>
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </div>)}
        </div>
  }, {
    title: "Configure sua loja",
    icon: Store,
    description: "Adicione informações sobre sua loja",
    content: <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-2">Nome da loja</label>
            <Input placeholder="Ex: Loja do João" value={storeData.storeName} onChange={e => setStoreData({
          ...storeData,
          storeName: e.target.value
        })} className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-2">Bio da loja</label>
            <Textarea placeholder="Conte um pouco sobre sua loja..." value={storeData.bio} onChange={e => setStoreData({
          ...storeData,
          bio: e.target.value
        })} rows={3} className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500" />
          </div>
          
          {/* Upload de Banner */}
          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-2">Banner da Loja</label>
            <div className="relative h-28 rounded-xl overflow-hidden border-2 border-dashed border-purple-200 hover:border-purple-400 transition-colors bg-purple-50/50">
              {storeData.banner ? <img src={storeData.banner} alt="Banner" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center justify-center h-full">
                  <Upload className="h-8 w-8 text-purple-400" />
                  <span className="text-xs text-purple-400 mt-1">Clique para enviar</span>
                </div>}
              <input type="file" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = event => {
                setStoreData({
                  ...storeData,
                  banner: event.target?.result as string
                });
              };
              reader.readAsDataURL(file);
            }
          }} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Recomendado: 1200x400px</p>
          </div>

          {/* Upload de Avatar */}
          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-2">Foto de Perfil</label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-dashed border-purple-200 hover:border-purple-400 transition-colors bg-purple-50/50">
                {storeData.avatar ? <img src={storeData.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full">
                    <Camera className="h-6 w-6 text-purple-400" />
                  </div>}
                <input type="file" accept="image/*" onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = event => {
                  setStoreData({
                    ...storeData,
                    avatar: event.target?.result as string
                  });
                };
                reader.readAsDataURL(file);
              }
            }} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <p className="text-xs text-gray-400">Recomendado: 400x400px</p>
            </div>
          </div>
        </div>
  }, {
    title: "Cadastre seu primeiro produto",
    icon: Package,
    description: "Adicione seu primeiro produto à plataforma",
    content: <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-2">Nome do produto</label>
            <Input placeholder="Ex: Camiseta Básica" value={firstProduct.name} onChange={e => setFirstProduct({
          ...firstProduct,
          name: e.target.value
        })} className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-2">Categoria</label>
            <Select value={firstProduct.category} onValueChange={value => setFirstProduct({
          ...firstProduct,
          category: value
        })}>
              <SelectTrigger className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-2">Descrição</label>
            <Textarea placeholder="Descreva seu produto..." value={firstProduct.description} onChange={e => setFirstProduct({
          ...firstProduct,
          description: e.target.value
        })} rows={3} className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-purple-700 mb-2">Preço (R$)</label>
              <Input type="number" step="0.01" placeholder="0.00" value={firstProduct.price} onChange={e => setFirstProduct({
            ...firstProduct,
            price: e.target.value
          })} className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-purple-700 mb-2">Estoque</label>
              <Input type="number" placeholder="0" value={firstProduct.stock} onChange={e => setFirstProduct({
            ...firstProduct,
            stock: e.target.value
          })} className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500" />
            </div>
          </div>
        </div>
  }, {
    title: "Tudo pronto!",
    icon: CheckCircle2,
    description: "Sua loja está configurada e pronta para vender",
    content: <div className="text-center space-y-6 py-4">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">Parabéns! 🎉</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Sua loja foi configurada com sucesso. Agora você pode começar a gerenciar seus produtos e vendas!
            </p>
          </div>
        </div>
  }];
  const handleNext = () => {
    if (currentStep === 1) {
      if (!storeData.storeName.trim()) {
        toast.error("Por favor, preencha o nome da loja");
        return;
      }
    }
    if (currentStep === 2) {
      if (!firstProduct.name.trim() || !firstProduct.category || !firstProduct.price || !firstProduct.stock) {
        toast.error("Por favor, preencha todos os campos do produto");
        return;
      }
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleFinish = async () => {
    setLoading(true);
    try {
      // Generate store slug from store name
      const generateSlug = (name: string) => {
        return name
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      };
      const baseSlug = generateSlug(storeData.storeName);
      const slug = baseSlug + '-' + (user?.id?.substring(0, 4) || '');

      // Atualizar perfil do fornecedor
      const {
        error: profileError
      } = await supabase.from('profiles').update({
        nome: storeData.storeName,
        descricao_loja: storeData.bio,
        foto_perfil_url: storeData.avatar,
        banner_loja_url: storeData.banner,
        store_slug: slug,
        onboarding_completed: true
      }).eq('id', user?.id);
      if (profileError) {
        throw profileError;
      }

      // Criar primeiro produto
      const {
        error: productError
      } = await supabase.from('products').insert({
        nome: firstProduct.name,
        categoria_id: firstProduct.category,
        descricao_longa: firstProduct.description,
        preco: parseFloat(firstProduct.price),
        estoque: parseInt(firstProduct.stock),
        supplier_id: user?.id,
        ativo: true
      });
      if (productError) {
        throw productError;
      }

      // Completar onboarding
      await completeOnboarding();
      toast.success("Onboarding concluído com sucesso!");
      navigate("/fornecedor/dashboard");
    } catch (error: any) {
      console.error('Erro no onboarding:', error);
      toast.error("Erro ao concluir onboarding: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  const CurrentStepIcon = steps[currentStep].icon;
  const progress = (currentStep + 1) / steps.length * 100;
  return <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Main container with phone-like appearance for desktop */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden" style={{
      minHeight: '700px'
    }}>
        {/* Background elements */}
        <WaveBackground />
        <FloatingDots />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full" style={{
        minHeight: '700px'
      }}>
          {/* Header with logo */}
          <div className="pt-8 pb-16 flex flex-col items-center">
            <div className="p-4 backdrop-blur-sm rounded-2xl shadow-lg bg-primary-foreground">
              <img src={logo} alt="Nellor" className="h-12 w-auto" />
            </div>
          </div>

          {/* White content area */}
          <div className="flex-1 bg-white rounded-t-3xl px-6 py-6 flex flex-col">
            {/* Title and description */}
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-500 text-sm">
                {steps[currentStep].description}
              </p>
            </div>

            {/* Progress */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Passo {currentStep + 1} de {steps.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-gray-100" />
            </div>

            {/* Step content - scrollable */}
            <div className="flex-1 overflow-y-auto mb-4 pr-1" style={{
            maxHeight: '320px'
          }}>
              {steps[currentStep].content}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || loading} className="flex-1 rounded-full border-gray-200 text-gray-600 hover:bg-gray-50">
                Voltar
              </Button>
              <Button onClick={handleNext} disabled={loading} className="flex-1 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg shadow-purple-200">
                {loading ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finalizando...
                  </> : currentStep === steps.length - 1 ? "Concluir" : "Próximo"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Onboarding;