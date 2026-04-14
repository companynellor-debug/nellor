import { useMemo, useEffect } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowLeft, Share2 } from "lucide-react";

import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { supabase } from "@/integrations/supabase/client";

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


  // Remove affiliate tracking params from URL if present
  useEffect(() => {
    const refCode = searchParams.get("ref") ?? searchParams.get("aff");
    if (refCode) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("ref");
      newParams.delete("aff");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

  if (loading || !products.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando produto...</p>
        </div>
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
                <div className="text-3xl font-bold">{formatCurrency(product.preco)}</div>
              </div>

              <div className="grid gap-2 pt-4">
                <Button onClick={() => navigate(`/loja/${product.supplier_id}`)}>
                  Ver loja
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const { data } = await supabase.auth.getSession();

                    // Se já estiver logado, vai direto para o produto (sem depender de querystring)
                    if (data.session) {
                      navigate(`/cliente/produto/${product.id}`);
                      return;
                    }

                    // Se não estiver logado, guarda o destino e manda pro login
                    navigate(`/auth?next=${encodeURIComponent(`/cliente/produto/${product.id}`)}`);
                  }}
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
