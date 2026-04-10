import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Star, X, Plus, Store, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyFromDecimal } from "@/utils/currency";
import { Helmet } from "react-helmet";
import { DarkGlassIcon } from "@/components/ui/dark-glass-icon";
import { toast } from "sonner";

interface SupplierData {
  id: string;
  nome: string;
  foto_perfil_url: string | null;
  descricao_loja: string | null;
  avg_rating: number;
  total_reviews: number;
  total_products: number;
  avg_price: number;
  min_price: number;
  max_price: number;
}

const CompararFornecedores = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [suppliers, setSuppliers] = useState<(SupplierData | null)[]>([null, null, null]);
  const [allSuppliers, setAllSuppliers] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState<number | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");

  useEffect(() => {
    fetchAllSuppliers();
  }, []);

  useEffect(() => {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];
    if (ids.length > 0 && allSuppliers.length > 0) {
      const mapped = [0, 1, 2].map(i => {
        const id = ids[i];
        return id ? allSuppliers.find(s => s.id === id) || null : null;
      });
      setSuppliers(mapped);
    }
  }, [searchParams, allSuppliers]);

  const fetchAllSuppliers = async () => {
    try {
      // Use public view (bypasses RLS)
      const { data: profiles, error: profilesError } = await supabase
        .from("public_supplier_profiles")
        .select("id, nome, foto_perfil_url, descricao_loja");

      if (profilesError) {
        console.error("Error fetching supplier profiles:", profilesError);
        setLoading(false);
        return;
      }

      if (!profiles || profiles.length === 0) {
        setLoading(false);
        return;
      }

      const validProfiles = profiles.filter(
        (p): p is typeof p & { id: string; nome: string } => p.id !== null && p.nome !== null
      );

      // Fetch products for stats
      const { data: products } = await supabase
        .from("products")
        .select("supplier_id, preco")
        .eq("ativo", true);

      // Fetch reviews with product join to get supplier
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating, product_id, products!inner(supplier_id)");

      const suppliersData: SupplierData[] = validProfiles.map(p => {
        const supplierProducts = (products || []).filter(pr => pr.supplier_id === p.id);
        const supplierReviews = (reviews || []).filter((r: any) => r.products?.supplier_id === p.id);
        const prices = supplierProducts.map(pr => pr.preco).filter(Boolean);
        const ratings = supplierReviews.map((r: any) => r.rating).filter(Boolean);

        return {
          id: p.id,
          nome: p.nome,
          foto_perfil_url: p.foto_perfil_url,
          descricao_loja: p.descricao_loja,
          avg_rating: ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0,
          total_reviews: supplierReviews.length,
          total_products: supplierProducts.length,
          avg_price: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
          min_price: prices.length > 0 ? Math.min(...prices) : 0,
          max_price: prices.length > 0 ? Math.max(...prices) : 0,
        };
      });

      setAllSuppliers(suppliersData);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  const addSupplier = (index: number, supplier: SupplierData) => {
    if (suppliers.some(s => s?.id === supplier.id)) {
      toast.error("Este fornecedor já está na comparação");
      return;
    }
    const next = [...suppliers];
    next[index] = supplier;
    setSuppliers(next);
    setShowPicker(null);
    setPickerSearch("");
    const ids = next.filter(Boolean).map(s => s!.id).join(",");
    setSearchParams({ ids });
  };

  const removeSupplier = (index: number) => {
    const next = [...suppliers];
    next[index] = null;
    setSuppliers(next);
    const ids = next.filter(Boolean).map(s => s!.id).join(",");
    if (ids) setSearchParams({ ids });
    else setSearchParams({});
  };

  const selectedCount = suppliers.filter(Boolean).length;
  const filteredPickers = allSuppliers
    .filter(s => {
      const alreadySelected = suppliers.some(sel => sel?.id === s.id);
      const matchesSearch = pickerSearch
        ? s.nome.toLowerCase().includes(pickerSearch.toLowerCase())
        : true;
      return !alreadySelected && matchesSearch;
    })
    .sort(() => pickerSearch ? 0 : 0.5 - Math.random());

  const getBestValue = (field: keyof SupplierData, mode: "max" | "min") => {
    const vals = suppliers.filter(Boolean).map(s => ({ id: s!.id, val: s![field] as number }));
    if (vals.length === 0) return null;
    return mode === "max"
      ? vals.reduce((a, b) => (b.val > a.val ? b : a)).id
      : vals.reduce((a, b) => (b.val < a.val && b.val > 0 ? b : a)).id;
  };

  const bestRating = getBestValue("avg_rating", "max");
  const bestPrice = getBestValue("avg_price", "min");
  const bestProducts = getBestValue("total_products", "max");

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />
      <Helmet>
        <title>Comparar Fornecedores | Nellor</title>
      </Helmet>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="hover:bg-accent p-2 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Comparar Fornecedores</h1>
              <p className="text-xs text-muted-foreground">{selectedCount}/3 selecionados</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 space-y-4">
        {/* Supplier Slots */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => {
            const s = suppliers[i];
            return (
              <div key={i} className="relative">
                {s ? (
                  <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
                    <button
                      onClick={() => removeSupplier(i)}
                      className="absolute top-2 right-2 z-10 bg-destructive/90 text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <CardContent className="p-3 text-center">
                      <Avatar className="h-14 w-14 mx-auto mb-2 border-2 border-primary/20">
                        <AvatarImage src={s.foto_perfil_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {s.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-semibold text-foreground truncate">{s.nome}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-muted-foreground">{s.avg_rating.toFixed(1)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <button
                    onClick={() => setShowPicker(i)}
                    className="w-full border-2 border-dashed border-muted-foreground/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors min-h-[140px]"
                  >
                    <div className="bg-muted rounded-full p-2">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">Adicionar</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        {selectedCount >= 2 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <DarkGlassIcon icon={Store} size="sm" />
              Comparativo
            </h2>

            <ComparisonRow
              label="Avaliação"
              values={suppliers.map(s => s ? `${s.avg_rating.toFixed(1)} ★ (${s.total_reviews})` : null)}
              highlights={suppliers.map(s => s?.id === bestRating)}
            />
            <ComparisonRow
              label="Preço Médio"
              values={suppliers.map(s => s ? formatCurrencyFromDecimal(s.avg_price) : null)}
              highlights={suppliers.map(s => s?.id === bestPrice)}
            />
            <ComparisonRow
              label="Faixa de Preço"
              values={suppliers.map(s => s && s.min_price > 0
                ? `${formatCurrencyFromDecimal(s.min_price)} ~ ${formatCurrencyFromDecimal(s.max_price)}`
                : s ? "—" : null
              )}
              highlights={[false, false, false]}
            />
            <ComparisonRow
              label="Produtos"
              values={suppliers.map(s => s ? `${s.total_products}` : null)}
              highlights={suppliers.map(s => s?.id === bestProducts)}
            />

            <div className="grid grid-cols-3 gap-3 pt-2">
              {suppliers.map((s, i) =>
                s ? (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-xl"
                    onClick={() => navigate(`/cliente/loja/${s.id}`)}
                  >
                    Ver Loja
                  </Button>
                ) : <div key={i} />
              )}
            </div>
          </div>
        )}

        {selectedCount < 2 && (
          <Card className="border-0 shadow-md rounded-2xl">
            <CardContent className="p-6 text-center">
              <DarkGlassIcon icon={Store} size="md" className="mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Selecione pelo menos <strong>2 fornecedores</strong> para comparar preços, avaliações e localização lado a lado.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Supplier Picker Modal */}
      {showPicker !== null && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end" onClick={() => { setShowPicker(null); setPickerSearch(""); }}>
          <div
            className="bg-background w-full rounded-t-3xl max-h-[85vh] min-h-[60vh] flex flex-col animate-in slide-in-from-bottom"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Escolher Fornecedor</h3>
              <button onClick={() => { setShowPicker(null); setPickerSearch(""); }}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Digite o nome do fornecedor..."
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {filteredPickers.length} fornecedor{filteredPickers.length !== 1 ? "es" : ""} disponíve{filteredPickers.length !== 1 ? "is" : "l"}
              </p>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {loading ? (
                <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>
              ) : filteredPickers.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum fornecedor encontrado</p>
              ) : (
                filteredPickers.map(s => (
                  <button
                    key={s.id}
                    onClick={() => addSupplier(showPicker, s)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={s.foto_perfil_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {s.nome.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.nome}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          {s.avg_rating.toFixed(1)}
                        </span>
                        <span>•</span>
                        <span>{s.total_products} produtos</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

const ComparisonRow = ({
  label,
  values,
  highlights,
}: {
  label: string;
  values: (string | null)[];
  highlights: boolean[];
}) => (
  <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
    <CardContent className="p-0">
      <div className="bg-muted/30 px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="grid grid-cols-3 divide-x">
        {values.map((v, i) => (
          <div
            key={i}
            className={`px-3 py-3 text-center ${highlights[i] ? "bg-primary/5" : ""}`}
          >
            {v ? (
              <span className={`text-xs font-semibold ${highlights[i] ? "text-primary" : "text-foreground"}`}>
                {v}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default CompararFornecedores;
