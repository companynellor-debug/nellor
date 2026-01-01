import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package, Image, Upload, X, Loader2 } from "lucide-react";
import { useSupabaseCategories } from "@/hooks/useSupabaseCategories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Categorias = () => {
  const { categories, createCategory, updateCategory, deleteCategory, uploadCategoryImage, loading } = useSupabaseCategories();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    slug: "",
    imagem_url: ""
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload para Storage
    setUploading(true);
    const url = await uploadCategoryImage(file);
    setUploading(false);

    if (url) {
      setFormData({ ...formData, imagem_url: url });
      toast.success("Imagem enviada com sucesso!");
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setFormData({ ...formData, imagem_url: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!formData.nome) {
      toast.error("Preencha o nome da categoria");
      return;
    }

    const slug = formData.slug || formData.nome.toLowerCase().replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    try {
      if (editingId) {
        await updateCategory(editingId, {
          nome: formData.nome,
          slug,
          imagem_url: formData.imagem_url || null
        });
      } else {
        await createCategory({
          nome: formData.nome,
          slug,
          imagem_url: formData.imagem_url || null
        });
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const resetForm = () => {
    setFormData({ nome: "", slug: "", imagem_url: "" });
    setEditingId(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (category: typeof categories[0]) => {
    setEditingId(category.id);
    setFormData({
      nome: category.nome,
      slug: category.slug,
      imagem_url: category.imagem_url || ""
    });
    setPreviewImage(category.imagem_url || null);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      try {
        await deleteCategory(id);
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  // Calcular total de produtos
  const totalProducts = categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 dark:text-white">Categorias</h1>
          <p className="text-muted-foreground">
            {categories.length} categorias • {totalProducts} produtos no total
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome da categoria"
                />
              </div>
              <div>
                <Label>Slug (opcional)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="ex: eletronicos (gerado automaticamente se vazio)"
                />
              </div>
              
              {/* Upload de Imagem */}
              <div>
                <Label>Imagem da Categoria</Label>
                <div className="mt-2 space-y-3">
                  {(previewImage || formData.imagem_url) ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                      <img 
                        src={previewImage || formData.imagem_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Clique para fazer upload</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {!previewImage && !formData.imagem_url && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploading ? "Enviando..." : "Selecionar Imagem"}
                    </Button>
                  )}
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={uploading}>
                {editingId ? 'Salvar Alterações' : 'Criar Categoria'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Lista de Categorias</h2>
          <Badge variant="secondary">{categories.length}</Badge>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-2" />
            <p className="text-muted-foreground">Carregando categorias...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {category.imagem_url ? (
                      <img 
                        src={category.imagem_url} 
                        alt={category.nome}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Image className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{category.nome}</h3>
                      <p className="text-xs text-muted-foreground">
                        {category.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Criado em: {new Date(category.created_at || '').toLocaleDateString('pt-BR')}</span>
                  <Badge variant="outline" className="text-xs">
                    {category.product_count || 0} {category.product_count === 1 ? 'produto' : 'produtos'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma categoria cadastrada</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Categorias;
