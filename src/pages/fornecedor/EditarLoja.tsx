import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useStoreProfile } from "@/hooks/useStoreProfile";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { useSupplierCategories } from "@/hooks/useSupplierCategories";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseReviews } from "@/hooks/useSupabaseReviews";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, Upload, Star, Package, Plus, X, Tag, Copy, ExternalLink } from "lucide-react";
import { CurrencyInput, decimalToCents, centsToDecimal } from "@/utils/currency";
import { toast } from "sonner";
import { ShippingConfigTab } from "@/components/fornecedor/ShippingConfigTab";


const EditarLoja = () => {
  const { user } = useSupabaseAuth();
  const { storeProfile, updateStoreProfile } = useStoreProfile();
  const { products } = useSupplierProducts();
  const { categories: customCategories, addCategory, deleteCategory } = useSupplierCategories(user?.id);
  const { reviews: allReviews } = useSupabaseReviews();
  
  const [formData, setFormData] = useState({
    storeName: '',
    bio: '',
    avatar: '',
    banner: '',
    whatsapp: '',
    address: '',
    minOrderQuantity: 0,
    minOrderValueCents: 0,
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
      minOrderQuantity: storeProfile.minOrderQuantity || 0,
      minOrderValueCents: decimalToCents(storeProfile.minOrderValue || 0),
      customCategories: storeProfile.customCategories || [],
    });
  }, [storeProfile]);

  // Link público da loja
  const storeLink = user?.id ? `${window.location.origin}/loja/${user.id}` : '';

  const handleCopyLink = () => {
    if (storeLink) {
      navigator.clipboard.writeText(storeLink);
      toast.success("Link copiado!");
    }
  };

  const handleShareWhatsApp = () => {
    if (storeLink) {
      window.open(`https://wa.me/?text=${encodeURIComponent(`Confira minha loja: ${storeLink}`)}`, '_blank');
    }
  };

  // Estatísticas reais da loja
  const storeProductIds = useMemo(() => products.map(p => p.id), [products]);
  const storeReviews = useMemo(
    () => allReviews.filter(r => storeProductIds.includes(r.product_id)),
    [allReviews, storeProductIds]
  );
  const storeStats = useMemo(() => {
    const totalReviews = storeReviews.length;
    const rating = totalReviews > 0
      ? storeReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
    const totalSales = products.reduce((sum, p) => sum + ((p as any).vendas_count || 0), 0);
    return { rating, totalReviews, totalSales };
  }, [storeReviews, products]);

  const reviews = storeReviews.slice(0, 5);

  const handleSave = () => {
    updateStoreProfile({
      storeName: formData.storeName,
      bio: formData.bio,
      avatar: formData.avatar,
      banner: formData.banner,
      whatsapp: formData.whatsapp,
      address: formData.address,
      minOrderQuantity: formData.minOrderQuantity,
      minOrderValue: centsToDecimal(formData.minOrderValueCents),
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

    if (customCategories.some(c => c.nome.toLowerCase() === trimmedCategory.toLowerCase())) {
      toast.error("Esta categoria já existe");
      return;
    }

    addCategory(trimmedCategory);
    setNewCategory('');
  };

  const handleRemoveCategory = (categoryId: string) => {
    deleteCategory(categoryId);
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personalizacao">Personalização</TabsTrigger>
          <TabsTrigger value="frete">Configurar Frete</TabsTrigger>
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
                    <Label>Valor Mínimo do Pedido</Label>
                    <CurrencyInput
                      value={formData.minOrderValueCents}
                      onChange={(cents) => setFormData({ ...formData, minOrderValueCents: cents })}
                      placeholder="R$ 0,00"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor total mínimo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Link da Loja */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Link da Sua Loja</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Compartilhe este link com seus clientes para que eles possam acessar sua loja diretamente.
            </p>
            <div className="flex gap-2">
              <Input
                value={storeLink}
                readOnly
                className="text-sm font-mono bg-muted"
              />
              <Button variant="outline" size="icon" onClick={handleCopyLink} title="Copiar link">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3">
              <Button variant="outline" onClick={handleShareWhatsApp} className="gap-2 text-green-700 border-green-300 hover:bg-green-50">
                <ExternalLink className="h-4 w-4" />
                Compartilhar no WhatsApp
              </Button>
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
              {customCategories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {customCategories.map((category) => (
                    <Badge
                      key={category.id}
                      variant="secondary"
                      className="px-3 py-1.5 text-sm flex items-center gap-2"
                    >
                      {category.nome}
                      <button
                        onClick={() => handleRemoveCategory(category.id)}
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
                  {storeStats.totalReviews > 0 ? (
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{storeStats.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-muted-foreground">{storeStats.totalReviews} avaliações</span>
                      <span className="text-muted-foreground">{storeStats.totalSales.toLocaleString()} vendas</span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Loja nova - Nenhuma avaliação ainda</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Estatísticas */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Estatísticas</h3>
              {storeStats.totalReviews > 0 ? (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{storeStats.rating.toFixed(1)}</p>
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
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">Sua loja ainda não possui vendas ou avaliações</p>
                  <p className="text-xs text-muted-foreground">As estatísticas aparecerão aqui após as primeiras vendas</p>
                </div>
              )}
            </Card>

            {/* Avaliações Preview */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Avaliações Recentes</h3>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{review.buyer_first_name || "Cliente"}</p>
                        <span className="text-xs text-muted-foreground">
                          {review.created_at ? new Date(review.created_at).toLocaleDateString('pt-BR') : ''}
                        </span>
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
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-1">Nenhuma avaliação ainda</p>
                  <p className="text-xs text-muted-foreground">As avaliações dos clientes aparecerão aqui</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EditarLoja;
