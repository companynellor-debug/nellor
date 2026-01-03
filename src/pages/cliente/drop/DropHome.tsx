import { useState, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ChevronRight, Zap, Package, TrendingUp, X } from "lucide-react";
import { useClientDrop } from "@/hooks/useClientDrop";
import { useSupabaseCategories } from "@/hooks/useSupabaseCategories";

/**
 * Home do Nellor Drop - Catálogo visual idêntico ao marketplace principal
 * Grid de produtos, cards modernos, filtros por categoria
 */
const DropHome = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("busca") || "";
  
  const { dropCatalog, isLoading } = useClientDrop();
  const { categories } = useSupabaseCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Formatar preço
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Filtrar produtos por busca e categoria
  const filteredProducts = useMemo(() => {
    let products = dropCatalog || [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.product_name.toLowerCase().includes(query) ||
          p.supplier_name?.toLowerCase().includes(query)
      );
    }

    // Nota: categoria pode ser filtrada quando disponível
    // if (selectedCategory) {
    //   products = products.filter((p) => p.category_id === selectedCategory);
    // }

    return products;
  }, [dropCatalog, searchQuery]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
        {/* Hero skeleton */}
        <Skeleton className="h-40 w-full rounded-xl mb-8" />

        {/* Categories skeleton */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-20 rounded-xl flex-shrink-0" />
          ))}
        </div>

        {/* Products grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
      {/* Hero Banner */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10 border-primary/20 overflow-hidden">
          <div className="p-6 md:p-8 flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Nellor Drop</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                Produtos selecionados para você
              </h1>
              <p className="text-sm text-muted-foreground mb-4">
                Encontre ofertas exclusivas de fornecedores parceiros
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>{filteredProducts.length} produtos</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Preços especiais</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                <Zap className="h-12 w-12 text-primary" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mb-8">
          <div className="bg-background rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">Categorias</h3>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              )}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === category.id ? null : category.id)
                  }
                  className={`flex flex-col items-center gap-2 min-w-[80px] p-3 rounded-xl transition-colors group ${
                    selectedCategory === category.id
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      selectedCategory === category.id
                        ? "bg-primary/30"
                        : "bg-primary/10 group-hover:bg-primary/20"
                    }`}
                  >
                    {category.imagem_url ? (
                      <img
                        src={category.imagem_url}
                        alt={category.nome}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <span className="text-2xl">🛍️</span>
                    )}
                  </div>
                  <span
                    className={`text-xs text-center font-medium whitespace-nowrap ${
                      selectedCategory === category.id ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {category.nome}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Search results indicator */}
      {searchQuery && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Resultados para "<span className="font-medium text-foreground">{searchQuery}</span>"
          </p>
          <Link
            to="/cliente/drop"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Limpar busca
          </Link>
        </div>
      )}

      {/* Products Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {selectedCategory
              ? `Produtos em ${categories.find((c) => c.id === selectedCategory)?.nome || "categoria"}`
              : "Todos os Produtos Drop"}
          </h2>
          <span className="text-sm text-muted-foreground">{filteredProducts.length} produtos</span>
        </div>

        {filteredProducts.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Tente buscar por outros termos"
                : "Não há produtos disponíveis nesta categoria"}
            </p>
            {(searchQuery || selectedCategory) && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  navigate("/cliente/drop");
                }}
                className="text-primary hover:underline text-sm"
              >
                Ver todos os produtos
              </button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.map((product) => (
              <Link key={product.product_id} to={`/cliente/drop/produto/${product.product_id}`}>
                <Card className="bg-background border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group h-full">
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={product.product_images?.[0] || "/placeholder.svg"}
                      alt={product.product_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {/* Badge Drop */}
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] px-1.5 py-0.5"
                    >
                      Drop
                    </Badge>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground mb-1 truncate">
                      {product.supplier_name || "Fornecedor"}
                    </p>
                    <h3 className="font-medium text-sm mb-2 line-clamp-2 text-foreground min-h-[40px]">
                      {product.product_name}
                    </h3>
                    <p className="text-primary font-bold">{formatPrice(product.base_price)}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-muted-foreground">-</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {product.stock > 0 ? `${product.stock} un.` : "Sem estoque"}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DropHome;
