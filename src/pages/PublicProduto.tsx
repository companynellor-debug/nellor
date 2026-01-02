import { useMemo, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowLeft, Share2 } from "lucide-react";

import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { supabase } from "@/integrations/supabase/client";

const AFFILIATE_STORAGE_KEY = "nellor_affiliate_ref";
const VISITOR_ID_KEY = "nellor_visitor_id";

interface AffiliateAttribution {
  code: string;
  clickedAt: string;
  expiresAt: string;
  linkId: string;
  supplierId: string;
  affiliateId: string;
  productId?: string;
  isNewUser?: boolean;
}

function getOrCreateVisitorId(): string {
  const existing = localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(VISITOR_ID_KEY, id);
  return id;
}

function getStoredAttributions(): AffiliateAttribution[] {
  try {
    const stored = localStorage.getItem(AFFILIATE_STORAGE_KEY);
    if (!stored) return [];
    const attributions: AffiliateAttribution[] = JSON.parse(stored);
    const now = new Date();
    return attributions.filter((attr) => new Date(attr.expiresAt) > now);
  } catch {
    return [];
  }
}

const PublicProduto = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { products, loading } = useSupabaseProducts();

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);

  const publicBaseUrl = useMemo(() => {
    return window.location.origin;
  }, []);

  const productUrl = useMemo(() => `${publicBaseUrl}/p/${id}`, [publicBaseUrl, id]);

  // Track affiliate click when ref/aff param is present
  useEffect(() => {
    const refCode = searchParams.get("ref") ?? searchParams.get("aff");
    if (!refCode) return;

    const trackClick = async () => {
      try {
        const visitorId = getOrCreateVisitorId();
        const { data: auth } = await supabase.auth.getUser();

        const { data, error } = await supabase.rpc("track_affiliate_click", {
          _code: refCode,
          _buyer_id: auth.user?.id ?? null,
          _visitor_id: visitorId,
          _user_agent: navigator.userAgent,
        });

        const result =
          (data as {
            ok?: boolean;
            error?: string;
            clicked_at?: string;
            expires_at?: string;
            link_id?: string;
            supplier_id?: string;
            affiliate_id?: string;
            product_id?: string;
          } | null) ?? null;

        if (error || !result?.ok) {
          console.log("Affiliate click not tracked:", refCode, error?.message ?? result?.error);
          return;
        }

        const attribution: AffiliateAttribution = {
          code: refCode,
          clickedAt: result.clicked_at ?? new Date().toISOString(),
          expiresAt: result.expires_at ?? new Date().toISOString(),
          linkId: result.link_id ?? "",
          supplierId: result.supplier_id ?? "",
          affiliateId: result.affiliate_id ?? "",
          productId: result.product_id ?? id,
          isNewUser: !auth.user,
        };

        // Keep only one active attribution per supplier
        const existingRefs = getStoredAttributions();
        const filteredRefs = existingRefs.filter((ref) => ref.supplierId !== attribution.supplierId);
        filteredRefs.push(attribution);
        localStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(filteredRefs));
      } catch (error) {
        console.error("Error tracking affiliate click:", error);
      }
    };

    void trackClick();

    // Remove tracking param from URL without reload
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("ref");
    newParams.delete("aff");
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams, id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = productUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    toast({
      title: "Link copiado!",
      description: "Você pode colar no WhatsApp ou onde quiser.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Produto não encontrado</h1>
          <Button onClick={() => navigate("/")}>Voltar</Button>
        </div>
      </div>
    );
  }

  const title = `${product.nome} | Nellor`;
  const description = (product.descricao_curta || product.descricao_longa || "").slice(0, 160);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={productUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={productUrl} />
        <meta property="og:image" content={product.imagens?.[0] || ""} />
      </Helmet>

      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleCopyLink} className="gap-2">
              <Share2 className="h-4 w-4" />
              Copiar link
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10 max-w-4xl">
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="bg-muted">
              <img
                src={product.imagens?.[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=1200&fit=crop"}
                alt={`Foto do produto ${product.nome}`}
                className="w-full h-full object-cover aspect-square"
                loading="lazy"
              />
            </div>

            <div className="p-6 space-y-4">
              <h1 className="text-2xl font-bold leading-tight">{product.nome}</h1>
              {product.descricao_curta && (
                <p className="text-muted-foreground">{product.descricao_curta}</p>
              )}

              <div className="pt-2">
                <div className="text-3xl font-bold">R$ {product.preco.toFixed(2).replace(".", ",")}</div>
              </div>

              <div className="grid gap-2 pt-4">
                <Button onClick={() => navigate(`/loja/${product.supplier_id}`)}>
                  Ver loja
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(`/auth?next=${encodeURIComponent(`/cliente/produto/${product.id}`)}`)
                  }
                >
                  Entrar para comprar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default PublicProduto;
