import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { 
  Store, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Bell, 
  MessageSquare,
  Upload,
  Check,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

const Onboarding = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const { addProduct } = useSupplierProducts();
  const [currentStep, setCurrentStep] = useState(0);
  
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
      title: "Configure sua Loja",
      icon: Store,
      description: "Personalize a aparência da sua loja",
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="storeName">Nome da Loja *</Label>
            <Input
              id="storeName"
              placeholder="Ex: Minha Loja Incrível"
              value={storeData.storeName}
              onChange={(e) => setStoreData({ ...storeData, storeName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="bio">Descrição da Loja</Label>
            <Textarea
              id="bio"
              placeholder="Conte um pouco sobre sua loja..."
              value={storeData.bio}
              onChange={(e) => setStoreData({ ...storeData, bio: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="avatar">Logo da Loja (URL da imagem)</Label>
            <div className="flex gap-2">
              <Input
                id="avatar"
                placeholder="https://exemplo.com/logo.png"
                value={storeData.avatar}
                onChange={(e) => setStoreData({ ...storeData, avatar: e.target.value })}
              />
              <Button size="icon" variant="outline">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="banner">Banner da Loja (URL da imagem)</Label>
            <div className="flex gap-2">
              <Input
                id="banner"
                placeholder="https://exemplo.com/banner.png"
                value={storeData.banner}
                onChange={(e) => setStoreData({ ...storeData, banner: e.target.value })}
              />
              <Button size="icon" variant="outline">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Adicione seu Primeiro Produto",
      icon: Package,
      description: "Vamos começar adicionando um produto à sua loja",
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="productName">Nome do Produto *</Label>
            <Input
              id="productName"
              placeholder="Ex: Camiseta Premium"
              value={firstProduct.name}
              onChange={(e) => setFirstProduct({ ...firstProduct, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Input
              id="category"
              placeholder="Ex: Roupas"
              value={firstProduct.category}
              onChange={(e) => setFirstProduct({ ...firstProduct, category: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva seu produto..."
              value={firstProduct.description}
              onChange={(e) => setFirstProduct({ ...firstProduct, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={firstProduct.price}
                onChange={(e) => setFirstProduct({ ...firstProduct, price: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="stock">Estoque *</Label>
              <Input
                id="stock"
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
      title: "Tudo Pronto!",
      icon: Check,
      description: "Sua loja está configurada e pronta para começar",
      content: (
        <div className="space-y-6">
          <div className="bg-muted/50 p-6 rounded-lg text-center">
            <Check className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-bold mb-2">Configuração Concluída!</h3>
            <p className="text-muted-foreground">
              Sua loja está pronta para receber os primeiros clientes
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold">Próximos passos:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 text-green-600" />
                <span>Adicione mais produtos na aba "Produtos"</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 text-green-600" />
                <span>Configure suas informações de contato em "Editar Loja"</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 text-green-600" />
                <span>Acompanhe suas vendas no Dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-0.5 text-green-600" />
                <span>Responda rapidamente aos clientes no Chat</span>
              </li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const StepIcon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep === 1) {
      if (!storeData.storeName.trim()) {
        toast.error("Por favor, preencha o nome da loja");
        return;
      }
    }
    
    if (currentStep === 2) {
      if (!firstProduct.name.trim() || !firstProduct.category.trim() || 
          !firstProduct.price || !firstProduct.stock) {
        toast.error("Por favor, preencha todos os campos obrigatórios do produto");
        return;
      }
      
      addProduct({
        name: firstProduct.name,
        category: firstProduct.category,
        description: firstProduct.description,
        images: [],
        price: parseFloat(firstProduct.price),
        stock: parseInt(firstProduct.stock)
      });
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    completeOnboarding();
    toast.success("Configuração concluída! Bem-vindo à sua loja!");
    navigate("/fornecedor/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6 sm:p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <StepIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{currentStepData.title}</h1>
                <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
              </div>
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              {currentStep + 1}/{steps.length}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="mb-8">
          {currentStepData.content}
        </div>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} className="flex-1 gap-2">
              Próximo
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="flex-1 gap-2">
              <Check className="h-4 w-4" />
              Começar a Vender
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;
