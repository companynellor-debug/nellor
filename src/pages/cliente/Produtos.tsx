import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { products } from "@/data/products";
import { useState, useEffect } from "react";

const Produtos = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("categoria");
  const searchParam = searchParams.get("busca");

  const [searchTerm, setSearchTerm] = useState(searchParam || "");
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "");

  useEffect(() => {
    setSearchTerm(searchParam || "");
    setSelectedCategory(categoryParam || "");
  }, [searchParam, categoryParam]);

  const categories = ["Roupas", "Calçados", "Acessórios", "Eletrônicos", "Beleza", "Casa"];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchTerm
      ? product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesCategory = selectedCategory
      ? product.category === selectedCategory
      : true;

    return matchesSearch && matchesCategory;
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory("");
    } else {
      setSelectedCategory(category);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/cliente")}
              className="hover:bg-accent p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-primary flex-1">
              {selectedCategory || "Todos os Produtos"}
            </h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-muted border-input focus:border-primary"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {/* Filtro de Categorias */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="h-5 w-5 text-foreground" />
            <h2 className="font-bold text-foreground">Categorias</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Badge
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`cursor-pointer whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Resultados */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
          </p>
        </div>

        {/* Grid de Produtos */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Link key={product.id} to={`/cliente/produto/${product.id}`}>
                <Card className="bg-card border overflow-hidden hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2 text-foreground">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-primary font-bold">{product.price}</p>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-foreground">{product.rating}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-white border shadow-sm p-12 text-center">
            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-bold text-lg mb-2">Nenhum produto encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tente ajustar os filtros ou buscar por outro termo
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
              }}
              className="text-primary hover:underline"
            >
              Limpar filtros
            </button>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Produtos;
