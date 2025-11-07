import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Image as ImageIcon, Calendar, Clock } from "lucide-react";
import { useBanners } from "@/hooks/useBanners";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Banners = () => {
  const { banners, addBanner, updateBanner, deleteBanner, toggleBannerStatus } = useBanners();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    link: "",
    order: 1,
    active: true,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined
  });
  const [imagePreview, setImagePreview] = useState("");

  const handleSubmit = () => {
    if (!formData.title || !formData.imageUrl) {
      toast.error("Preencha o título e faça o upload da imagem");
      return;
    }

    const bannerData = {
      ...formData,
      startDate: formData.startDate ? formData.startDate.toISOString() : undefined,
      endDate: formData.endDate ? formData.endDate.toISOString() : undefined
    };

    if (editingId) {
      updateBanner(editingId, bannerData);
      toast.success("Banner atualizado!");
    } else {
      addBanner(bannerData);
      toast.success("Banner criado!");
    }

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ 
      title: "", 
      imageUrl: "", 
      link: "", 
      order: 1, 
      active: true,
      startDate: undefined,
      endDate: undefined
    });
    setImagePreview("");
    setEditingId(null);
  };

  const handleEdit = (id: string) => {
    const banner = banners.find(b => b.id === id);
    if (banner) {
      setFormData({
        title: banner.title,
        imageUrl: banner.imageUrl,
        link: banner.link,
        order: banner.order,
        active: banner.active,
        startDate: banner.startDate ? new Date(banner.startDate) : undefined,
        endDate: banner.endDate ? new Date(banner.endDate) : undefined
      });
      setImagePreview(banner.imageUrl);
      setEditingId(id);
      setOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este banner?")) {
      deleteBanner(id);
      toast.success("Banner excluído!");
    }
  };

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, imageUrl: url });
    setImagePreview(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData({ ...formData, imageUrl: result });
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => setFormData({ ...formData, startDate: date })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe vazio para início imediato
                  </p>
                </div>

                <div>
                  <Label>Data de Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => setFormData({ ...formData, endDate: date })}
                        disabled={(date) => formData.startDate ? date < formData.startDate : false}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe vazio para sem data limite
                  </p>
                </div>
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
            .sort((a, b) => a.order - b.order)
            .map((banner) => (
              <Card key={banner.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex gap-4">
                  <div className="w-48 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=400&q=80";
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{banner.title}</h3>
                        {(banner.startDate || banner.endDate) && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {banner.startDate && format(new Date(banner.startDate), "dd/MM/yyyy", { locale: ptBR })}
                              {banner.startDate && banner.endDate && " - "}
                              {banner.endDate && format(new Date(banner.endDate), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        )}
                        {banner.startDate && new Date(banner.startDate) > new Date() && (
                          <Badge variant="secondary" className="mt-2">
                            Agendado
                          </Badge>
                        )}
                        {banner.endDate && new Date(banner.endDate) < new Date() && (
                          <Badge variant="destructive" className="mt-2">
                            Expirado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={banner.active ? "default" : "secondary"}>
                          Ordem: {banner.order}
                        </Badge>
                        <Switch
                          checked={banner.active}
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
