import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
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
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    link: "",
    order: 1,
    active: true
  });
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBanners();

    // Realtime subscription
    const channel = supabase
      .channel('admin-banners-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'banners'
        },
        () => {
          fetchBanners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-banners', {
        body: { action: 'list' }
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Erro ao carregar');
      
      setBanners(data.data || []);
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
        const { data, error } = await supabase.functions.invoke('admin-banners', {
          body: {
            action: 'update',
            id: editingId,
            data: {
              title: formData.title,
              subtitle: formData.subtitle || null,
              image_url: formData.imageUrl,
              link_url: formData.link || null,
              order_index: formData.order,
              ativo: formData.active
            }
          }
        });

        if (error) throw error;
        if (!data?.ok) throw new Error(data?.error || 'Erro ao atualizar');
        toast.success("Banner atualizado!");
      } else {
        const { data, error } = await supabase.functions.invoke('admin-banners', {
          body: {
            action: 'create',
            data: {
              title: formData.title,
              subtitle: formData.subtitle || null,
              image_url: formData.imageUrl,
              link_url: formData.link || null,
              order_index: formData.order,
              ativo: formData.active
            }
          }
        });

        if (error) throw error;
        if (!data?.ok) throw new Error(data?.error || 'Erro ao criar');
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
      subtitle: "",
      imageUrl: "", 
      link: "", 
      order: banners.length + 1, 
      active: true
    });
    setImagePreview("");
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (id: string) => {
    const banner = banners.find(b => b.id === id);
    if (banner) {
      setFormData({
        title: banner.title || "",
        subtitle: banner.subtitle || "",
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
        const { data, error } = await supabase.functions.invoke('admin-banners', {
          body: { action: 'delete', id }
        });

        if (error) throw error;
        if (!data?.ok) throw new Error(data?.error || 'Erro ao excluir');
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
      const { data, error } = await supabase.functions.invoke('admin-banners', {
        body: {
          action: 'update',
          id,
          data: { ativo: !banner.ativo }
        }
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Erro ao alterar');
      toast.success(banner.ativo ? "Banner desativado" : "Banner ativado");
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho máximo de 20MB
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande! Máximo permitido: 20MB');
      return;
    }

    // Preview local imediato
    const isVideo = file.type.startsWith('video/');
    if (!isVideo) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Para vídeos, criar preview com URL temporária
      setImagePreview(URL.createObjectURL(file));
    }

    try {
      setUploading(true);

      // Gerar nome único mantendo extensão original
      const ext = file.name.split('.').pop() || 'file';
      const fileName = `banner_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      // Upload direto sem compressão (aceita qualquer formato)
      const { error } = await supabase.storage.from('banners').upload(fileName, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type,
      });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
      toast.success('Arquivo enviado!');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao enviar arquivo. Tente novamente.');
      setImagePreview("");
      setFormData(prev => ({ ...prev, imageUrl: "" }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setFormData({ ...formData, imageUrl: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const activeBanners = banners.filter(b => b.ativo);
  const inactiveBanners = banners.filter(b => !b.ativo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 dark:text-white">Banners</h1>
          <p className="text-muted-foreground">
            {activeBanners.length} ativos • {inactiveBanners.length} inativos
          </p>
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
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título do banner"
                />
              </div>

              <div>
                <Label>Subtítulo (opcional)</Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Descrição curta do banner"
                />
              </div>

              {/* Upload de Imagem */}
              <div>
                <Label>Imagem do Banner *</Label>
                <div className="mt-2 space-y-3">
                  {imagePreview ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={() => setImagePreview("")}
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                      )}
                      {!uploading && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div 
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className="w-full h-48 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Clique para fazer upload</span>
                          <span className="text-xs text-muted-foreground">Imagem ou vídeo • Máximo 20MB</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <Label>Link de Destino (opcional)</Label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="/cliente/produtos ou https://..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe vazio se o banner não deve ser clicável
                </p>
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

              <Button onClick={handleSubmit} className="w-full" disabled={uploading || !formData.imageUrl}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando imagem...
                  </>
                ) : (
                  <>{editingId ? "Atualizar" : "Criar"} Banner</>
                )}
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

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-2" />
            <p className="text-muted-foreground">Carregando banners...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {banners
              .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
              .map((banner) => (
                <Card key={banner.id} className={`p-4 hover:shadow-lg transition-shadow ${!banner.ativo ? 'opacity-60' : ''}`}>
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
                          {banner.link_url && (
                            <p className="text-xs text-primary mt-1">Link: {banner.link_url}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={banner.ativo ? "default" : "secondary"}>
                            #{banner.order_index || 0}
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
        )}

        {!loading && banners.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum banner cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Novo Banner" para adicionar
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Banners;