import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Folder, Package, Store, ArrowLeft, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import nellorLogo from "@/assets/nellor-logo.png";

const PastaPublica = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});
  const [supplierDetails, setSupplierDetails] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);

      const { data: col } = await supabase
        .from("collections")
        .select("*")
        .eq("share_token", token)
        .maybeSingle();

      if (!col) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCollection(col);

      const { data: colItems } = await supabase
        .from("collection_items")
        .select("*")
        .eq("collection_id", col.id)
        .order("added_at", { ascending: false });

      if (colItems) {
        setItems(colItems);
        const productIds = colItems.filter((i: any) => i.type === "product").map((i: any) => i.reference_id);
        const supplierIds = colItems.filter((i: any) => i.type === "supplier").map((i: any) => i.reference_id);

        if (productIds.length) {
          const { data: products } = await supabase
            .from("products")
            .select("id, nome, preco, imagens")
            .in("id", productIds);
          if (products) {
            const map: Record<string, any> = {};
            products.forEach((p) => (map[p.id] = p));
            setProductDetails(map);
          }
        }
        if (supplierIds.length) {
          const { data: suppliers } = await supabase
            .from("profiles")
            .select("id, nome, foto_perfil_url")
            .in("id", supplierIds);
          if (suppliers) {
            const map: Record<string, any> = {};
            suppliers.forEach((s) => (map[s.id] = s));
            setSupplierDetails(map);
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [token]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).catch(() => {});
    toast({ title: "Link copiado!" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground animate-pulse">Carregando pasta...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 gap-4">
        <Folder className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-xl font-bold">Pasta não encontrada</h1>
        <p className="text-muted-foreground text-sm">Este link pode ter expirado ou ser inválido.</p>
        <Button onClick={() => navigate("/")}>Ir para a Nellor</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-10">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-2xl">
          <img src={nellorLogo} alt="Nellor" className="h-6" />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5" />
            Compartilhar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Collection info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Folder className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{collection.name}</h1>
            {collection.description && (
              <p className="text-sm text-muted-foreground">{collection.description}</p>
            )}
            <Badge variant="outline" className="text-xs mt-1">
              {items.length} {items.length === 1 ? "item" : "itens"}
            </Badge>
          </div>
        </div>

        {items.length === 0 ? (
          <Card className="p-10 text-center border-dashed">
            <p className="text-muted-foreground">Esta pasta está vazia.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => {
              if (item.type === "product") {
                const p = productDetails[item.reference_id];
                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/cliente/produto/${item.reference_id}`)}
                  >
                    {p ? (
                      <>
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={p.imagens?.[0] || ""}
                            alt={p.nome}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium line-clamp-2">{p.nome}</p>
                          <p className="text-primary font-bold text-sm mt-1">
                            R$ {Number(p.preco).toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 flex items-center gap-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Produto</span>
                      </div>
                    )}
                  </Card>
                );
              } else {
                const s = supplierDetails[item.reference_id];
                return (
                  <Card
                    key={item.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/loja/${item.reference_id}`)}
                  >
                    {s ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={s.foto_perfil_url || ""}
                          alt={s.nome}
                          className="w-12 h-12 rounded-full object-cover border"
                        />
                        <div>
                          <p className="text-sm font-semibold">{s.nome}</p>
                          <p className="text-xs text-muted-foreground">Fornecedor</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Fornecedor</span>
                      </div>
                    )}
                  </Card>
                );
              }
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Pasta compartilhada via{" "}
          <a href="/" className="text-primary hover:underline">
            Nellor
          </a>
        </p>
      </main>
    </div>
  );
};

export default PastaPublica;
