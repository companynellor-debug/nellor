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
  Eye,
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
        .maybeSingle();

      if (affiliateData) {
        // Check if registration is complete (has stripe_ready or step 4)
        const registrationComplete = affiliateData.stripe_ready || (affiliateData as any).registration_step >= 4;
        
        if (!registrationComplete) {
          // Redirect to registration flow to continue
          navigate("/cliente/afiliados/cadastro");
          return;
        }
        
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
      {/* Header - Shopee style */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cliente/perfil")}
            className="text-primary-foreground hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-primary-foreground">Central do Afiliado</h1>
          </div>
          {affiliate && (
            <Badge className="bg-white/20 text-primary-foreground border-0">
              {affiliate.stripe_ready ? "Ativo" : "Pendente"}
            </Badge>
          )}
        </div>
      </header>

      <main className="relative z-10">
        {!affiliate ? (
          <div className="container mx-auto px-4 py-6">
            <Card className="p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Seja um Afiliado</h2>
              <p className="text-muted-foreground mb-6">
                Ganhe comissões indicando produtos para seus amigos e seguidores.
              </p>
              <ul className="text-left space-y-3 mb-6 max-w-sm mx-auto">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Comissões de até 50% por venda</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Links personalizados</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Pagamento automático via Stripe</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Comissão recorrente por 4 meses</span>
                </li>
              </ul>
              <Button
                onClick={() => navigate("/cliente/afiliados/cadastro")}
                className="w-full max-w-sm"
                size="lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Começar Agora
              </Button>
            </Card>
          </div>
        ) : (
          <>
            {/* Stats Banner - Shopee style */}
            <div className="bg-gradient-to-r from-primary to-primary/80 pb-16 pt-4">
              <div className="container mx-auto px-4">
                {/* Stripe Warning */}
                {!affiliate.stripe_ready && (
                  <div className="mb-4 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-white" />
                        <span className="text-sm text-white font-medium">Conecte seu Stripe para receber</span>
                      </div>
                      <Button 
                        onClick={connectStripe} 
                        disabled={connectingStripe} 
                        size="sm"
                        variant="secondary"
                        className="h-8"
                      >
                        {connectingStripe ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conectar"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <p className="text-xs text-white/70 mb-1">Ganhos Totais</p>
                    <p className="text-2xl font-bold text-white">
                      R$ {Number(affiliate.total_earnings ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <p className="text-xs text-white/70 mb-1">A Receber</p>
                    <p className="text-2xl font-bold text-white">
                      R$ {Number(affiliate.pending_earnings ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards - Overlapping */}
            <div className="container mx-auto px-4 -mt-10">
              <Card className="p-4 shadow-lg">
                <div className="grid grid-cols-3 divide-x divide-border">
                  <div className="text-center px-2">
                    <p className="text-2xl font-bold text-foreground">{totalConversions}</p>
                    <p className="text-xs text-muted-foreground">Vendas</p>
                  </div>
                  <div className="text-center px-2">
                    <p className="text-2xl font-bold text-foreground">{totalClicks}</p>
                    <p className="text-xs text-muted-foreground">Cliques</p>
                  </div>
                  <div className="text-center px-2">
                    <p className="text-2xl font-bold text-foreground">{links.length}</p>
                    <p className="text-xs text-muted-foreground">Links</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tabs - Shopee style horizontal scroll */}
            <div className="container mx-auto px-4 mt-6">
              <Tabs defaultValue="products" className="w-full">
                <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-xl grid grid-cols-4">
                  <TabsTrigger 
                    value="products" 
                    className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-background rounded-lg"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    <span className="text-xs">Produtos</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="links" 
                    className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-background rounded-lg"
                  >
                    <LinkIcon className="h-5 w-5" />
                    <span className="text-xs">Meus Links</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-background rounded-lg"
                  >
                    <DollarSign className="h-5 w-5" />
                    <span className="text-xs">Comissões</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="suppliers" 
                    className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-background rounded-lg"
                  >
                    <Store className="h-5 w-5" />
                    <span className="text-xs">Lojas</span>
                  </TabsTrigger>
                </TabsList>

                {/* Products Tab */}
                <TabsContent value="products" className="mt-4 space-y-3">
                  {products.length === 0 ? (
                    <Card className="p-8 text-center">
                      <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Nenhum produto disponível</p>
                    </Card>
                  ) : (
                    products.map((product) => {
                      const commissionPercent = getCommission(product);
                      const hasLink = hasLinkForProduct(product.id);
                      
                      return (
                        <Card key={product.id} className="overflow-hidden">
                          <div className="flex">
                            <img
                              src={product.imagens?.[0] || "/placeholder.svg"}
                              alt={product.nome}
                              loading="lazy"
                              className="w-28 h-28 object-cover flex-shrink-0"
                            />
                            <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                              <div>
                                <h3 className="font-medium text-sm line-clamp-2 text-foreground">{product.nome}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">{product.supplierName}</p>
                              </div>
                              <div className="flex items-end justify-between gap-2">
                                <div>
                                  <p className="text-lg font-bold text-primary">
                                    R$ {Number(product.preco ?? 0).toFixed(2)}
                                  </p>
                                  <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-0 text-xs">
                                    {commissionPercent}% comissão
                                  </Badge>
                                </div>
                                {hasLink ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const link = links.find((l) => l.product_id === product.id);
                                      if (link) copyLink(link.code, product.id);
                                    }}
                                    className="h-8"
                                  >
                                    {copiedLink === links.find((l) => l.product_id === product.id)?.code ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <>
                                        <Copy className="h-4 w-4 mr-1" />
                                        <span className="text-xs">Copiar</span>
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    disabled={creatingLink === product.id}
                                    onClick={() => createAffiliateLink(product.id, product.supplier_id)}
                                    className="h-8"
                                  >
                                    {creatingLink === product.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <LinkIcon className="h-4 w-4 mr-1" />
                                        <span className="text-xs">Criar Link</span>
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </TabsContent>

                {/* Links Tab */}
                <TabsContent value="links" className="mt-4 space-y-3">
                  {links.length === 0 ? (
                    <Card className="p-8 text-center">
                      <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Nenhum link criado ainda</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Vá em Produtos e crie seu primeiro link
                      </p>
                    </Card>
                  ) : (
                    links.map((link) => (
                      <Card key={link.id} className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={link.product?.imagens?.[0] || "/placeholder.svg"}
                            alt={link.product?.nome || "Produto"}
                            loading="lazy"
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm line-clamp-1">{link.product?.nome || "Produto"}</h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {link.clicks ?? 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <ShoppingBag className="h-3 w-3" /> {link.conversions ?? 0}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => copyLink(link.code, link.product_id)}
                          >
                            {copiedLink === link.code ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* Commissions Tab */}
                <TabsContent value="history" className="mt-4 space-y-3">
                  {commissions.length === 0 ? (
                    <Card className="p-8 text-center">
                      <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Nenhuma comissão ainda</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Compartilhe seus links para começar a ganhar
                      </p>
                    </Card>
                  ) : (
                    commissions.map((commission) => (
                      <Card key={commission.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Pedido #{commission.order?.order_number || "..."}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(commission.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600 dark:text-green-400">
                              +R$ {Number(commission.amount).toFixed(2)}
                            </p>
                            {getStatusBadge(commission.status)}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* Suppliers Tab */}
                <TabsContent value="suppliers" className="mt-4 space-y-3">
                  {activeSuppliers.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Nenhuma loja vinculada</p>
                    </Card>
                  ) : (
                    activeSuppliers.map((supplier) => (
                      <Card key={supplier.id} className="p-3">
                        <div className="flex items-center gap-3">
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
                            <h3 className="font-medium text-sm">{supplier.nome}</h3>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                              <span>{supplier.linkCount} links</span>
                              <span>{supplier.conversions} vendas</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => navigate(`/cliente/loja/${supplier.id}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ProgramaAfiliados;
