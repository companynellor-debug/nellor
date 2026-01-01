import { useState, useEffect, useMemo } from "react";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Link as LinkIcon,
  TrendingUp,
  DollarSign,
  Copy,
  Check,
  ChevronLeft,
  Sparkles,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";

interface AffiliateData {
  id: string;
  status: string;
  total_earnings: number;
  pending_earnings: number;
  stripe_ready: boolean;
}

interface AffiliateLink {
  id: string;
  code: string;
  clicks: number;
  conversions: number;
  product_id: string | null;
  supplier_id: string;
  product?: { nome: string; preco: number; imagens: string[] };
  supplierName?: string;
}

interface SupplierAffiliateSetting {
  supplier_id: string;
  default_commission_percent: number | null;
}

interface AffiliableProduct {
  id: string;
  nome: string;
  preco: number;
  imagens: string[];
  supplier_id: string;
  affiliate_commission_percent: number | null;
  supplierName?: string;
  defaultCommissionPercent?: number | null;
}

const ProgramaAfiliados = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [products, setProducts] = useState<AffiliableProduct[]>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activatingAffiliate, setActivatingAffiliate] = useState(false);
  const [creatingLink, setCreatingLink] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      void fetchAffiliateData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const supplierSettingsById = useMemo(() => {
    const map = new Map<string, SupplierAffiliateSetting>();
    for (const p of products) {
      // products already enriched, keep map build cheap
      map.set(p.supplier_id, {
        supplier_id: p.supplier_id,
        default_commission_percent: p.defaultCommissionPercent ?? null,
      });
    }
    return map;
  }, [products]);

  const fetchAffiliateData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Affiliate profile
      const { data: affiliateData } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (affiliateData) {
        setAffiliate(affiliateData as any);

        const { data: linksData } = await supabase
          .from("affiliate_links")
          .select("*, product:products(nome, preco, imagens)")
          .eq("affiliate_id", affiliateData.id);

        const supplierIds = Array.from(
          new Set((linksData ?? []).map((l: any) => l.supplier_id))
        );

        const supplierNameById = new Map<string, string>();
        if (supplierIds.length > 0) {
          const { data: supplierRows } = await supabase
            .from("public_supplier_profiles")
            .select("id, nome")
            .in("id", supplierIds);

          (supplierRows ?? []).forEach((s: any) => {
            if (s?.id) supplierNameById.set(s.id, s.nome ?? "");
          });
        }

        setLinks(
          (linksData ?? []).map((l: any) => ({
            ...l,
            supplierName: supplierNameById.get(l.supplier_id) ?? "",
          })) as AffiliateLink[]
        );
      }

      // Suppliers that allow affiliates
      const { data: settings } = await supabase
        .from("supplier_affiliate_settings")
        .select("supplier_id, default_commission_percent")
        .eq("allow_affiliates", true);

      const allowedSupplierIds = Array.from(
        new Set((settings ?? []).map((s: any) => s.supplier_id))
      ).filter(Boolean);

      if (allowedSupplierIds.length === 0) {
        setProducts([]);
        return;
      }

      const defaultCommissionBySupplier = new Map<string, number>();
      (settings ?? []).forEach((s: any) => {
        if (s?.supplier_id) {
          defaultCommissionBySupplier.set(
            s.supplier_id,
            s.default_commission_percent ?? 5
          );
        }
      });

      const { data: supplierRows } = await supabase
        .from("public_supplier_profiles")
        .select("id, nome")
        .in("id", allowedSupplierIds);

      const supplierNameById = new Map<string, string>();
      (supplierRows ?? []).forEach((s: any) => {
        if (s?.id) supplierNameById.set(s.id, s.nome ?? "");
      });

      const { data: productsData } = await supabase
        .from("products")
        .select("id, nome, preco, imagens, supplier_id, affiliate_commission_percent")
        .eq("ativo", true)
        .in("supplier_id", allowedSupplierIds);

      const enriched = (productsData ?? []).map((p: any) => ({
        ...p,
        supplierName: supplierNameById.get(p.supplier_id) ?? "",
        defaultCommissionPercent: defaultCommissionBySupplier.get(p.supplier_id) ?? 5,
      })) as AffiliableProduct[];

      setProducts(enriched);
    } catch (error) {
      console.error("Error fetching affiliate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const activateAffiliate = async () => {
    if (!user) return;

    setActivatingAffiliate(true);
    try {
      const { data, error } = await supabase
        .from("affiliates")
        .insert({
          user_id: user.id,
          status: "active",
          terms_accepted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setAffiliate(data as any);
      toast.success("Programa de afiliados ativado!");
      void fetchAffiliateData();
    } catch (error: any) {
      console.error("Error activating affiliate:", error);
      toast.error("Erro ao ativar programa");
    } finally {
      setActivatingAffiliate(false);
    }
  };

  const createAffiliateLink = async (productId: string, supplierId: string) => {
    if (!affiliate) return;

    setCreatingLink(productId);
    try {
      const { data: generated, error: genError } = await supabase.rpc(
        "generate_affiliate_code"
      );
      const code = typeof generated === "string" ? generated : generateCodeFallback();
      if (genError) {
        // fallback will still work
        console.warn("generate_affiliate_code failed, using fallback", genError);
      }

      const { data, error } = await supabase
        .from("affiliate_links")
        .insert({
          affiliate_id: affiliate.id,
          product_id: productId,
          supplier_id: supplierId,
          code,
        })
        .select("*, product:products(nome, preco, imagens)")
        .single();

      if (error) throw error;

      const { data: supplier } = await supabase
        .from("public_supplier_profiles")
        .select("id, nome")
        .eq("id", supplierId)
        .single();

      setLinks((prev) => [
        ...prev,
        { ...data, supplierName: (supplier as any)?.nome ?? "" } as AffiliateLink,
      ]);
      toast.success("Link de afiliado criado!");
    } catch (error: any) {
      console.error("Error creating affiliate link:", error);
      toast.error("Erro ao criar link");
    } finally {
      setCreatingLink(null);
    }
  };

  const generateCodeFallback = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/cliente/produtos?ref=${code}`;
    void navigator.clipboard.writeText(link);
    setCopiedLink(code);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getCommission = (product: AffiliableProduct) => {
    if (product.affiliate_commission_percent !== null) {
      return product.affiliate_commission_percent;
    }
    return product.defaultCommissionPercent ?? 5;
  };

  const hasLinkForProduct = (productId: string) => {
    return links.some((l) => l.product_id === productId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cliente/perfil")}
            aria-label="Voltar para perfil">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Programa de Afiliados</h1>
            <p className="text-sm text-muted-foreground">
              Ganhe comissões indicando produtos
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {!affiliate ? (
          <Card className="p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Seja um Afiliado</h2>
            <p className="text-muted-foreground mb-6">
              Ganhe comissões indicando produtos para seus amigos e seguidores.
              A cada venda feita através do seu link, você recebe uma porcentagem.
            </p>
            <Button
              onClick={activateAffiliate}
              disabled={activatingAffiliate}
              className="w-full"
              size="lg"
            >
              {activatingAffiliate ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-5 w-5 mr-2" />
              )}
              Ativar Programa de Afiliados
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ganhos Totais</p>
                    <p className="text-xl font-bold">
                      R$ {Number(affiliate.total_earnings ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendente</p>
                    <p className="text-xl font-bold">
                      R$ {Number(affiliate.pending_earnings ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <Tabs defaultValue="products" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="products">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Produtos
                </TabsTrigger>
                <TabsTrigger value="links">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Meus Links
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="mt-4">
                {products.length === 0 ? (
                  <Card className="p-8 text-center">
                    <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum produto disponível para afiliação no momento
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <Card key={product.id} className="p-4">
                        <div className="flex gap-4">
                          <img
                            src={product.imagens?.[0] || "/placeholder.svg"}
                            alt={product.nome}
                            loading="lazy"
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium line-clamp-1">
                              {product.nome}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {product.supplierName}
                            </p>
                            <p className="text-lg font-bold text-primary mt-1">
                              R$ {Number(product.preco ?? 0).toFixed(2)}
                            </p>
                            <Badge variant="secondary" className="mt-1">
                              {getCommission(product)}% de comissão
                            </Badge>
                          </div>
                          <div className="flex flex-col justify-center">
                            {hasLinkForProduct(product.id) ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const link = links.find(
                                    (l) => l.product_id === product.id
                                  );
                                  if (link) copyLink(link.code);
                                }}
                                aria-label="Copiar link"
                              >
                                {copiedLink ===
                                links.find((l) => l.product_id === product.id)
                                  ?.code ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={creatingLink === product.id}
                                onClick={() =>
                                  createAffiliateLink(
                                    product.id,
                                    product.supplier_id
                                  )
                                }
                                aria-label="Criar link"
                              >
                                {creatingLink === product.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <LinkIcon className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="links" className="mt-4">
                {links.length === 0 ? (
                  <Card className="p-8 text-center">
                    <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Você ainda não criou nenhum link de afiliado
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {links.map((link) => (
                      <Card key={link.id} className="p-4">
                        <div className="flex gap-4">
                          <img
                            src={link.product?.imagens?.[0] || "/placeholder.svg"}
                            alt={link.product?.nome || "Produto"}
                            loading="lazy"
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium line-clamp-1">
                              {link.product?.nome || "Link do Produto"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {link.supplierName}
                            </p>
                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="text-muted-foreground">
                                {link.clicks ?? 0} cliques
                              </span>
                              <span className="text-muted-foreground">
                                {link.conversions ?? 0} vendas
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyLink(link.code)}
                            >
                              {copiedLink === link.code ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ProgramaAfiliados;

          // Ativação do programa
          <Card className="p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Seja um Afiliado</h2>
            <p className="text-muted-foreground mb-6">
              Ganhe comissões indicando produtos para seus amigos e seguidores.
              A cada venda feita através do seu link, você recebe uma porcentagem.
            </p>
            <ul className="text-left space-y-3 mb-6">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Comissões de até 50% por venda</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Links personalizados para cada produto</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Receba direto na sua conta via Stripe</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Comissão recorrente por 4 meses</span>
              </li>
            </ul>
            <Button 
              onClick={activateAffiliate} 
              disabled={activatingAffiliate}
              className="w-full"
              size="lg"
            >
              {activatingAffiliate ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-5 w-5 mr-2" />
              )}
              Ativar Programa de Afiliados
            </Button>
          </Card>
        ) : (
          // Painel do afiliado
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ganhos Totais</p>
                    <p className="text-xl font-bold">R$ {affiliate.total_earnings.toFixed(2)}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendente</p>
                    <p className="text-xl font-bold">R$ {affiliate.pending_earnings.toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Stripe Connect Status */}
            {!affiliate.stripe_ready && (
              <Card className="p-4 border-yellow-500/50 bg-yellow-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Configure sua conta de recebimentos</p>
                    <p className="text-sm text-muted-foreground">
                      Para receber suas comissões, conecte sua conta Stripe
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="products">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Produtos
                </TabsTrigger>
                <TabsTrigger value="links">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Meus Links
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="mt-4">
                {products.length === 0 ? (
                  <Card className="p-8 text-center">
                    <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum produto disponível para afiliação no momento
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {products.map(product => (
                      <Card key={product.id} className="p-4">
                        <div className="flex gap-4">
                          <img 
                            src={product.imagens?.[0] || '/placeholder.svg'} 
                            alt={product.nome}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium line-clamp-1">{product.nome}</h3>
                            <p className="text-sm text-muted-foreground">
                              {product.supplier?.nome}
                            </p>
                            <p className="text-lg font-bold text-primary mt-1">
                              R$ {product.preco.toFixed(2)}
                            </p>
                            <Badge variant="secondary" className="mt-1">
                              {getCommission(product)}% de comissão
                            </Badge>
                          </div>
                          <div className="flex flex-col justify-center">
                            {hasLinkForProduct(product.id) ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const link = links.find(l => l.product_id === product.id);
                                  if (link) copyLink(link.code);
                                }}
                              >
                                {copiedLink === links.find(l => l.product_id === product.id)?.code ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={creatingLink === product.id}
                                onClick={() => createAffiliateLink(product.id, product.supplier_id)}
                              >
                                {creatingLink === product.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <LinkIcon className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="links" className="mt-4">
                {links.length === 0 ? (
                  <Card className="p-8 text-center">
                    <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Você ainda não criou nenhum link de afiliado
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {links.map(link => (
                      <Card key={link.id} className="p-4">
                        <div className="flex gap-4">
                          <img 
                            src={link.product?.imagens?.[0] || '/placeholder.svg'} 
                            alt={link.product?.nome || 'Produto'}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium line-clamp-1">
                              {link.product?.nome || 'Link da Loja'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {link.supplier?.nome}
                            </p>
                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="text-muted-foreground">
                                {link.clicks} cliques
                              </span>
                              <span className="text-green-600">
                                {link.conversions} vendas
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col justify-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyLink(link.code)}
                            >
                              {copiedLink === link.code ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ProgramaAfiliados;