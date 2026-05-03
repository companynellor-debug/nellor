import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Avaliacoes = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  const reviews = [
    {
      id: 1,
      user: "João Silva",
      avatar: "👨",
      rating: 5,
      comment: "Excelente produto! Superou minhas expectativas. Entrega rápida e produto de qualidade.",
      date: "15/10/2024",
      product: "Tênis Esportivo Premium",
    },
    {
      id: 2,
      user: "Maria Santos",
      avatar: "👩",
      rating: 5,
      comment: "Adorei! Qualidade impecável e acabamento perfeito. Recomendo muito!",
      date: "10/10/2024",
      product: "Bolsa de Couro Elegante",
    },
    {
      id: 3,
      user: "Pedro Costa",
      avatar: "👨‍💼",
      rating: 4,
      comment: "Muito bom! Vale a pena pelo custo-benefício. Só achei que poderia ter mais cores.",
      date: "05/10/2024",
      product: "Relógio Smartwatch",
    },
    {
      id: 4,
      user: "Ana Oliveira",
      avatar: "👩‍💼",
      rating: 5,
      comment: "Perfeito! Exatamente como na descrição. Chegou antes do prazo.",
      date: "01/10/2024",
      product: "Fone Bluetooth Pro",
    },
  ];

  const handleSubmit = () => {
    if (rating > 0 && comment.trim()) {
      setRating(0);
      setComment("");
      alert("Avaliação enviada com sucesso!");
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--cliente-bg))] text-[hsl(var(--cliente-text))] pb-20">
      <ParticlesBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[hsl(var(--cliente-surface))]/95 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Avaliações</h1>
            <p className="text-sm text-[hsl(var(--cliente-text-muted))]">{reviews.length} avaliações</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {/* Formulário de Avaliação */}
        <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm border-[hsl(var(--cliente-accent))]/30 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Deixe sua avaliação</h2>
          
          <div className="mb-4">
            <p className="text-sm text-[hsl(var(--cliente-text-muted))] mb-2">Sua nota:</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-400"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-[hsl(var(--cliente-text-muted))] mb-2">Seu comentário:</p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte sua experiência com o produto..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[120px] resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || !comment.trim()}
            className="w-full bg-[hsl(var(--cliente-accent))] hover:bg-[hsl(var(--cliente-accent))]/90 text-white disabled:opacity-50"
          >
            Enviar Avaliação
          </Button>
        </Card>

        {/* Lista de Avaliações */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Todas as Avaliações</h2>
          
          {reviews.map((review) => (
            <Card key={review.id} className="bg-white/5 backdrop-blur-sm border-white/10 p-6 hover:bg-white/10 transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl flex-shrink-0">
                  {review.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold">{review.user}</h3>
                    <span className="text-xs text-[hsl(var(--cliente-text-muted))]">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-[hsl(var(--cliente-text-muted))] mb-2">
                    {review.product}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{review.comment}</p>
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Avaliacoes;
