import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Megaphone, Plus, Loader2, Image, Clock, CheckCircle, XCircle } from "lucide-react";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

interface SponsoredRequest {
  id: string;
  product_id: string;
  product_name?: string;
  description: string;
  banner_url: string | null;
  status: string;
  created_at: string;
}

const Patrocinio = () => {
  const { products } = useSupplierProducts();
  const [requests, setRequests] = useState<SponsoredRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("sponsored_products")
        .select("*")
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enriched = (data || []).map((r: any) => {
        const product = products.find((p) => p.id === r.product_id);
        return { ...r, product_name: product?.name || "Produto" };
      });

      setRequests(enriched);
    } catch (error) {
      console.error("Error fetching sponsored requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("sponsored_products")
        .insert({
          product_id: selectedProduct,
          supplier_id: user.id,
          description: description || null,
        });

      if (error) throw error;

      toast.success("Solicitação de patrocínio enviada!");
      setModalOpen(false);
      setSelectedProduct("");
      setDescription("");
      fetchRequests();
    } catch (error: any) {
      console.error("Error creating sponsorship:", error);
      toast.error("Erro ao enviar solicitação");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case "expired":
        return <Badge variant="outline">Expirado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
          <p className="text-muted-foreground text-sm mt-1">Destaque seus produtos no marketplace</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Solicitação
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card className="p-12 text-center">
          <Megaphone className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold mb-2">Nenhuma solicitação</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Solicite o patrocínio de produtos para destaque no marketplace.
          </p>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Solicitar Patrocínio
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Card key={req.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{req.product_name}</h3>
                  {req.description && (
                    <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(req.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {getStatusBadge(req.status)}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Patrocínio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Produto *</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição da campanha (opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva sua campanha..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Patrocinio;
