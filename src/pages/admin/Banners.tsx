import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  order_index: number | null;
  ativo: boolean | null;
  created_at: string | null;
}

const Banners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    link: "",
    order: 1,
    active: true
  });
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.imageUrl) {
      toast.error("Preencha o título e faça o upload da imagem");
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('banners')
          .update({
            title: formData.title,
            image_url: formData.imageUrl,
            link_url: formData.link || null,
            order_index: formData.order,
            ativo: formData.active
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success("Banner atualizado!");
      } else {
        const { error } = await supabase
          .from('banners')
          .insert({
            title: formData.title,
            image_url: formData.imageUrl,
            link_url: formData.link || null,
            order_index: formData.order,
            ativo: formData.active
          });

        if (error) throw error;
        toast.success("Banner criado!");
      }

      setOpen(false);
      resetForm();
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Erro ao salvar banner');
    }
  };

  const resetForm = () => {
    setFormData({ 
      title: "", 
      imageUrl: "", 
      link: "", 
      order: 1, 
      active: true
    });
    setImagePreview("");
    setEditingId(null);
  };

  const handleEdit = (id: string) => {
    const banner = banners.find(b => b.id === id);
    if (banner) {
      setFormData({
        title: banner.title || "",
        imageUrl: banner.image_url,
        link: banner.link_url || "",
        order: banner.order_index || 1,
        active: banner.ativo ?? true
      });
      setImagePreview(banner.image_url);
      setEditingId(id);
      setOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este banner?")) {
      try {
        const { error } = await supabase
          .from('banners')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast.success("Banner excluído!");
        fetchBanners();
      } catch (error) {
        console.error('Error deleting banner:', error);
        toast.error('Erro ao excluir banner');
      }
    }
  };

  const toggleBannerStatus = async (id: string) => {
    const banner = banners.find(b => b.id === id);
    if (!banner) return;

    try {
      const { error } = await supabase
        .from('banners')
        .update({ ativo: !banner.ativo })
        .eq('id', id);

      if (error) throw error;
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        toast.error('Você precisa estar logado para enviar imagens');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `banner_${Date.now()}.${fileExt}`;
      // Respeita políticas típicas de Storage (pasta do usuário)
      const filePath = `${authData.user.id}/banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData({ ...formData, imageUrl: publicUrl });
      setImagePreview(publicUrl);
      toast.success('Imagem enviada!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao enviar imagem');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 dark:text-white">Banners</h1>
          <p className="text-muted-foreground">Gerenciar banners da plataforma</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Novo"} Banner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título do banner"
                />
              </div>

              <div>
                <Label>Upload de Imagem</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceitos: JPG, PNG, WEBP
                </p>
              </div>

              <div>
                <Label>Ou cole a URL da imagem</Label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, imageUrl: e.target.value });
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://..."
                />
              </div>

              {imagePreview && (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                    onError={() => setImagePreview("")}
                  />
                </div>
              )}

              <div>
                <Label>Link (opcional)</Label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ordem de Exibição</Label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
                <div className="flex items-center justify-between pt-6">
                  <Label>Ativo</Label>
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(active) => setFormData({ ...formData, active })}
                  />
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {editingId ? "Atualizar" : "Criar"} Banner
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Lista de Banners</h2>
          <Badge variant="secondary">{banners.length}</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {banners
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .map((banner) => (
              <Card key={banner.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex gap-4">
                  <div className="w-48 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={banner.image_url}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=400&q=80";
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{banner.title || 'Sem título'}</h3>
                        {banner.subtitle && (
                          <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={banner.ativo ? "default" : "secondary"}>
                          Ordem: {banner.order_index || 0}
                        </Badge>
                        <Switch
                          checked={banner.ativo ?? false}
                          onCheckedChange={() => toggleBannerStatus(banner.id)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(banner.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(banner.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </div>

        {banners.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum banner cadastrado</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Banners;