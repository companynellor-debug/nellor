import { useState, useEffect } from "react";
import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, QrCode, Copy, MessageSquare, MapPin, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import { toast } from "sonner";
import { useStores } from "@/hooks/useStores";
import { useAddresses } from "@/hooks/useAddresses";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, getTotal, getStoreId } = useCart();
  const { createOrder } = useOrders();
  const { stores } = useStores();
  const { getDefaultAddress } = useAddresses();
  const { getDefaultPaymentMethod } = usePaymentMethods();
  
  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [orderId, setOrderId] = useState<string>("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'card'>('pix');
  
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

  // Preencher automaticamente com endereço padrão
  useEffect(() => {
    const defaultAddress = getDefaultAddress();
    if (defaultAddress) {
      setFormData({
        name: defaultAddress.name,
        document: defaultAddress.document,
        street: defaultAddress.street,
        number: defaultAddress.number,
        complement: defaultAddress.complement || "",
        neighborhood: defaultAddress.neighborhood,
        city: defaultAddress.city,
        state: defaultAddress.state,
        zipCode: defaultAddress.zipCode
      });
    }
  }, []);

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
  const discount = (total * appliedDiscount) / 100;
  const finalTotal = total + shipping - discount;

  const applyCoupon = () => {
    const coupons: { [key: string]: number } = {
      'NELLOR10': 10,
      'NELLOR20': 20,
      'PRIMEIRACOMPRA': 15
    };
    
    if (coupons[couponCode.toUpperCase()]) {
      setAppliedDiscount(coupons[couponCode.toUpperCase()]);
      toast.success(`Desconto de ${coupons[couponCode.toUpperCase()]}% aplicado`);
    } else {
      toast.error("Este cupom não existe ou expirou");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.document || !formData.street || 
        !formData.number || !formData.city || !formData.state || !formData.zipCode) {
      toast.error("Preencha todos os campos obrigatórios");
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

  const defaultPayment = getDefaultPaymentMethod();
  const pixKey = defaultPayment?.type === 'pix' ? defaultPayment.pixKey : "pix@nellor.com.br";

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey || "");
    toast.success("Chave Pix copiada para a área de transferência");
  };

  const handleSendProof = () => {
    toast.success("Pedido confirmado!");
    
    navigate('/cliente/pedido-confirmado', { 
      state: { orderId }
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
            {getDefaultAddress() && (
              <Card className="bg-green-50 border-green-200 p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900 mb-1">Endereço padrão carregado</p>
                    <p className="text-sm text-green-700">
                      Os dados do seu endereço padrão foram preenchidos automaticamente. 
                      Você pode editá-los antes de continuar.
                    </p>
                  </div>
                </div>
              </Card>
            )}

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
              <h3 className="font-bold text-lg mb-3">Cupom de Desconto</h3>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Digite o código do cupom"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <Button onClick={applyCoupon} variant="outline">
                  Aplicar
                </Button>
              </div>
              {appliedDiscount > 0 && (
                <p className="text-sm text-green-600">✓ Desconto de {appliedDiscount}% aplicado!</p>
              )}
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
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto ({appliedDiscount}%)</span>
                    <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
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
                <h3 className="font-bold text-xl mb-2">Escolha a Forma de Pagamento</h3>
                <p className="text-sm text-muted-foreground">
                  Pedido #{orderId}
                </p>
                <p className="text-2xl font-bold text-primary mt-2">
                  R$ {finalTotal.toFixed(2).replace('.', ',')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setSelectedPaymentMethod('pix')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPaymentMethod === 'pix'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <QrCode className={`h-8 w-8 mx-auto mb-2 ${
                    selectedPaymentMethod === 'pix' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className={`font-medium ${
                    selectedPaymentMethod === 'pix' ? 'text-primary' : 'text-foreground'
                  }`}>
                    Pix
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Aprovação imediata</p>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPaymentMethod === 'card'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <CreditCard className={`h-8 w-8 mx-auto mb-2 ${
                    selectedPaymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className={`font-medium ${
                    selectedPaymentMethod === 'card' ? 'text-primary' : 'text-foreground'
                  }`}>
                    Cartão
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Crédito ou débito</p>
                </button>
              </div>

              {selectedPaymentMethod === 'pix' ? (
                <>
                  {defaultPayment?.type === 'pix' && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CreditCard className="h-4 w-4" />
                        <p className="text-sm font-medium">Usando sua chave Pix padrão</p>
                      </div>
                    </div>
                  )}

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
                        <li>Finalize o pedido</li>
                      </ol>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {defaultPayment?.type === 'card' && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CreditCard className="h-4 w-4" />
                        <p className="text-sm font-medium">
                          Usando seu cartão padrão •••• {defaultPayment.cardNumber?.slice(-4)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="cardNumber">Número do Cartão</Label>
                      <Input
                        id="cardNumber"
                        placeholder="0000 0000 0000 0000"
                        defaultValue={defaultPayment?.type === 'card' ? defaultPayment.cardNumber : ''}
                        maxLength={19}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardHolder">Nome no Cartão</Label>
                      <Input
                        id="cardHolder"
                        placeholder="Nome como está no cartão"
                        defaultValue={defaultPayment?.type === 'card' ? defaultPayment.cardHolder : ''}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="cardExpiry">Validade</Label>
                        <Input
                          id="cardExpiry"
                          placeholder="MM/AA"
                          defaultValue={defaultPayment?.type === 'card' ? defaultPayment.cardExpiry : ''}
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardCvv">CVV</Label>
                        <Input
                          id="cardCvv"
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mt-4">
                    <p className="text-sm text-blue-900">
                      <strong>Pagamento Seguro:</strong>
                    </p>
                    <p className="text-sm text-blue-800 mt-1">
                      Seus dados são protegidos com criptografia de ponta a ponta.
                    </p>
                  </div>
                </>
              )}
            </Card>

            <Button 
              className="w-full bg-primary hover:bg-primary/90 py-6 text-lg gap-2"
              onClick={handleSendProof}
            >
              <MessageSquare className="h-5 w-5" />
              Finalizar Pedido
            </Button>

            <Button 
              variant="outline"
              className="w-full py-6 text-lg gap-2"
              onClick={() => {
                navigate('/cliente/chat', { 
                  state: { 
                    storeId,
                    message: `Olá! Tenho uma dúvida sobre o pedido #${orderId}.`
                  } 
                });
              }}
            >
              <MessageSquare className="h-5 w-5" />
              Falar com o Fornecedor
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {selectedPaymentMethod === 'pix' 
                ? 'Após o envio do comprovante, o fornecedor confirmará seu pagamento'
                : 'Seu pagamento será processado de forma segura'
              }
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Checkout;
