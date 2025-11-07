import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, Truck, MapPin, Clock, User, Phone, Mail } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOrders } from "@/hooks/useOrders";
import { useEffect, useState } from "react";

const PedidoConfirmado = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders } = useOrders();
  const [order, setOrder] = useState<any>(null);

  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate("/cliente");
      return;
    }
    
    const foundOrder = orders.find(o => o.id === orderId);
    if (foundOrder) {
      setOrder(foundOrder);
    } else {
      navigate("/cliente");
    }
  }, [orderId, orders, navigate]);

  if (!order) {
    return null;
  }

  const getStatusStep = (status: string) => {
    const steps = {
      'pendente_pagamento': 0,
      'confirmado': 1,
      'preparando': 2,
      'enviado': 3,
      'entregue': 4
    };
    return steps[status as keyof typeof steps] || 0;
  };

  const currentStep = getStatusStep(order.status);

  const timelineSteps = [
    { 
      label: "Pedido Realizado", 
      status: "pendente_pagamento",
      icon: CheckCircle,
      description: "Aguardando confirmação de pagamento"
    },
    { 
      label: "Pagamento Confirmado", 
      status: "confirmado",
      icon: CheckCircle,
      description: "Pagamento aprovado com sucesso"
    },
    { 
      label: "Preparando Envio", 
      status: "preparando",
      icon: Package,
      description: "Seu pedido está sendo preparado"
    },
    { 
      label: "Em Transporte", 
      status: "enviado",
      icon: Truck,
      description: "Pedido saiu para entrega"
    },
    { 
      label: "Entregue", 
      status: "entregue",
      icon: MapPin,
      description: "Pedido foi entregue"
    }
  ];

  const getStatusColor = (stepIndex: number) => {
    if (stepIndex < currentStep) return "text-green-600 bg-green-100 border-green-600";
    if (stepIndex === currentStep) return "text-primary bg-primary/10 border-primary";
    return "text-muted-foreground bg-muted border-border";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary text-center">Pedido Confirmado</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10 max-w-2xl">
        {/* Confirmação */}
        <Card className="bg-white border shadow-sm p-6 mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Pedido Realizado com Sucesso!</h2>
          <p className="text-muted-foreground mb-4">
            Seu pedido foi registrado e está aguardando confirmação de pagamento
          </p>
          <div className="bg-accent p-3 rounded-lg inline-block">
            <p className="text-sm text-muted-foreground">Número do Pedido</p>
            <p className="text-xl font-bold text-primary">#{order.id}</p>
          </div>
        </Card>

        {/* Timeline de Acompanhamento */}
        <Card className="bg-white border shadow-sm p-6 mb-6">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Status do Pedido
          </h3>
          <div className="space-y-4">
            {timelineSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isPending = index > currentStep;

              return (
                <div key={step.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`rounded-full p-2 border-2 ${getStatusColor(index)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {index < timelineSteps.length - 1 && (
                      <div className={`w-0.5 h-12 ${isCompleted ? 'bg-green-600' : 'bg-border'}`} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className={`font-semibold ${isCurrent ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {isCurrent && (
                      <p className="text-xs text-primary mt-1">● Em andamento</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Detalhes do Pedido */}
        <Card className="bg-white border shadow-sm p-6 mb-6">
          <h3 className="font-bold text-lg mb-4">Detalhes do Pedido</h3>
          <div className="space-y-4">
            {order.items.map((item: any, index: number) => (
              <div key={index} className="flex gap-3 pb-4 border-b last:border-0">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm mb-1">{item.name}</p>
                  <p className="text-xs text-muted-foreground mb-1">
                    Quantidade: {item.quantity}
                  </p>
                  <p className="font-bold text-primary">
                    R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Informações de Entrega */}
        <Card className="bg-white border shadow-sm p-6 mb-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Endereço de Entrega
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p className="text-muted-foreground">CPF/CNPJ: {order.shippingAddress.document}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-muted-foreground">
                {order.shippingAddress.street}, {order.shippingAddress.number}
                {order.shippingAddress.complement && `, ${order.shippingAddress.complement}`}
                <br />
                {order.shippingAddress.neighborhood} - {order.shippingAddress.city}/{order.shippingAddress.state}
                <br />
                CEP: {order.shippingAddress.zipCode}
              </p>
            </div>
          </div>
        </Card>

        {/* Resumo de Valores */}
        <Card className="bg-white border shadow-sm p-6 mb-6">
          <h3 className="font-bold text-lg mb-4">Resumo de Valores</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>R$ {order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span>R$ 15,00</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span>Total Pago</span>
              <span className="text-primary">R$ {order.total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </Card>

        {/* Informações da Loja */}
        <Card className="bg-white border shadow-sm p-6 mb-6">
          <h3 className="font-bold text-lg mb-4">Informações do Fornecedor</h3>
          <p className="font-medium mb-3">{order.storeName}</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Em caso de dúvidas, entre em contato pelo chat
            </p>
            <Button 
              variant="outline" 
              className="w-full mt-3"
              onClick={() => navigate('/cliente/chat', { state: { storeId: order.storeId } })}
            >
              Falar com o Fornecedor
            </Button>
          </div>
        </Card>

        {/* Botões de Ação */}
        <div className="space-y-3">
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-white"
            onClick={() => navigate('/cliente/meus-pedidos')}
          >
            Acompanhar Pedido
          </Button>
          <Button 
            variant="outline"
            className="w-full"
            onClick={() => navigate('/cliente')}
          >
            Voltar para Home
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default PedidoConfirmado;
