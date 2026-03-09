import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

export interface ReviewItem {
  id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  photos: string[];
  created_at: string;
  buyer_first_name: string | null;
}

interface ReviewsListProps {
  reviews: ReviewItem[];
  loading: boolean;
}

export const ReviewsList = ({ reviews, loading }: ReviewsListProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Carregando avaliações...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Nenhuma avaliação ainda</p>
        <p className="text-sm text-muted-foreground">Seja o primeiro a avaliar!</p>
      </div>
    );
  }

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
  }));

  const maxCount = Math.max(...ratingDistribution.map(r => r.count));

  return (
    <div className="space-y-6">
      {/* Rating Summary - Layout melhorado */}
      <div className="rounded-xl border bg-gradient-to-br from-background to-muted/30 p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Nota média */}
          <div className="flex flex-col items-center justify-center lg:border-r lg:pr-8">
            <div className="text-6xl font-bold text-foreground mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 transition-all ${
                    i < Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Baseado em {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
            </p>
          </div>

          {/* Gráfico de distribuição */}
          <div className="flex-1 space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">Distribuição das notas</h4>
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <button 
                key={rating} 
                onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                className={`flex items-center gap-3 group w-full rounded-lg p-1.5 -ml-1.5 transition-all ${
                  ratingFilter === rating 
                    ? 'bg-primary/10 ring-1 ring-primary/30' 
                    : 'hover:bg-muted/50'
                }`}
              >
                {/* Label da nota */}
                <div className={`flex items-center gap-1.5 min-w-[60px] transition-colors ${
                  ratingFilter === rating ? 'text-primary' : ''
                }`}>
                  <span className="text-sm font-semibold">{rating}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                
                {/* Barra de progresso */}
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${percentage}%`,
                      background: rating >= 4 
                        ? 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)/0.8))'
                        : rating === 3 
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' 
                        : 'linear-gradient(90deg, #ef4444, #f87171)'
                    }}
                  />
                </div>
                
                {/* Contagem e porcentagem */}
                <div className="min-w-[70px] text-right">
                  <span className="text-sm font-semibold">{count}</span>
                  <span className="text-xs text-muted-foreground ml-1">({percentage.toFixed(0)}%)</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">
              {ratingDistribution.find(r => r.rating === 5)?.percentage.toFixed(0) || 0}%
            </p>
            <p className="text-xs text-muted-foreground">5 estrelas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {((ratingDistribution.find(r => r.rating >= 4)?.count || 0) + (ratingDistribution.find(r => r.rating === 5)?.count || 0)) > 0 
                ? (((ratingDistribution.find(r => r.rating === 4)?.count || 0) + (ratingDistribution.find(r => r.rating === 5)?.count || 0)) / reviews.length * 100).toFixed(0) 
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Recomendam</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </div>

      {/* Filter indicator and Reviews List */}
      <div className="space-y-4">
        {/* Filter indicator */}
        {ratingFilter !== null && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtrando por:</span>
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full">
                <span className="text-sm font-medium">{ratingFilter}</span>
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              </div>
              <span className="text-sm text-muted-foreground">
                ({reviews.filter(r => r.rating === ratingFilter).length} {reviews.filter(r => r.rating === ratingFilter).length === 1 ? 'avaliação' : 'avaliações'})
              </span>
            </div>
            <button 
              onClick={() => setRatingFilter(null)}
              className="text-sm text-primary hover:underline"
            >
              Limpar filtro
            </button>
          </div>
        )}

        {/* Filtered reviews */}
        {(ratingFilter !== null ? reviews.filter(r => r.rating === ratingFilter) : reviews).map((review) => (
          <div key={review.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {review.buyer_first_name?.charAt(0).toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">{review.buyer_first_name || 'Comprador verificado'}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>

                {review.comment && (
                  <p className="text-sm text-foreground mb-3 leading-relaxed">
                    {review.comment}
                  </p>
                )}

                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {review.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedImage(photo)}
                        className="relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border"
                      >
                        <img
                          src={photo}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-white opacity-0 hover:opacity-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
