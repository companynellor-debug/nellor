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
  History,
  Store,
  CreditCard,
  ExternalLink,
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
  stripe_account_id: string | null;
}

interface AffiliateLink {
  id: string;
  code: string;
  clicks: number;
  conversions: number;
  product_id: string | null;
  supplier_id: string;
  product?: { nome: string; preco: number; imagens: string[]; affiliate_commission_percent?: number | null };
  supplierName?: string;
  defaultCommissionPercent?: number | null;
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

interface Commission {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  order_id: string;
  order?: { order_number: string; total: number };
}

interface ActiveSupplier {
  id: string;
  nome: string;
  foto_perfil_url: string | null;
  linkCount: number;
  conversions: number;
}

const ProgramaAfiliados = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [products, setProducts] = useState<AffiliableProduct[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [activeSuppliers, setActiveSuppliers] = useState<ActiveSupplier[]>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activatingAffiliate, setActivatingAffiliate] = useState(false);
  const [creatingLink, setCreatingLink] = useState<string | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);

  useEffect(() => {
    if (user) {
      void fetchAffiliateData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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

        // Fetch links with product info
        const { data: linksData } = await supabase
          .from("affiliate_links")
          .select("*, product:products(nome, preco, imagens, affiliate_commission_percent)")
          .eq("affiliate_id", affiliateData.id);

        const supplierIds = Array.from(
          new Set((linksData ?? []).map((l: any) => l.supplier_id))
        );

        const supplierNameById = new Map<string, string>();
        const supplierPhotoById = new Map<string, string | null>();
        const defaultCommissionBySupplier = new Map<string, number>();

        if (supplierIds.length > 0) {
          const [{ data: supplierRows }, { data: settingsData }] = await Promise.all([
            supabase
              .from("public_supplier_profiles")
              .select("id, nome, foto_perfil_url")
              .in("id", supplierIds),
            supabase
              .from("supplier_affiliate_settings")
              .select("supplier_id, default_commission_percent")
              .in("supplier_id", supplierIds),
          ]);

          (supplierRows ?? []).forEach((s: any) => {
            if (s?.id) {
              supplierNameById.set(s.id, s.nome ?? "");
              supplierPhotoById.set(s.id, s.foto_perfil_url);
            }
          });

          (settingsData ?? []).forEach((s: any) => {
            if (s?.supplier_id) {
              defaultCommissionBySupplier.set(s.supplier_id, s.default_commission_percent ?? 5);
            }
          });
        }

        const enrichedLinks = (linksData ?? []).map((l: any) => ({
          ...l,
          supplierName: supplierNameById.get(l.supplier_id) ?? "",
          defaultCommissionPercent: defaultCommissionBySupplier.get(l.supplier_id) ?? 5,
        })) as AffiliateLink[];

        setLinks(enrichedLinks);

        // Calculate active suppliers with real data
        const supplierStats = new Map<string, { linkCount: number; conversions: number }>();
        enrichedLinks.forEach((link) => {
          const existing = supplierStats.get(link.supplier_id) || { linkCount: 0, conversions: 0 };
          supplierStats.set(link.supplier_id, {
            linkCount: existing.linkCount + 1,
            conversions: existing.conversions + (link.conversions ?? 0),
          });
        });

        const activeSuppliersList: ActiveSupplier[] = [];
        supplierStats.forEach((stats, supplierId) => {
          activeSuppliersList.push({
            id: supplierId,
            nome: supplierNameById.get(supplierId) ?? "",
            foto_perfil_url: supplierPhotoById.get(supplierId) ?? null,
            linkCount: stats.linkCount,
            conversions: stats.conversions,
          });
        });
        setActiveSuppliers(activeSuppliersList);

        // Fetch real commissions
        const { data: commissionsData } = await supabase
          .from("affiliate_commissions")
          .select("id, amount, status, created_at, order_id")
          .eq("affiliate_id", affiliateData.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (commissionsData && commissionsData.length > 0) {
          // Fetch order details
          const orderIds = commissionsData.map((c) => c.order_id);
          const { data: ordersData } = await supabase
            .from("orders")
            .select("id, order_number, total")
            .in("id", orderIds);

          const orderById = new Map<string, { order_number: string; total: number }>();
          (ordersData ?? []).forEach((o: any) => {
            orderById.set(o.id, { order_number: o.order_number, total: o.total });
          });

          const enrichedCommissions = commissionsData.map((c) => ({
            ...c,
            order: orderById.get(c.order_id),
          }));
          setCommissions(enrichedCommissions);
        }
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
      const { data: generated } = await supabase.rpc("generate_affiliate_code");
      const code = typeof generated === "string" ? generated : generateCodeFallback();

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

  const copyLink = (code: string, productId?: string | null) => {
    // Link vai direto para o produto público com ref
    const basePath = productId ? `/p/${productId}` : '/';
    const link = `${window.location.origin}${basePath}?ref=${code}`;
    void navigator.clipboard.writeText(link);
    setCopiedLink(code);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const connectStripe = async () => {
    if (!affiliate) return;
    
    setConnectingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-connect-onboarding", {
        body: { 
          user_id: user?.id,
          account_type: "affiliate",
          affiliate_id: affiliate.id,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No onboarding URL returned");
      }
    } catch (error: any) {
      console.error("Error connecting Stripe:", error);
      toast.error("Erro ao conectar Stripe");
    } finally {
      setConnectingStripe(false);
    }
  };

  const getCommission = (product: AffiliableProduct) => {
    if (product.affiliate_commission_percent !== null) {
      return product.affiliate_commission_percent;
    }
    return product.defaultCommissionPercent ?? 5;
  };

  const getCommissionAmount = (product: AffiliableProduct, orderValue: number = 100) => {
    const commissionPercent = getCommission(product);
    return (orderValue * commissionPercent) / 100;
  };

  const hasLinkForProduct = (productId: string) => {
    return links.some((l) => l.product_id === productId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "confirmed":
        return <Badge variant="outline">Confirmada</Badge>;
      case "paid":
        return <Badge className="bg-green-500">Paga</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalConversions = links.reduce((acc, l) => acc + (l.conversions ?? 0), 0);
  const totalClicks = links.reduce((acc, l) => acc + (l.clicks ?? 0), 0);

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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cliente/perfil")}
            aria-label="Voltar para perfil"
          >
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
              Ganhe comissões indicando produtos para seus amigos e seguidores. A cada
              venda feita através do seu link, você recebe uma porcentagem.
            </p>
            <ul className="text-left space-y-3 mb-6">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary" />
                <span>Comissões de até 50% por venda</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary" />
                <span>Links personalizados para cada produto</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary" />
                <span>Receba direto na sua conta via Stripe</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary" />
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
          <div className="space-y-6">
            {/* Stripe Connect Banner */}
            {!affiliate.stripe_ready && (
              <Card className="p-4 border-amber-500/50 bg-amber-500/10">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-amber-600" />
                    <div>
                      <p className="font-medium text-foreground">Conecte seu Stripe</p>
                      <p className="text-sm text-muted-foreground">
                        Para receber suas comissões automaticamente
                      </p>
                    </div>
                  </div>
                  <Button onClick={connectStripe} disabled={connectingStripe} size="sm">
                    {connectingStripe ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Conectar
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-500" />
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
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendente</p>
                    <p className="text-xl font-bold">
                      R$ {Number(affiliate.pending_earnings ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendas</p>
                    <p className="text-xl font-bold">{totalConversions}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <LinkIcon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cliques</p>
                    <p className="text-xl font-bold">{totalClicks}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Tabs defaultValue="products" className="w-full">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="products">
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Produtos</span>
                </TabsTrigger>
                <TabsTrigger value="links">
                  <LinkIcon className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Links</span>
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Histórico</span>
                </TabsTrigger>
                <TabsTrigger value="suppliers">
                  <Store className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Lojas</span>
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
                    {products.map((product) => {
                      const commissionPercent = getCommission(product);
                      const simulatedOrderValue = 100;
                      const commissionAmount = getCommissionAmount(product, simulatedOrderValue);
                      
                      return (
                        <Card key={product.id} className="p-4">
                          <div className="flex gap-4">
                            <img
                              src={product.imagens?.[0] || "/placeholder.svg"}
                              alt={product.nome}
                              loading="lazy"
                              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold line-clamp-2 text-foreground">{product.nome}</h3>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {product.supplierName}
                              </p>
                              <p className="text-lg font-bold text-primary mt-1">
                                R$ {Number(product.preco ?? 0).toFixed(2)}
                              </p>
                              
                              {/* Commission details */}
                              <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Comissão:</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {commissionPercent}%
                                  </Badge>
                                </div>
                                <div className="mt-1.5 pt-1.5 border-t border-border/50">
                                  <p className="text-xs text-muted-foreground">
                                    Simulação: pedido de R$ {simulatedOrderValue.toFixed(2)}
                                  </p>
                                  <p className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1 mt-0.5">
                                    <DollarSign className="h-3.5 w-3.5" />
                                    Você ganha: R$ {commissionAmount.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col justify-center flex-shrink-0">
                              {hasLinkForProduct(product.id) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const link = links.find(
                                      (l) => l.product_id === product.id
                                    );
                                    if (link) copyLink(link.code, product.id);
                                  }}
                                  aria-label="Copiar link"
                                >
                                  {copiedLink ===
                                  links.find((l) => l.product_id === product.id)?.code ? (
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
                                    createAffiliateLink(product.id, product.supplier_id)
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
                      );
                    })}
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
                    {links.map((link) => {
                      const commissionPercent = link.product?.affiliate_commission_percent ?? link.defaultCommissionPercent ?? 5;
                      const simulatedOrderValue = 100;
                      const commissionAmount = (simulatedOrderValue * commissionPercent) / 100;

                      return (
                        <Card key={link.id} className="p-4">
                          <div className="flex gap-4">
                            <img
                              src={link.product?.imagens?.[0] || "/placeholder.svg"}
                              alt={link.product?.nome || "Produto"}
                              loading="lazy"
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium line-clamp-1">
                                {link.product?.nome || "Link do Produto"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {link.supplierName}
                              </p>
                              <div className="flex gap-4 mt-1 text-sm">
                                <span className="text-muted-foreground">
                                  {link.clicks ?? 0} cliques
                                </span>
                                <span className="text-muted-foreground">
                                  {link.conversions ?? 0} vendas
                                </span>
                              </div>
                              
                              {/* Commission details */}
                              <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Comissão:</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {commissionPercent}%
                                  </Badge>
                                </div>
                                <div className="mt-1.5 pt-1.5 border-t border-border/50">
                                  <p className="text-xs text-muted-foreground">
                                    Pedido de R$ {simulatedOrderValue.toFixed(2)} →
                                  </p>
                                  <p className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <DollarSign className="h-3.5 w-3.5" />
                                    Você ganha: R$ {commissionAmount.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col justify-center gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyLink(link.code, link.product_id)}
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
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Histórico de Comissões */}
              <TabsContent value="history" className="mt-4">
                {commissions.length === 0 ? (
                  <Card className="p-8 text-center">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma comissão registrada ainda
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Suas comissões aparecerão aqui quando houver vendas pelos seus links
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {commissions.map((commission) => (
                      <Card key={commission.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              Pedido #{commission.order?.order_number || "..."}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(commission.created_at).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            {commission.order?.total && (
                              <p className="text-xs text-muted-foreground">
                                Valor do pedido: R$ {Number(commission.order.total).toFixed(2)}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              + R$ {Number(commission.amount).toFixed(2)}
                            </p>
                            {getStatusBadge(commission.status)}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Fornecedores Ativos */}
              <TabsContent value="suppliers" className="mt-4">
                {activeSuppliers.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum fornecedor ativo
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Crie links de produtos para ver os fornecedores aqui
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {activeSuppliers.map((supplier) => (
                      <Card key={supplier.id} className="p-4">
                        <div className="flex items-center gap-4">
                          {supplier.foto_perfil_url ? (
                            <img
                              src={supplier.foto_perfil_url}
                              alt={supplier.nome}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Store className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-medium">{supplier.nome}</h3>
                            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{supplier.linkCount} links</span>
                              <span>{supplier.conversions} vendas</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/loja/${supplier.id}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
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
