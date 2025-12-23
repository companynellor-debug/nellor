import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Package, MapPin, User, Tag } from "lucide-react";
import { CartItem } from "@/hooks/useCart";
import { BuyerData } from "./StepDadosComprador";

interface StepResumoProps {
  cartItems: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  buyerData: BuyerData;
  onBack: () => void;
  onNext: () => void;
}

export const StepResumo = ({
  cartItems,
  subtotal,
  shipping,
  discount,
  buyerData,
  onBack,
  onNext,
}: StepResumoProps) => {
  const total = subtotal + shipping - discount;

  // Group items by supplier
  const itemsBySupplier = cartItems.reduce((acc, item) => {
    const supplierId = item.storeId?.toString() || "unknown";
    if (!acc[supplierId]) {
      acc[supplierId] = {
        storeName: item.storeName || "Loja",
        items: [],
        subtotal: 0,
      };
    }
    acc[supplierId].items.push(item);
    acc[supplierId].subtotal += item.price * item.quantity;
    return acc;
  }, {} as Record<string, { storeName: string; items: CartItem[]; subtotal: number }>);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Customer Info */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Dados do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{buyerData.nome}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-medium">{buyerData.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
              <p className="font-medium">{buyerData.documento}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{buyerData.telefone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Address */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Endereço de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="font-medium">
              {buyerData.endereco?.street}, {buyerData.endereco?.number}
              {buyerData.endereco?.complement && ` - ${buyerData.endereco.complement}`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {buyerData.endereco?.neighborhood} - {buyerData.endereco?.city}/{buyerData.endereco?.state}
            </p>
            <p className="text-sm text-muted-foreground">
              CEP: {buyerData.endereco?.zip_code}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            Itens do Pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(itemsBySupplier).map(([supplierId, { storeName, items, subtotal: supplierSubtotal }]) => (
            <div key={supplierId} className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {storeName}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Subtotal: R$ {supplierSubtotal.toFixed(2).replace(".", ",")}
                </span>
              </div>
              
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 bg-muted/30 rounded-lg">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantidade: {item.quantity}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Preço unitário: R$ {item.price.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Separator />

          {/* Totals */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Frete</span>
              <span>R$ {shipping.toFixed(2).replace(".", ",")}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Desconto
                </span>
                <span>- R$ {discount.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-xl">
              <span>Total</span>
              <span className="text-primary">
                R$ {total.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 sm:flex-none"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 h-12 text-lg font-semibold"
        >
          Ir para Pagamento
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};
