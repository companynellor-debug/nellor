import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  ShoppingCart,
  Package,
  MessageCircle,
  Truck,
  Shield,
  Zap,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useClientDrop } from "@/hooks/useClientDrop";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { useSupabaseReviews } from "@/hooks/useSupabaseReviews";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ReviewsList } from "@/components/cliente/ReviewsList";

/**
 * Página de Produto Drop - Idêntica à página de produto normal
 * UX de compra igual ao marketplace principal
 */
const DropProduto = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedImage, setSelectedImage] = useState(0);
  const [supplierProfile, setSupplierProfile] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);

  const { dropCatalog, isLoading } = useClientDrop();
  const { products: allProducts } = useSupabaseProducts();
  const { addToCart } = useCart();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  // Encontrar produto no catálogo Drop
  const dropProduct = useMemo(() => {
    return dropCatalog?.find((p) => p.product_id === id);
  }, [dropCatalog, id]);

  // Buscar dados completos do produto
  const fullProduct = useMemo(() => {
    return allProducts.find((p) => p.id === id);
  }, [allProducts, id]);

  // Reviews do produto
  const { reviews, loading: reviewsLoading } = useSupabaseReviews(id);

  // Formatar preço
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Buscar perfil do fornecedor
  useEffect(() => {
    const fetchSupplierProfile = async () => {
      if (!fullProduct?.supplier_id) return;

      try {
        const { data: profiles } = await supabase.rpc("get_public_store_profile", {
          _id: fullProduct.supplier_id,
        });

        if (profiles && profiles.length > 0) {
          setSupplierProfile(profiles[0]);
        }
      } catch (error) {
        console.error("Error fetching supplier:", error);
      }
    };

    fetchSupplierProfile();
  }, [fullProduct?.supplier_id]);

  // Handlers
  const productId = parseInt(id || "0", 10);
  const isProductFavorite = isFavorite(productId);

  const handleToggleFavorite = () => {
    if (isProductFavorite) {
      removeFavorite(productId);
    } else {
      addFavorite(productId);
    }
  };

  const handleShare = async () => {
    const productUrl = `${window.location.origin}/cliente/drop/produto/${id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: dropProduct?.product_name || "Produto",
          text: `Confira este produto: ${dropProduct?.product_name}`,
          url: productUrl,
        });
        return;
      } catch {
        // Fallback
      }
    }

    try {
      await navigator.clipboard.writeText(productUrl);
      toast({
        title: "Link copiado!",
        description: "O link do produto foi copiado.",
      });
    } catch {
      // Fallback
    }
  };

  const handleAddToCart = () => {
    if (!dropProduct || !fullProduct) return;

    addToCart(
      {
        productId: fullProduct.id,
        name: dropProduct.product_name,
        price: dropProduct.base_price,
        image: getProductImage(),
        storeId: fullProduct.supplier_id,
        storeName: supplierProfile?.nome || "Fornecedor Drop",
      },
      1
    );

    navigate("/cliente/carrinho");
  };

  const handleBuyNow = () => {
    if (!dropProduct || !fullProduct) return;

    addToCart(
      {
        productId: fullProduct.id,
        name: dropProduct.product_name,
        price: dropProduct.base_price,
        image: dropProduct.product_images?.[0] || "",
        storeId: fullProduct.supplier_id,
        storeName: supplierProfile?.nome || "Fornecedor Drop",
      },
      quantity
    );

    setShowQuantityDialog(false);
    navigate("/cliente/checkout");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7 mb-6 lg:mb-0">
            <Skeleton className="aspect-square w-full max-w-lg mx-auto rounded-2xl" />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper para pegar imagem
  const getProductImage = () => {
    return dropProduct?.product_images?.[0] || "/placeholder.svg";
  };

  // Produto não encontrado
  if (!dropProduct) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Produto não encontrado</h1>
        <p className="text-muted-foreground mb-6">
          Este produto não está disponível no catálogo Drop
        </p>
        <Button onClick={() => navigate("/cliente/drop")}>Ver catálogo Drop</Button>
      </div>
    );
  }

  const images = fullProduct?.imagens?.filter(Boolean) || dropProduct.product_images?.filter(Boolean) || ["/placeholder.svg"];
  const description = fullProduct?.descricao_longa || fullProduct?.descricao_curta || "";

  return (
    <div className="pb-24 lg:pb-6">
      {/* Header Mobile */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm lg:hidden">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Zap className="h-3 w-3 mr-1" />
            Drop
          </Badge>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="p-2 hover:bg-muted rounded-full">
              <Share2 className="h-6 w-6" />
            </button>
            <button onClick={handleToggleFavorite} className="p-2 hover:bg-muted rounded-full">
              <Heart
                className={`h-6 w-6 ${isProductFavorite ? "fill-red-500 text-red-500" : ""}`}
              />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          {/* Imagens */}
          <div className="lg:col-span-7 mb-6 lg:mb-0">
            <div className="lg:flex lg:gap-4">
              {/* Thumbnails - Desktop */}
              <div className="hidden lg:flex lg:flex-col gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Imagem Principal */}
              <div className="flex-1">
                <div className="aspect-square rounded-2xl overflow-hidden bg-muted max-w-lg mx-auto lg:max-w-none relative">
                  <img
                    src={images[selectedImage] || "/placeholder.svg"}
                    alt={dropProduct.product_name}
                    className="w-full h-full object-cover"
                  />
                  <Badge
                    variant="secondary"
                    className="absolute top-4 left-4 bg-primary text-primary-foreground"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Nellor Drop
                  </Badge>
                </div>

                {/* Thumbnails - Mobile */}
                <div className="flex gap-2 justify-center mt-4 lg:hidden">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index ? "border-primary scale-105" : "border-border"
                      }`}
                    >
                      <img src={image || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Info do Produto */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            {/* Fornecedor */}
            {supplierProfile && (
              <div
                onClick={() => navigate(`/cliente/loja/${fullProduct?.supplier_id}`)}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage src={supplierProfile.foto_perfil_url} alt={supplierProfile.nome} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {supplierProfile.nome?.charAt(0) || "F"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm hover:text-primary transition-colors">
                    {supplierProfile.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">Ver loja</p>
                </div>
              </div>
            )}

            {/* Nome e Avaliações */}
            <div>
              <h1 className="text-xl lg:text-2xl font-bold mb-3">{dropProduct.product_name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(fullProduct?.rating_medio || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium ml-1">
                    {fullProduct?.rating_medio?.toFixed(1) || "-"}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({fullProduct?.total_reviews || 0} avaliações)
                </span>
                <Badge
                  variant={dropProduct.stock > 0 ? "outline" : "destructive"}
                  className="flex items-center gap-1 text-xs"
                >
                  <Package className="h-3 w-3" />
                  {dropProduct.stock > 0 ? `${dropProduct.stock} em estoque` : "Sem estoque"}
                </Badge>
              </div>
            </div>

            {/* Preço */}
            <div className="py-4 border-y border-border">
              <p className="text-3xl font-bold text-primary">
                {formatPrice(dropProduct.base_price)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">à vista no PIX</p>
            </div>

            {/* Benefícios Drop */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Truck className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xs font-medium">Envio Direto</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Shield className="h-5 w-5 mx-auto text-green-500 mb-1" />
                <p className="text-xs font-medium">Garantia</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Zap className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
                <p className="text-xs font-medium">Preço Drop</p>
              </div>
            </div>

            {/* Descrição */}
            {description && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Descrição</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{description}</p>
              </div>
            )}

            {/* Botões - Desktop */}
            <div className="hidden lg:flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-primary text-primary hover:bg-primary/10 gap-2 h-12"
                disabled={dropProduct.stock === 0}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                Adicionar ao Carrinho
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-white h-12"
                disabled={dropProduct.stock === 0}
                onClick={() => {
                  setQuantity(1);
                  setShowQuantityDialog(true);
                }}
              >
                Comprar Agora
              </Button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-10 lg:mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg lg:text-xl font-bold">Avaliações dos Clientes</h2>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-lg">{(fullProduct?.rating_medio || 0).toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">
                ({fullProduct?.total_reviews || 0} avaliações)
              </span>
            </div>
          </div>
          <Card className="bg-white border shadow-sm p-5">
            <ReviewsList reviews={reviews} loading={reviewsLoading} />
          </Card>
        </div>
      </main>

      {/* Botões fixos - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex gap-3 lg:hidden z-50">
        <Button
          variant="outline"
          className="flex-1 border-primary text-primary gap-2"
          disabled={dropProduct.stock === 0}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-5 w-5" />
          Carrinho
        </Button>
        <Button
          className="flex-1 bg-primary text-white"
          disabled={dropProduct.stock === 0}
          onClick={() => {
            setQuantity(1);
            setShowQuantityDialog(true);
          }}
        >
          Comprar
        </Button>
      </div>

      {/* Dialog Quantidade */}
      <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
        <DialogContent className="max-w-sm">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quantidade</h3>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <Input
                type="number"
                min={1}
                max={dropProduct.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(dropProduct.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-20 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(dropProduct.stock, quantity + 1))}
              >
                +
              </Button>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold text-primary">
                {formatPrice(dropProduct.base_price * quantity)}
              </span>
            </div>
            <Button className="w-full" onClick={handleBuyNow}>
              Continuar para pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DropProduto;
