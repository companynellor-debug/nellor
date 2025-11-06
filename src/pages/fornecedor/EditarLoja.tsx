import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, Upload, Star, Package, Plus, X, Tag } from "lucide-react";
import { toast } from "sonner";

const EditarLoja = () => {
  const { storeProfile, updateStoreProfile } = useStoreProfile();
  const { products } = useSupplierProducts();
  const [formData, setFormData] = useState({
    storeName: '',
    bio: '',
    avatar: '',
    banner: '',
    whatsapp: '',
    address: '',
    pixKey: '',
    minOrderQuantity: 0,
    minOrderValue: 0,
    customCategories: [] as string[],
  });
  const [newCategory, setNewCategory] = useState('');

  // Carregar dados do perfil da loja ao montar o componente
  useEffect(() => {
    setFormData({
      storeName: storeProfile.storeName || '',
      bio: storeProfile.bio || '',
      avatar: storeProfile.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=store1',
      banner: storeProfile.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
      whatsapp: storeProfile.whatsapp || '',
      address: storeProfile.address || '',
      pixKey: storeProfile.pixKey || '',
      minOrderQuantity: storeProfile.minOrderQuantity || 0,
      minOrderValue: storeProfile.minOrderValue || 0,
      customCategories: storeProfile.customCategories || [],
    });
  }, [storeProfile]);

  // Mock data - em produção viria de um hook/API
  const storeStats = {
    rating: 4.8,
    totalReviews: 1234,
    totalSales: 5678,
  };

  const reviews = [
    { name: "João Silva", date: "15/01/2024", rating: 5, comment: "Ótima loja, produtos de qualidade!" },
    { name: "Maria Santos", date: "10/01/2024", rating: 4, comment: "Muito bom, recomendo!" },
    { name: "Pedro Costa", date: "05/01/2024", rating: 5, comment: "Excelente atendimento" },
  ];

  const handleSave = () => {
    updateStoreProfile({
      storeName: formData.storeName,
      bio: formData.bio,
      avatar: formData.avatar,
      banner: formData.banner,
      whatsapp: formData.whatsapp,
      address: formData.address,
      pixKey: formData.pixKey,
      minOrderQuantity: formData.minOrderQuantity,
      minOrderValue: formData.minOrderValue,
      customCategories: formData.customCategories
    });
    toast.success("Informações da loja salvas com sucesso!");
  };

  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim();
    
    if (!trimmedCategory) {
      toast.error("Digite o nome da categoria");
      return;
    }

    if (formData.customCategories.includes(trimmedCategory)) {
      toast.error("Esta categoria já existe");
      return;
    }

    setFormData({
      ...formData,
      customCategories: [...formData.customCategories, trimmedCategory]
    });
    setNewCategory('');
    toast.success("Categoria adicionada!");
  };

  const handleRemoveCategory = (category: string) => {
    setFormData({
      ...formData,
      customCategories: formData.customCategories.filter(cat => cat !== category)
    });
    toast.success("Categoria removida!");
  };

  const handleImageUpload = (type: 'avatar' | 'banner') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFormData({ ...formData, [type]: event.target?.result as string });
        };
        reader.readAsDataURL(file);
        toast.success(`${type === 'avatar' ? 'Foto de perfil' : 'Banner'} atualizado!`);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Editar Loja</h1>
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </div>

      <Tabs defaultValue="personalizacao" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personalizacao">Personalização</TabsTrigger>
          <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
        </TabsList>

        <TabsContent value="personalizacao" className="space-y-6 mt-6">
          {/* Banner e Avatar */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Imagens da Loja</h2>
            
            <div className="space-y-6">
              {/* Banner */}
              <div>
                <Label className="mb-2 block">Banner da Loja</Label>
                <div className="relative h-32 sm:h-48 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                  <img src={formData.banner} alt="Banner" className="w-full h-full object-cover" />
                  <Button
                    onClick={() => handleImageUpload('banner')}
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Alterar Banner
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Recomendado: 1200x400px</p>
              </div>

              {/* Avatar */}
              <div>
                <Label className="mb-2 block">Foto de Perfil</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                    <AvatarImage src={formData.avatar} alt={formData.storeName} />
                    <AvatarFallback>{formData.storeName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button onClick={() => handleImageUpload('avatar')} variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Alterar Foto
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Recomendado: 400x400px</p>
              </div>
            </div>
          </Card>

          {/* Informações Básicas */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informações da Loja</h2>
            <div className="space-y-4">
              <div>
                <Label>Nome da Loja</Label>
                <Input
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="Nome da sua loja"
                />
              </div>

              <div>
                <Label>Descrição/Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Descreva sua loja"
                  rows={3}
                />
              </div>

              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <Label>Endereço Comercial</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Endereço completo"
                  rows={2}
                />
              </div>

              <div>
                <Label>Chave Pix</Label>
                <Input
                  value={formData.pixKey}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                  placeholder="CPF, CNPJ, Email ou Telefone"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3">Configurações de Pedido Mínimo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure limites mínimos para os pedidos dos seus clientes. Deixe em 0 (zero) se não houver limite.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Quantidade Mínima de Peças</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.minOrderQuantity}
                      onChange={(e) => setFormData({ ...formData, minOrderQuantity: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Mínimo de itens no carrinho
                    </p>
                  </div>
                  
                  <div>
                    <Label>Valor Mínimo do Pedido (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.minOrderValue}
                      onChange={(e) => setFormData({ ...formData, minOrderValue: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor total mínimo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Categorias Personalizadas */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Categorias Personalizadas</h2>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Adicione categorias específicas para seus produtos. Essas categorias aparecerão junto com as categorias padrão ao cadastrar produtos.
            </p>

            <div className="space-y-4">
              {/* Input para adicionar nova categoria */}
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Ex: Ferramentas, Esportes, Infantil..."
                  className="flex-1"
                />
                <Button onClick={handleAddCategory} type="button">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {/* Lista de categorias customizadas */}
              {formData.customCategories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.customCategories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="px-3 py-1.5 text-sm flex items-center gap-2"
                    >
                      {category}
                      <button
                        onClick={() => handleRemoveCategory(category)}
                        className="hover:text-destructive transition-colors"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma categoria personalizada adicionada ainda
                </p>
              )}

              {/* Info sobre categorias padrão */}
              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  <strong>Categorias Padrão do Sistema:</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Roupas", "Calçados", "Acessórios", "Eletrônicos", "Beleza", "Casa"].map((cat) => (
                    <Badge key={cat} variant="outline" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          {/* Preview da Loja (como aparece para clientes) */}
          <div className="space-y-6">
            {/* Banner Preview */}
            <div className="h-48 rounded-lg overflow-hidden border">
              <img src={formData.banner} alt={`Banner ${formData.storeName}`} className="w-full h-full object-cover" />
            </div>

            {/* Store Info Preview */}
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white shadow-md">
                  <AvatarImage src={formData.avatar} alt={formData.storeName} />
                  <AvatarFallback>{formData.storeName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">{formData.storeName}</h2>
                  <p className="text-sm text-muted-foreground mb-3">{formData.bio}</p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{storeStats.rating}</span>
                    </div>
                    <span className="text-muted-foreground">{storeStats.totalReviews} avaliações</span>
                    <span className="text-muted-foreground">{storeStats.totalSales.toLocaleString()} vendas</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Estatísticas */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Estatísticas</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{storeStats.rating}</p>
                  <p className="text-xs text-muted-foreground">Avaliação</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{storeStats.totalReviews}</p>
                  <p className="text-xs text-muted-foreground">Avaliações</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{storeStats.totalSales.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Vendas</p>
                </div>
              </div>
            </Card>

            {/* Avaliações Preview */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Avaliações Recentes</h3>
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <div key={index} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{review.name}</p>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Produtos Preview */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produtos da Loja
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {products.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum produto cadastrado ainda</p>
                    <p className="text-sm mt-1">Adicione produtos na aba "Produtos"</p>
                  </div>
                ) : (
                  products.map((product) => (
                    <Card
                      key={product.id}
                      className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="aspect-square overflow-hidden">
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <p className="text-sm mb-2 line-clamp-2">{product.name}</p>
                        <p className="text-primary font-bold text-sm">R$ {product.price.toFixed(2)}</p>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EditarLoja;
