import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Send, Paperclip, X, Download, Image as ImageIcon, Video, FileText } from "lucide-react";
import { useSupplierOrders } from "@/hooks/useSupplierOrders";
import { useMessages, MessageAttachment } from "@/hooks/useMessages";
import { toast } from "sonner";

const ChatFornecedor = () => {
  const { orders } = useSupplierOrders();
  const { sendMessage, getMessagesByStore } = useMessages();
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeCustomers = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const messages = selectedCustomer ? getMessagesByStore(parseInt(selectedCustomer)) : [];

  useEffect(() => {
    if (activeCustomers.length > 0 && !selectedCustomer) {
      setSelectedCustomer(activeCustomers[0].id.replace('#', ''));
    }
  }, [activeCustomers, selectedCustomer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: MessageAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} é muito grande. Tamanho máximo: 10MB`);
        continue;
      }

      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = (e) => {
          const url = e.target?.result as string;
          let type: 'image' | 'video' | 'file' = 'file';

          if (file.type.startsWith('image/')) type = 'image';
          else if (file.type.startsWith('video/')) type = 'video';

          newAttachments.push({
            type,
            url,
            name: file.name,
          });
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    toast.success(`${newAttachments.length} arquivo(s) adicionado(s)`);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownloadImage = () => {
    if (!viewingImage) return;
    
    const link = document.createElement('a');
    link.href = viewingImage.url;
    link.download = viewingImage.name || 'imagem.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Download iniciado");
  };

  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return;
    if (!selectedCustomer) return;

    sendMessage(parseInt(selectedCustomer), message, attachments);
    setMessage("");
    setAttachments([]);
    toast.success("Mensagem enviada!");
  };

  const selectedOrder = activeCustomers.find(c => c.id === '#' + selectedCustomer);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      {/* Lista de Conversas */}
      <Card className="lg:w-80 flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b bg-white sticky top-0">
          <h2 className="font-semibold text-lg">Conversas</h2>
        </div>
        <div className="divide-y">
          {activeCustomers.map((customer) => {
            const customerMessages = getMessagesByStore(parseInt(customer.id.replace('#', '')));
            const lastMessage = customerMessages[customerMessages.length - 1];
            const unreadCount = customerMessages.filter(m => !m.read && m.sender === 'store').length;

            return (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer.id.replace('#', ''))}
                className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedCustomer === customer.id.replace('#', '')
                    ? 'bg-primary/5 border-l-4 border-primary'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {customer.customerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">{customer.customerName}</h3>
                      {unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessage?.text || `Pedido ${customer.id}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{customer.date}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Área de Chat */}
      <Card className="flex-1 flex flex-col min-h-0">
        {selectedCustomer && selectedOrder ? (
          <>
            {/* Header do Chat */}
            <div className="border-b p-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {selectedOrder.customerName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{selectedOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    {msg.text && (
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          msg.sender === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-white rounded-bl-none shadow-sm'
                        }`}
                      >
                        <p className="break-words">{msg.text}</p>
                      </div>
                    )}
                    
                    {msg.attachments && msg.attachments.map((attachment, attIdx) => (
                      <div key={attIdx} className={`rounded-2xl overflow-hidden ${msg.sender === 'user' ? 'bg-primary/10' : 'bg-white shadow-sm'}`}>
                        {attachment.type === 'image' && (
                          <img 
                            src={attachment.url} 
                            alt={attachment.name}
                            className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setViewingImage({ url: attachment.url, name: attachment.name })}
                          />
                        )}
                        {attachment.type === 'video' && (
                          <video controls className="max-w-full h-auto rounded-lg">
                            <source src={attachment.url} />
                          </video>
                        )}
                        {attachment.type === 'file' && (
                          <a
                            href={attachment.url}
                            download={attachment.name}
                            className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                          >
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{attachment.name}</p>
                              <p className="text-xs text-muted-foreground">Clique para baixar</p>
                            </div>
                          </a>
                        )}
                      </div>
                    ))}
                    
                    <span className="text-xs text-muted-foreground px-2">
                      {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Preview de Anexos */}
            {attachments.length > 0 && (
              <div className="border-t p-3 bg-white">
                <div className="flex gap-2 overflow-x-auto">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      {att.type === 'image' ? (
                        <img src={att.url} alt={att.name} className="h-20 w-20 object-cover rounded-lg" />
                      ) : (
                        <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center">
                          {att.type === 'video' ? <Video className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                        </div>
                      )}
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input de Mensagem */}
            <div className="border-t p-4 bg-white">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Digite sua mensagem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!message.trim() && attachments.length === 0}>
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

      {/* Modal de Visualização de Imagem */}
      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center">
            {viewingImage && (
              <>
                <img 
                  src={viewingImage.url} 
                  alt={viewingImage.name}
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    onClick={handleDownloadImage}
                    className="bg-primary hover:bg-primary/90 gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewingImage(null)}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                  {viewingImage.name}
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatFornecedor;
