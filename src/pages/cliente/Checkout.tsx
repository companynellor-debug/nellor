import { useState } from "react";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, QrCode, Copy, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import { toast } from "@/hooks/use-toast";
import { stores } from "@/data/stores";

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, getTotal, getStoreId } = useCart();
  const { createOrder } = useOrders();
  
  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [orderId, setOrderId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    name: "",
    document: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: ""
  });

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <ParticlesBackground />
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => navigate("/cliente/carrinho")} className="hover:bg-accent p-2 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-primary">Checkout</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 relative z-10">
          <Card className="bg-white border shadow-sm p-8 text-center">
            <p className="text-muted-foreground">Seu carrinho está vazio</p>
            <Button className="mt-4" onClick={() => navigate("/cliente/produtos")}>
              Ir para Produtos
            </Button>
          </Card>
        </main>
        <BottomNav />
      </div>
    );
  }

  const storeId = getStoreId();
  const store = stores.find(s => s.id === storeId);
  const total = getTotal();
  const shipping = 15.00;
  const finalTotal = total + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.document || !formData.street || 
        !formData.number || !formData.city || !formData.state || !formData.zipCode) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const order = createOrder({
      total: finalTotal,
      status: 'pendente_pagamento',
      items: cartItems.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      storeId: storeId!,
      storeName: store?.name || "",
      shippingAddress: formData
    });

    setOrderId(order.id);
    setStep('payment');
  };

  const pixKey = "pix@nellor.com.br";

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    toast({
      title: "Copiado!",
      description: "Chave Pix copiada para a área de transferência"
    });
  };

  const handleSendProof = () => {
    clearCart();
    navigate('/cliente/chat', { 
      state: { 
        storeId,
        message: `Olá! Realizei o pagamento do pedido #${orderId}. Segue o comprovante em anexo.`
      } 
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button 
            onClick={() => step === 'payment' ? setStep('address') : navigate("/cliente/carrinho")} 
            className="hover:bg-accent p-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-primary">
            {step === 'address' ? 'Dados de Entrega' : 'Pagamento'}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10 max-w-2xl">
        {step === 'address' ? (
          <form onSubmit={handleSubmitAddress} className="space-y-4">
            <Card className="bg-white border shadow-sm p-4">
              <h3 className="font-bold text-lg mb-4">Informações Pessoais</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="document">CPF/CNPJ *</Label>
                  <Input
                    id="document"
                    name="document"
                    value={formData.document}
                    onChange={handleInputChange}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-white border shadow-sm p-4">
              <h3 className="font-bold text-lg mb-4">Endereço de Entrega</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="zipCode">CEP *</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="00000-000"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label htmlFor="street">Rua *</Label>
                    <Input
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div>
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      name="number"
                      value={formData.number}
                      onChange={handleInputChange}
                      placeholder="123"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    name="complement"
                    value={formData.complement}
                    onChange={handleInputChange}
                    placeholder="Apto, bloco, etc"
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    placeholder="Nome do bairro"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Sua cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">UF *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white border shadow-sm p-4">
              <h3 className="font-bold text-lg mb-3">Resumo do Pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span>R$ {shipping.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-primary">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </Card>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 py-6 text-lg">
              Continuar para Pagamento
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <Card className="bg-white border shadow-sm p-6">
              <div className="text-center mb-6">
                <h3 className="font-bold text-xl mb-2">Pagamento via Pix</h3>
                <p className="text-sm text-muted-foreground">
                  Pedido #{orderId}
                </p>
                <p className="text-2xl font-bold text-primary mt-2">
                  R$ {finalTotal.toFixed(2).replace('.', ',')}
                </p>
              </div>

              <div className="bg-accent p-4 rounded-lg mb-4 flex items-center justify-center">
                <QrCode className="h-48 w-48 text-muted-foreground" />
              </div>

              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Chave Pix</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm">{pixKey}</p>
                    <Button size="sm" variant="ghost" onClick={copyPixKey}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Instruções:</strong>
                  </p>
                  <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                    <li>Abra o app do seu banco</li>
                    <li>Escolha pagar via Pix QR Code ou Chave</li>
                    <li>Escaneie o código ou copie a chave</li>
                    <li>Confirme o pagamento</li>
                    <li>Envie o comprovante no chat</li>
                  </ol>
                </div>
              </div>
            </Card>

            <Button 
              className="w-full bg-primary hover:bg-primary/90 py-6 text-lg gap-2"
              onClick={handleSendProof}
            >
              <MessageSquare className="h-5 w-5" />
              Enviar Comprovante no Chat
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Após o envio do comprovante, o fornecedor confirmará seu pagamento
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Checkout;
