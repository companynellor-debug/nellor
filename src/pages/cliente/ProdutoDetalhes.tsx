import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Share2, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

const ProdutoDetalhes = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);

  const product = {
    name: "Tênis Esportivo Premium",
    price: "R$ 299,90",
    rating: 4.8,
    reviews: 124,
    description: "Tênis esportivo de alta qualidade, perfeito para corridas e treinos intensos. Tecnologia de amortecimento avançada e design moderno.",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop",
    ],
    specs: [
      { label: "Material", value: "Mesh respirável" },
      { label: "Solado", value: "Borracha antiderrapante" },
      { label: "Peso", value: "280g" },
      { label: "Cores", value: "Preto, Branco, Azul" },
    ],
    customerReviews: [
      { name: "João Silva", rating: 5, comment: "Excelente produto! Super confortável.", date: "15/10/2024" },
      { name: "Maria Santos", rating: 5, comment: "Adorei! Qualidade impecável.", date: "10/10/2024" },
      { name: "Pedro Costa", rating: 4, comment: "Muito bom, recomendo!", date: "05/10/2024" },
    ],
  };

  const relatedProducts = [
    { id: 2, name: "Bolsa de Couro", price: "R$ 189,90", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop" },
    { id: 3, name: "Relógio Smart", price: "R$ 399,90", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-4">
            <Share2 className="h-6 w-6 cursor-pointer hover:text-primary transition-colors" />
            <Heart className="h-6 w-6 cursor-pointer hover:text-primary transition-colors" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {/* Imagens do Produto */}
        <div className="mb-6">
          <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-muted">
            <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2 justify-center">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === index ? "border-primary scale-105" : "border-border"
                }`}
              >
                <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Informações do Produto */}
        <Card className="bg-white border shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviews} avaliações)
            </span>
          </div>
          <p className="text-3xl font-bold text-primary mb-4">{product.price}</p>
          <p className="text-muted-foreground leading-relaxed">{product.description}</p>
        </Card>

        {/* Especificações */}
        <Card className="bg-white border shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">Especificações</h2>
          <div className="space-y-3">
            {product.specs.map((spec) => (
              <div key={spec.label} className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">{spec.label}</span>
                <span className="font-medium">{spec.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Avaliações */}
        <Card className="bg-white border shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">Avaliações dos Clientes</h2>
          <div className="space-y-4">
            {product.customerReviews.map((review, index) => (
              <div key={index} className="border-b pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{review.name}</p>
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

        {/* Produtos Relacionados */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">Você também pode gostar</h2>
          <div className="grid grid-cols-2 gap-4">
            {relatedProducts.map((product) => (
              <Card key={product.id} className="bg-white border shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer">
                <div className="aspect-square overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="text-sm mb-2">{product.name}</p>
                  <p className="text-primary font-bold">{product.price}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="fixed bottom-20 left-0 right-0 bg-white/95 backdrop-blur-lg border-t shadow-sm p-4 z-30">
          <div className="container mx-auto flex gap-3">
            <Button variant="outline" className="flex-1 border-primary text-primary hover:bg-primary/10">
              Adicionar ao Carrinho
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white">
              Comprar Agora
            </Button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProdutoDetalhes;
