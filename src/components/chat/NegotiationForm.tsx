import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNegotiations } from '@/hooks/useNegotiations';

interface NegotiationFormProps {
  supplierId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SupplierProduct {
  id: string;
  nome: string;
  preco: number;
}

export const NegotiationForm = ({ supplierId, open, onOpenChange }: NegotiationFormProps) => {
  const { createNegotiation } = useNegotiations(supplierId);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [agreedPrice, setAgreedPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (!open || !supplierId) return;
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, nome, preco')
          .eq('supplier_id', supplierId)
          .eq('ativo', true)
          .order('nome');
        if (error) {
          console.error('Error fetching products:', error);
        }
        setProducts((data || []) as SupplierProduct[]);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [open, supplierId]);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setProductName(product.nome);
      if (!agreedPrice) setAgreedPrice(String(product.preco));
    }
  };

  const resetForm = () => {
    setSelectedProductId('');
    setProductName('');
    setQuantity(1);
    setAgreedPrice('');
    setPaymentMethod('pix');
    setExpectedDelivery('');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!productName.trim() || !agreedPrice || quantity < 1) return;
    setSubmitting(true);
    try {
      await createNegotiation({
        supplier_id: supplierId,
        product_id: selectedProductId || undefined,
        product_name: productName,
        quantity,
        agreed_price: parseFloat(agreedPrice),
        payment_method: paymentMethod,
        expected_delivery: expectedDelivery || undefined,
        notes: notes || undefined,
      });
      onOpenChange(false);
      resetForm();
    } catch {
      // error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Registrar Negociação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Produto negociado</Label>
            {loadingProducts ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando produtos...
              </div>
            ) : products.length > 0 ? (
              <Select value={selectedProductId} onValueChange={handleProductSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="Nome do produto"
              />
            )}
            {products.length > 0 && !selectedProductId && (
              <p className="text-xs text-muted-foreground mt-1">Selecione um produto para continuar</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label>Valor combinado (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={agreedPrice}
                onChange={e => setAgreedPrice(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <Label>Forma de pagamento combinada</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="transferencia">Transferência bancária</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">Apenas informativo — pagamento feito diretamente entre as partes</p>
          </div>

          <div>
            <Label>Data prevista de entrega</Label>
            <Input
              type="date"
              value={expectedDelivery}
              onChange={e => setExpectedDelivery(e.target.value)}
            />
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Detalhes adicionais da negociação..."
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !productName.trim() || !agreedPrice} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
            Registrar Negociação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
