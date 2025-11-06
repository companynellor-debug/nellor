import { useState } from "react";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useReviews } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import { useStores } from "@/hooks/useStores";
import { toast } from "sonner";

const AvaliarPedido = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { order } = location.state || {};
  const { addStoreReview } = useReviews();
  const { user } = useAuth();
  const { updateStoreRating } = useStores();
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
          <Button onClick={() => navigate("/cliente/meus-pedidos")}>
            Voltar para Pedidos
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma avaliação");
      return;
    }

    if (!comment.trim()) {
      toast.error("Por favor, escreva um comentário");
      return;
    }

    addStoreReview({
      storeId: order.storeId,
      orderId: order.id,
      userId: user?.id || '',
      userName: user?.name || 'Usuário',
      rating,
      comment: comment.trim()
    });

    updateStoreRating(order.storeId, rating);

    toast.success("Avaliação enviada com sucesso!");
    navigate("/cliente/meus-pedidos");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/cliente/meus-pedidos")} 
            className="rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold">Avaliar Pedido</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-6">
        <Card className="bg-white border shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-2">Pedido #{order.id}</h2>
          <p className="text-muted-foreground mb-4">{order.storeName}</p>
          
          <div className="space-y-2">
            {order.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-medium">{item.price}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-white border shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Como foi sua experiência?</h3>
          
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Conte-nos sobre sua experiência
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escreva seu comentário aqui..."
              className="min-h-[120px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500 caracteres
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            Enviar Avaliação
          </Button>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default AvaliarPedido;
