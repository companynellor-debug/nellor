import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { Review } from "@/hooks/useSupabaseReviews";

interface ReviewsListProps {
  reviews: Review[];
  loading: boolean;
}

export const ReviewsList = ({ reviews, loading }: ReviewsListProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
            </p>
          </div>

          <div className="space-y-2">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-8">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={review.buyer?.foto_perfil_url || ''} alt={review.buyer?.nome} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {review.buyer?.nome?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">{review.buyer?.nome || 'Usuário'}</p>
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
