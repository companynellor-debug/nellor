import { useState, useEffect } from "react";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star, Camera, X, ImageIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useSupabaseReviews } from "@/hooks/useSupabaseReviews";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const AvaliarPedido = () => {
  const navigate = useNavigate();
  const {
    orderId
  } = useParams();
  const {
    createReview
  } = useSupabaseReviews();
  const {
    user
  } = useSupabaseAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const {
          data,
          error
        } = await supabase.from('orders').select(`
            id,
            order_number,
            supplier_id,
            itens
          `).eq('id', orderId).single();
        if (error) throw error;

        // Buscar informações do fornecedor separadamente
        const {
          data: supplierData
        } = await supabase.from('profiles').select('nome').eq('id', data.supplier_id).single();
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
    return <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center text-white">
          <p>Carregando pedido...</p>
        </div>
      </div>;
  }
  if (!order) {
    return <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Pedido não encontrado</h1>
          <Button onClick={() => navigate("/cliente/meus-pedidos")} variant="secondary">
            Voltar para Pedidos
          </Button>
        </div>
      </div>;
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
        const {
          error: uploadError
        } = await supabase.storage.from('products').upload(filePath, file);
        if (uploadError) throw uploadError;
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('products').getPublicUrl(filePath);
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
          photos
        });
      }
      toast.success("Avaliação enviada com sucesso!");
      navigate("/cliente/meus-pedidos");
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    }
  };
  const firstItem = Array.isArray(order.itens) && order.itens.length > 0 ? order.itens[0] : null;
  return <div className="min-h-screen bg-primary pb-20">
      {/* Header com gradiente roxo */}
      <div className="bg-primary pt-4 pb-32 px-4">
        {/* Top bar */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cliente/meus-pedidos")} className="rounded-full text-white hover:bg-white/10">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold text-white">Avalie sua compra</h1>
        </div>

        {/* Product card no header roxo */}
        <Card className="bg-white/20 backdrop-blur-sm border-0 p-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shrink-0">
            {firstItem?.image ? <img src={firstItem.image} alt={firstItem.name} className="w-full h-full object-cover rounded-xl" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">
              {firstItem?.name || 'Produto'}
            </p>
            <p className="text-white/80 text-sm truncate">
              {order.storeName}
            </p>
          </div>
        </Card>
      </div>

      {/* Content cards */}
      <main className="px-4 -mt-20 space-y-4">
        {/* Rating card */}
        <Card className="bg-white border-0 shadow-lg rounded-2xl p-6">
          <div className="flex justify-center gap-3 mb-3">
            {[1, 2, 3, 4, 5].map(star => <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110 active:scale-95">
                <Star className={`h-10 w-10 ${star <= rating ? "fill-primary text-primary" : "text-gray-300"}`} />
              </button>)}
          </div>
          <p className="text-center text-muted-foreground text-sm">
            Toque para avaliar
          </p>
        </Card>

        {/* Comment card */}
        <Card className="bg-white border-0 shadow-lg rounded-2xl p-6">
          <h3 className="font-semibold mb-3">Sua avaliação</h3>
          <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Escreva seu comentário aqui..." className="min-h-[100px] border-muted bg-muted/30 rounded-xl resize-none" maxLength={500} />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {comment.length}/500
          </p>
        </Card>

        {/* Photos card */}
        <Card className="bg-white border-0 shadow-lg rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Adicionar fotos</h3>
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" disabled={uploading} />
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Camera className="h-5 w-5 text-primary" />
              </div>
            </label>
          </div>

          {photos.length > 0 && <div className="flex flex-wrap gap-3">
              {photos.map((photo, index) => <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border">
                  <img src={photo} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>)}
            </div>}

          {photos.length === 0 && <p className="text-sm text-muted-foreground">
              Adicione fotos do produto recebido
            </p>}
        </Card>

        {/* Submit button */}
        <Button onClick={handleSubmit} disabled={uploading} className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg bg-white text-primary">
          {uploading ? "Enviando..." : "Enviar avaliação"}
        </Button>
      </main>

      <BottomNav />
    </div>;
};
export default AvaliarPedido;