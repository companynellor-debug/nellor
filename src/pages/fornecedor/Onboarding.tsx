import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Store, 
  Package, 
  CheckCircle2, 
  Upload, 
  Camera,
  Loader2,
  DollarSign,
  TrendingUp,
  Bell,
  MessageSquare
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Onboarding = () => {
  const navigate = useNavigate();
  const { completeOnboarding, profile, user } = useSupabaseAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [storeData, setStoreData] = useState({
    storeName: profile?.nome || "",
    bio: profile?.descricao_loja || "",
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
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('nome');
      
      if (error) {
        console.error('Erro ao carregar categorias:', error);
        return;
      }
      
      setCategories(data || []);
    };

    fetchCategories();
  }, []);

  const steps = [
    {
      title: "Bem-vindo à Plataforma!",
      icon: Store,
      description: "Vamos configurar sua loja em alguns passos simples",
      content: (
        <div className="space-y-6">
          <div className="bg-muted/50 p-6 rounded-lg space-y-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 mt-1 text-primary" />
              <div>
                <h3 className="font-semibold mb-1">Produtos</h3>
                <p className="text-sm text-muted-foreground">Adicione e gerencie seus produtos facilmente</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 mt-1 text-primary" />
              <div>
                <h3 className="font-semibold mb-1">Financeiro</h3>
                <p className="text-sm text-muted-foreground">Acompanhe suas vendas e receitas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 mt-1 text-primary" />
              <div>
                <h3 className="font-semibold mb-1">Dashboard</h3>
                <p className="text-sm text-muted-foreground">Visualize suas métricas em tempo real</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 mt-1 text-primary" />
              <div>
                <h3 className="font-semibold mb-1">Notificações</h3>
                <p className="text-sm text-muted-foreground">Receba alertas sobre novos pedidos</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 mt-1 text-primary" />
              <div>
                <h3 className="font-semibold mb-1">Chat</h3>
                <p className="text-sm text-muted-foreground">Converse diretamente com seus clientes</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Configure sua loja",
      icon: Store,
      description: "Adicione informações sobre sua loja",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome da loja</label>
            <Input
              placeholder="Ex: Loja do João"
              value={storeData.storeName}
              onChange={(e) => setStoreData({ ...storeData, storeName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Bio da loja</label>
            <Textarea
              placeholder="Conte um pouco sobre sua loja..."
              value={storeData.bio}
              onChange={(e) => setStoreData({ ...storeData, bio: e.target.value })}
              rows={4}
            />
          </div>
        </div>
      )
    },
    {
      title: "Cadastre seu primeiro produto",
      icon: Package,
      description: "Adicione seu primeiro produto à plataforma",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome do produto</label>
            <Input
              placeholder="Ex: Camiseta Básica"
              value={firstProduct.name}
              onChange={(e) => setFirstProduct({ ...firstProduct, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Categoria</label>
            <Select value={firstProduct.category} onValueChange={(value) => setFirstProduct({ ...firstProduct, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <Textarea
              placeholder="Descreva seu produto..."
              value={firstProduct.description}
              onChange={(e) => setFirstProduct({ ...firstProduct, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Preço (R$)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={firstProduct.price}
                onChange={(e) => setFirstProduct({ ...firstProduct, price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estoque</label>
              <Input
                type="number"
                placeholder="0"
                value={firstProduct.stock}
                onChange={(e) => setFirstProduct({ ...firstProduct, stock: e.target.value })}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Tudo pronto!",
      icon: CheckCircle2,
      description: "Sua loja está configurada e pronta para vender",
      content: (
        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Parabéns!</h3>
            <p className="text-muted-foreground">
              Sua loja foi configurada com sucesso. Agora você pode começar a gerenciar seus produtos e vendas!
            </p>
          </div>
        </div>
      )
    }
  ];

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
      // Atualizar perfil do fornecedor
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome: storeData.storeName,
          descricao_loja: storeData.bio,
          onboarding_completed: true
        })
        .eq('id', user?.id);

      if (profileError) {
        throw profileError;
      }

      // Criar primeiro produto
      const { error: productError } = await supabase
        .from('products')
        .insert({
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
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <CurrentStepIcon className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              {steps[currentStep].description}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Passo {currentStep + 1} de {steps.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          <div className="mb-8">
            {steps[currentStep].content}
          </div>

          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
              className="flex-1"
            >
              Voltar
            </Button>
            <Button
              onClick={handleNext}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizando...
                </>
              ) : currentStep === steps.length - 1 ? (
                "Concluir"
              ) : (
                "Próximo"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
