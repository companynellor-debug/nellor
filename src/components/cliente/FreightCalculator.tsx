import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Package, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { formatCep, fetchAddressByCep } from "@/utils/viaCep";
import { useShippingCalculator, REGION_LABELS, ShippingRegion } from "@/hooks/useSupplierShipping";
import { formatCurrencyFromDecimal } from "@/utils/currency";

interface FreightCalculatorProps {
  supplierId: string;
  subtotal?: number;
}

interface FreightResult {
  available: boolean;
  price: number;
  freeAbove: number | null;
  allowsPickup: boolean;
  region: ShippingRegion | null;
  city?: string;
  state?: string;
  isFreeShipping: boolean;
}

export const FreightCalculator = ({ supplierId, subtotal = 0 }: FreightCalculatorProps) => {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FreightResult | null>(null);
  const [error, setError] = useState("");

  const { getShippingForSupplier } = useShippingCalculator();

  const handleCalculate = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setError("CEP inválido. Digite 8 números.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const address = await fetchAddressByCep(cleanCep);
      if (!address) {
        setError("CEP não encontrado. Verifique o número digitado.");
        return;
      }

      const shipping = await getShippingForSupplier(supplierId, address.uf);
      
      const isFreeShipping = shipping.freeAbove !== null && subtotal >= shipping.freeAbove;
      
      setResult({
        ...shipping,
        city: address.localidade,
        state: address.uf,
        isFreeShipping,
      });
    } catch {
      setError("Erro ao calcular frete. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Truck className="h-4 w-4 text-primary" />
        Calcular Frete
      </h3>
      
      <div className="flex gap-2">
        <Input
          value={cep}
          onChange={(e) => setCep(formatCep(e.target.value))}
          placeholder="00000-000"
          maxLength={9}
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
        />
        <Button 
          onClick={handleCalculate} 
          variant="outline" 
          disabled={loading}
          size="sm"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calcular"}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {result && (
        <Card className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{result.city}/{result.state}</span>
            {result.region && (
              <Badge variant="outline" className="text-xs">
                {REGION_LABELS[result.region]}
              </Badge>
            )}
          </div>

          {result.available ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Entrega</span>
                </div>
                {result.isFreeShipping ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Frete Grátis
                  </Badge>
                ) : (
                  <span className="font-bold text-primary">
                    {formatCurrencyFromDecimal(result.price)}
                  </span>
                )}
              </div>

              {result.freeAbove && !result.isFreeShipping && (
                <p className="text-xs text-green-600">
                  🎉 Frete grátis em compras acima de {formatCurrencyFromDecimal(result.freeAbove)}
                </p>
              )}

              {result.allowsPickup && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Retirada na fonte disponível (frete grátis)</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Este fornecedor não entrega na sua região.
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
