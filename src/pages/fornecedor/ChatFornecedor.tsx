import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, X } from "lucide-react";
import { useSupplierOrders } from "@/hooks/useSupplierOrders";
import { toast } from "sonner";

const ChatFornecedor = () => {
  const { orders } = useSupplierOrders();
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(orders[0]?.customerEmail || null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ [key: string]: Array<{ sender: string; text: string; time: string }> }>({
    [orders[0]?.customerEmail]: [
      { sender: 'supplier', text: 'Olá! Seu pedido está sendo processado. Assim que for enviado, você receberá uma notificação 🚚.', time: '14:30' },
      { sender: 'customer', text: 'Obrigado! Quando devo esperar a entrega?', time: '14:35' },
    ],
  });

  const activeCustomers = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

  const handleSend = () => {
    if (!message.trim() || !selectedCustomer) return;

    const newMessage = {
      sender: 'supplier',
      text: message,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => ({
      ...prev,
      [selectedCustomer]: [...(prev[selectedCustomer] || []), newMessage],
    }));

    setMessage("");
    toast.success("Mensagem enviada!");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Chat com Clientes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
        {/* Lista de Conversas */}
        <Card className="lg:col-span-1 p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">Conversas Ativas</h2>
          <div className="space-y-2">
            {activeCustomers.map((customer) => (
              <div
                key={customer.customerEmail}
                onClick={() => setSelectedCustomer(customer.customerEmail)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedCustomer === customer.customerEmail
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <p className="font-medium">{customer.customerName}</p>
                <p className="text-sm opacity-70">{customer.id}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Área de Chat */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedCustomer ? (
            <>
              {/* Header do Chat */}
              <div className="border-b p-4">
                <p className="font-semibold">
                  {activeCustomers.find(c => c.customerEmail === selectedCustomer)?.customerName}
                </p>
                <p className="text-sm text-muted-foreground">{selectedCustomer}</p>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(messages[selectedCustomer] || []).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'supplier' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.sender === 'supplier'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className="text-xs mt-1 opacity-70">{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input de Mensagem */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Button size="icon" variant="outline">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <Button onClick={handleSend}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Selecione uma conversa para começar
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChatFornecedor;
