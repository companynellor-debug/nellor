import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Megaphone, Plus, Loader2, Clock, CheckCircle, XCircle, Calendar,
  Upload, X, Image, Package, Sparkles, Info
} from "lucide-react";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SponsorshipType = "produto_destaque" | "banner_homepage";
type SponsorshipStatus = "pending" | "approved" | "rejected" | "scheduled";

interface SponsorshipRequest {
  id: string;
  type: SponsorshipType;
  product_id: string | null;
  product_name?: string;
  banner_image_url: string | null;
  message: string | null;
  status: SponsorshipStatus;
  admin_response: string | null;
  scheduled_date: string | null;
  created_at: string;
}

const Patrocinio = () => {
  const { products } = useSupplierProducts();
  const [requests, setRequests] = useState<SponsorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Form state
  const [type, setType] = useState<SponsorshipType>("produto_destaque");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [message, setMessage] = useState("");
  const [bannerFile, setBannerFile] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [products]);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase
        .from("sponsorship_requests" as any)
        .select("*")
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false }) as any);

      if (error) {
        console.error("Error fetching sponsorship requests:", error);
        setRequests([]);
        setLoading(false);
        return;
      }

      // Enrich with product names
      const enriched = (data || []).map((r: any) => {
        const product = products.find((p) => p.id === r.product_id);
        return { ...r, product_name: product?.name || null };
      });

      setRequests(enriched);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setBannerFile(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (type === "produto_destaque" && !selectedProduct) {
      toast.error("Selecione um produto");
      return;
    }

    if (type === "banner_homepage" && !bannerFile) {
      toast.error("Envie uma imagem do banner");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await (supabase
        .from("sponsorship_requests" as any)
        .insert({
          supplier_id: user.id,
          type,
          product_id: type === "produto_destaque" ? selectedProduct : null,
          banner_image_url: type === "banner_homepage" ? bannerFile : null,
          message: message || null,
        }) as any);

      if (error) throw error;

      toast.success("Solicitação enviada! Aguarde aprovação do admin.");
      setModalOpen(false);
      resetForm();
      fetchRequests();
    } catch (error: any) {
      console.error("Error creating sponsorship:", error);
      toast.error(error.message || "Erro ao enviar solicitação");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setType("produto_destaque");
    setSelectedProduct("");
    setMessage("");
    setBannerFile(null);
  };

  const getStatusBadge = (status: SponsorshipStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>;
      case "approved":
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" />Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejeitado</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500 gap-1"><Calendar className="h-3 w-3" />Agendado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (reqType: SponsorshipType) => {
    return reqType === "banner_homepage" ? (
      <Badge variant="outline" className="gap-1"><Image className="h-3 w-3" />Banner</Badge>
    ) : (
      <Badge variant="outline" className="gap-1"><Package className="h-3 w-3" />Produto</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Patrocínio</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Destaque seus produtos ou exiba banners no marketplace
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Solicitação
        </Button>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm">Como funciona o patrocínio?</h3>
            <p className="text-xs text-muted-foreground mt-1">
              <strong>Produto em Destaque:</strong> Seu produto aparece com badge "Patrocinado" na seção de destaques do marketplace.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <strong>Banner na Homepage:</strong> Sua imagem aparece no carrossel principal da página inicial.
            </p>
          </div>
        </div>
      </Card>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Megaphone className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold mb-2">Nenhuma solicitação</h3>
          <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
            Solicite patrocínio para destacar seus produtos ou exibir banners promocionais no marketplace.
          </p>
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Solicitar Patrocínio
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Card key={req.id} className="p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                {req.banner_image_url && (
                  <div className="w-full sm:w-40 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img src={req.banner_image_url} alt="Banner" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getTypeBadge(req.type)}
                    {getStatusBadge(req.status)}
                  </div>
                  {req.product_name && <p className="font-medium">{req.product_name}</p>}
                  {req.message && <p className="text-sm text-muted-foreground">{req.message}</p>}
                  {req.admin_response && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <strong>Resposta do Admin:</strong> {req.admin_response}
                      </p>
                    </div>
                  )}
                  {req.scheduled_date && (
                    <p className="text-xs text-primary">
                      📅 Agendado para {new Date(req.scheduled_date).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enviado em {new Date(req.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Solicitar Patrocínio
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <Label className="text-sm font-medium">Tipo de Patrocínio *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button type="button" onClick={() => setType("produto_destaque")}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${type === "produto_destaque" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"}`}>
                  <Package className={`h-6 w-6 mb-2 ${type === "produto_destaque" ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="font-medium text-sm">Produto em Destaque</p>
                  <p className="text-xs text-muted-foreground mt-1">Badge "Patrocinado" na vitrine</p>
                </button>
                <button type="button" onClick={() => setType("banner_homepage")}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${type === "banner_homepage" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"}`}>
                  <Image className={`h-6 w-6 mb-2 ${type === "banner_homepage" ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="font-medium text-sm">Banner na Homepage</p>
                  <p className="text-xs text-muted-foreground mt-1">Carrossel principal</p>
                </button>
              </div>
            </div>

            {type === "produto_destaque" && (
              <div>
                <Label>Produto *</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === "banner_homepage" && (
              <div>
                <Label>Imagem do Banner * <span className="text-xs text-muted-foreground">(JPG/PNG, máx. 2MB)</span></Label>
                {bannerFile ? (
                  <div className="relative mt-2">
                    <img src={bannerFile} alt="Preview" className="w-full h-40 object-cover rounded-lg border" />
                    <button type="button" onClick={() => setBannerFile(null)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-lg hover:bg-destructive/90">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-2 flex flex-col items-center justify-center h-40 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Clique para enviar</span>
                    <span className="text-xs text-muted-foreground mt-1">Recomendado: 1200x400px</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleBannerUpload} />
                  </label>
                )}
              </div>
            )}

            <div>
              <Label>Mensagem para o Admin (opcional)</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Adicione informações sobre sua campanha..." rows={3} className="mt-1.5" />
            </div>

            <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Sua solicitação será analisada pela equipe Nellor. Você receberá uma notificação com o resultado.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</> : <><Megaphone className="h-4 w-4" />Enviar Solicitação</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Patrocinio;
