import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  ArrowLeft, Check, CheckCheck, X, Loader2, Package,
  ChevronDown, ChevronUp, Edit3, AlertCircle, Sparkles, PartyPopper,
} from "lucide-react";

const BACKEND_URL = (import.meta.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

interface ParsedProduct {
  id: string;
  import_id: string;
  parsed_data: {
    name: string;
    description: string;
    price: number | null;
    min_order: number | null;
    brand: string | null;
    variations: string[];
    category: string;
    sale_unit: string;
    image_url?: string;
    confidence: "alta" | "media" | "baixa";
  };
  status: string;
}

interface Props {
  importId: string;
  productsFound: number;
  supplierId: string;
  onBack: () => void;
  onComplete: () => void;
}

const confidenceColors: Record<string, string> = {
  alta: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  media: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  baixa: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const confidenceLabels: Record<string, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export default function ImportPreview({ importId, productsFound, supplierId, onBack, onComplete }: Props) {
  const [products, setProducts] = useState<ParsedProduct[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; drafts: number } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [importId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/catalog/imports/${importId}/products`);
      const data = await resp.json();
      setProducts(data);
      setSelected(new Set(data.map((p: ParsedProduct) => p.id)));
    } catch {
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(products.map((p) => p.id)));
  const deselectAll = () => setSelected(new Set());

  const updateParsedField = (productId: string, field: string, value: any) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, parsed_data: { ...p.parsed_data, [field]: value } }
          : p
      )
    );
  };

  const handleImport = async () => {
    if (selected.size === 0) {
      toast.error("Selecione pelo menos um produto");
      return;
    }

    setImporting(true);
    try {
      // Save any edits first
      for (const prod of products) {
        if (selected.has(prod.id)) {
          await fetch(`${BACKEND_URL}/api/catalog/import-product/${prod.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parsed_data: prod.parsed_data }),
          });
        }
      }

      const resp = await fetch(`${BACKEND_URL}/api/catalog/imports/${importId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_product_ids: Array.from(selected),
          supplier_id: supplierId,
        }),
      });
      const result = await resp.json();
      setImportResult(result);
      toast.success(`${result.imported} produtos importados!`);
    } catch (err: any) {
      toast.error("Erro ao importar: " + (err.message || ""));
    } finally {
      setImporting(false);
    }
  };

  // ──── Completion screen ────
  if (importResult) {
    const activCount = importResult.imported - importResult.drafts;
    return (
      <div className="p-6 space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <PartyPopper className="h-8 w-8 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Importação concluída!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activCount > 0 && <><strong>{activCount}</strong> produtos importados com sucesso! </>}
            {importResult.drafts > 0 && (
              <><strong>{importResult.drafts}</strong> produtos salvos como rascunho — complete as informações faltantes.</>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={onComplete} className="gap-1">
            <Package className="h-4 w-4" />
            Ver meus produtos
          </Button>
        </div>
      </div>
    );
  }

  // ──── Loading ────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Encontramos {products.length} produtos
            </h2>
            <p className="text-xs text-muted-foreground">
              Revise, edite e selecione os produtos que deseja importar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll} className="gap-1">
            <CheckCheck className="h-3.5 w-3.5" /> Selecionar Todos
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll} className="gap-1">
            <X className="h-3.5 w-3.5" /> Desmarcar Todos
          </Button>
          <Badge variant="secondary" className="ml-auto">
            {selected.size}/{products.length} selecionados
          </Badge>
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {products.map((product) => {
          const p = product.parsed_data;
          const isSelected = selected.has(product.id);
          const isExpanded = expanded === product.id;

          return (
            <Card
              key={product.id}
              className={`overflow-hidden transition-all ${isSelected ? "border-primary/50 shadow-sm" : "opacity-60"}`}
            >
              {/* Compact view */}
              <div className="p-3 flex items-center gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelect(product.id)}
                />

                {p.image_url ? (
                  <img src={p.image_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0 bg-muted" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name || "Sem nome"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.price !== null && p.price > 0 && (
                      <span className="text-xs font-semibold text-primary">R$ {Number(p.price).toFixed(2)}</span>
                    )}
                    {p.category && <span className="text-[10px] text-muted-foreground">{p.category}</span>}
                  </div>
                </div>

                <Badge className={`text-[10px] shrink-0 ${confidenceColors[p.confidence] || ""}`}>
                  {confidenceLabels[p.confidence] || p.confidence}
                </Badge>

                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setExpanded(isExpanded ? null : product.id)}
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {/* Expanded edit view */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Nome</label>
                      <Input
                        value={p.name}
                        onChange={(e) => updateParsedField(product.id, "name", e.target.value)}
                        className="mt-0.5 h-9"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Preço (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={p.price ?? ""}
                        onChange={(e) => updateParsedField(product.id, "price", parseFloat(e.target.value) || null)}
                        className="mt-0.5 h-9"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Marca</label>
                      <Input
                        value={p.brand ?? ""}
                        onChange={(e) => updateParsedField(product.id, "brand", e.target.value)}
                        className="mt-0.5 h-9"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Categoria</label>
                      <Input
                        value={p.category}
                        onChange={(e) => updateParsedField(product.id, "category", e.target.value)}
                        className="mt-0.5 h-9"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Qtd. Mínima</label>
                      <Input
                        type="number"
                        value={p.min_order ?? ""}
                        onChange={(e) => updateParsedField(product.id, "min_order", parseInt(e.target.value) || null)}
                        className="mt-0.5 h-9"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Unidade de Venda</label>
                      <Input
                        value={p.sale_unit}
                        onChange={(e) => updateParsedField(product.id, "sale_unit", e.target.value)}
                        className="mt-0.5 h-9"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Descrição</label>
                    <Textarea
                      value={p.description}
                      onChange={(e) => updateParsedField(product.id, "description", e.target.value)}
                      className="mt-0.5"
                      rows={3}
                    />
                  </div>
                  {p.variations && p.variations.length > 0 && (
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Variações</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.variations.map((v, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border shrink-0 bg-background">
        <Button
          className="w-full h-11 text-base"
          disabled={selected.size === 0 || importing}
          onClick={handleImport}
        >
          {importing ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Importando...</>
          ) : (
            <><Check className="h-4 w-4 mr-2" /> Importar {selected.size} produto{selected.size !== 1 ? "s" : ""} selecionado{selected.size !== 1 ? "s" : ""}</>
          )}
        </Button>
      </div>
    </div>
  );
}
