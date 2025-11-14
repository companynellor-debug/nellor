import { useState, useEffect } from "react";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star, Upload, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useSupabaseReviews } from "@/hooks/useSupabaseReviews";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AvaliarPedido = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { createReview } = useSupabaseReviews();
  const { user } = useSupabaseAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            supplier_id,
            itens
          `)
          .eq('id', orderId)
          .single();

        if (error) throw error;
        
        // Buscar informações do fornecedor separadamente
        const { data: supplierData } = await supabase
          .from('profiles')
          .select('nome')
          .eq('id', data.supplier_id)
          .single();
        
        setOrder({
          ...data,
          storeName: supplierData?.nome || 'Loja'
        });
      } catch (error: any) {
        console.error('Error fetching order:', error);
        toast.error("Erro ao carregar pedido");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p>Carregando pedido...</p>
        </div>
      </div>
    );
  }

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const files = Array.from(e.target.files);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setPhotos([...photos, ...uploadedUrls]);
      toast.success("Arquivos enviados com sucesso!");
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error("Erro ao enviar arquivos");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma avaliação");
      return;
    }

    if (!comment.trim()) {
      toast.error("Por favor, escreva um comentário");
      return;
    }

    const items = Array.isArray(order.itens) ? order.itens : [];
    
    if (items.length === 0) {
      toast.error("Pedido sem produtos para avaliar");
      return;
    }

    try {
      // Criar avaliação para cada produto do pedido
      const items = Array.isArray(order.itens) ? order.itens : [];
      
      if (items.length === 0) {
        toast.error("Pedido sem produtos para avaliar");
        return;
      }

      for (const item of items) {
        const productId = item.product_id;
        
        if (!productId) {
          console.error('Product ID not found in item:', item);
          continue;
        }
        
        await createReview({
          product_id: productId,
          order_id: order.id,
          rating,
          comment: comment.trim(),
          photos,
        });
      }

      toast.success("Avaliação enviada com sucesso!");
      navigate("/cliente/meus-pedidos");
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    }
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
          <h2 className="text-xl font-bold mb-2">Pedido #{order.order_number}</h2>
          <p className="text-muted-foreground mb-4">{order.storeName}</p>
          
          <div className="space-y-2">
            {(Array.isArray(order.itens) ? order.itens : []).map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-medium">R$ {Number(item.price).toFixed(2)}</span>
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

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Fotos e Vídeos (opcional)
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={photo} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:bg-muted/20 transition-colors">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Upload className="h-6 w-6 text-muted-foreground" />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Adicione fotos ou vídeos do produto
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-primary hover:bg-primary/90 text-white"
            disabled={uploading}
          >
            {uploading ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default AvaliarPedido;
