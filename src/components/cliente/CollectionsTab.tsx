import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FolderPlus,
  Folder,
  Share2,
  Trash2,
  UserPlus,
  ChevronRight,
  ArrowLeft,
  Package,
  Store,
  X,
  Copy,
  Users,
} from "lucide-react";
import { useCollections, Collection, CollectionItem } from "@/hooks/useCollections";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/utils/formatCurrency";


const CollectionsTab = () => {
  const navigate = useNavigate();
  const {
    collections,
    sharedCollections,
    loading,
    createCollection,
    deleteCollection,
    addItemToCollection,
    removeItemFromCollection,
    inviteToCollection,
    getCollectionItems,
    getShareUrl,
    generateShareToken,
  } = useCollections();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});
  const [supplierDetails, setSupplierDetails] = useState<Record<string, any>>({});

  const openCollection = async (col: Collection) => {
    setSelectedCollection(col);
    setItemsLoading(true);
    try {
      const items = await getCollectionItems(col.id);
      setCollectionItems(items);
      // Load product/supplier details
      const productIds = items.filter((i) => i.type === "product").map((i) => i.reference_id);
      const supplierIds = items.filter((i) => i.type === "supplier").map((i) => i.reference_id);
      if (productIds.length) {
        const { data } = await supabase
          .from("products")
          .select("id, nome, preco, imagens")
          .in("id", productIds);
        if (data) {
          const map: Record<string, any> = {};
          data.forEach((p) => (map[p.id] = p));
          setProductDetails(map);
        }
      }
      if (supplierIds.length) {
        const { data } = await supabase
          .from("profiles")
          .select("id, nome, foto_perfil_url")
          .in("id", supplierIds);
        if (data) {
          const map: Record<string, any> = {};
          data.forEach((s) => (map[s.id] = s));
          setSupplierDetails(map);
        }
      }
    } finally {
      setItemsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const created = await createCollection(newName.trim(), newDesc.trim() || undefined);
    if (!created) return;

    setNewName("");
    setNewDesc("");
    setShowCreateModal(false);
  };

  const handleShare = async (col: Collection) => {
    let token = col.share_token;
    if (!token) {
      token = await generateShareToken(col.id);
      if (!token) return;
    }
    const url = getShareUrl(token);
    navigator.clipboard.writeText(url).catch(() => {});
    toast({ title: "Link copiado!", description: url });
  };

  const handleInvite = async () => {
    if (!selectedCollection || !inviteEmail.trim()) return;
    setInviting(true);
    await inviteToCollection(selectedCollection.id, inviteEmail.trim());
    setInviting(false);
    setInviteEmail("");
    setShowInviteModal(false);
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeItemFromCollection(itemId);
    setCollectionItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  if (selectedCollection) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedCollection(null)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h3 className="font-bold text-base">{selectedCollection.name}</h3>
            {selectedCollection.description && (
              <p className="text-xs text-muted-foreground">{selectedCollection.description}</p>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => handleShare(selectedCollection)}
          >
            <Share2 className="h-3.5 w-3.5" />
            Compartilhar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setShowInviteModal(true)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Convidar
          </Button>
        </div>

        {itemsLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Carregando itens...</div>
        ) : collectionItems.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Folder className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Esta pasta está vazia.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Salve produtos ou fornecedores nos cards do marketplace.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {collectionItems.map((item) => {
              if (item.type === "product") {
                const p = productDetails[item.reference_id];
                return (
                  <Card key={item.id} className="overflow-hidden relative group">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {p ? (
                      <>
                        <div
                          className="aspect-square overflow-hidden cursor-pointer"
                          onClick={() => navigate(`/cliente/produto/${p.id}`)}
                        >
                          <img
                            src={p.imagens?.[0] || ""}
                            alt={p.nome}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium line-clamp-2">{p.nome}</p>
                          <p className="text-xs text-primary font-bold mt-0.5">
                            {formatCurrency(p.preco)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="p-3 flex items-center gap-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Produto</span>
                      </div>
                    )}
                  </Card>
                );
              } else {
                const s = supplierDetails[item.reference_id];
                return (
                  <Card key={item.id} className="p-3 relative group">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {s ? (
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => navigate(`/cliente/loja/${s.id}`)}
                      >
                        <img
                          src={s.foto_perfil_url || ""}
                          alt={s.nome}
                          className="w-10 h-10 rounded-full object-cover border"
                        />
                        <div>
                          <p className="text-xs font-semibold line-clamp-1">{s.nome}</p>
                          <p className="text-[10px] text-muted-foreground">Fornecedor</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Fornecedor</span>
                      </div>
                    )}
                  </Card>
                );
              }
            })}
          </div>
        )}

        {/* Invite Dialog */}
        <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Pessoa</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Digite o email de outro usuário da Nellor para compartilhar esta pasta com ele.
            </p>
            <Input
              placeholder="email@exemplo.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                {inviting ? "Enviando..." : "Convidar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base">Minhas Pastas</h3>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreateModal(true)}>
          <FolderPlus className="h-4 w-4" />
          Nova Pasta
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : collections.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Folder className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Nenhuma pasta ainda</p>
          <p className="text-xs text-muted-foreground mt-1">
            Crie pastas para organizar produtos e fornecedores favoritos.
          </p>
          <Button
            size="sm"
            className="mt-3 gap-1.5"
            onClick={() => setShowCreateModal(true)}
          >
            <FolderPlus className="h-4 w-4" />
            Criar primeira pasta
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {collections.map((col) => (
            <Card
              key={col.id}
              className="p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => openCollection(col)}
                >
                  <p className="font-semibold text-sm">{col.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {col.items_count} {col.items_count === 1 ? "item" : "itens"}
                    {col.description && ` · ${col.description}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleShare(col)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Compartilhar"
                  >
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() =>
                      deleteCollection(col.id).then(() => {})
                    }
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                  <button
                    onClick={() => openCollection(col)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pastas Compartilhadas Comigo */}
      {sharedCollections.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-bold text-sm text-muted-foreground">Pastas Compartilhadas Comigo</h3>
          </div>
          {sharedCollections.map((col) => (
            <Card
              key={col.id}
              className="p-4 hover:shadow-sm transition-shadow border-dashed"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Folder className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 cursor-pointer" onClick={() => openCollection(col)}>
                  <p className="font-semibold text-sm">{col.name}</p>
                  {col.description && (
                    <p className="text-xs text-muted-foreground">{col.description}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nome da pasta"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Input
              placeholder="Descrição (opcional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              Criar Pasta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionsTab;
